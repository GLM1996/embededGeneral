import React, { useEffect, useState, useCallback } from 'react'
import { updatePeople } from '../../config/funciones'
import { useAppContext } from '../../context/AppContext'
import { CustomSplits } from '../../config/CustomFields';
import { getCustomFields } from '../../config/funciones';
import moment from 'moment-timezone'

const VaAsign = () => {
  const [loading, setLoading] = useState(false)
  const { context, person } = useAppContext()
  const [choices, setChoices] = useState([]);
  const [needVa, setNeedVa] = useState(true)
  const [statusReturnVa, setStatusReturnVa] = useState(false)
  const [formData, setFormData] = useState({
    language: '',
    comments: '',
  })
  const [dataHistory, setDataHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [split, setSplit] = useState()

  const isBroker = context?.user?.role === "Broker";
  const splitType = person.customRRealtorSOILeadRefferalLeadCompanyLead

  //Agregar tambien la carga de datos desde Mongo DB para el history
  useEffect(() => {
    const fetchData = async () => {
      try {
        // const dataSplits = await getCustomFields(CustomSplits);
        // const response = await fetch("https://n8n.homelasvegasnevada.com/webhook/cc7d0495-3874-4a06-8c7e-f2c92fe4bf55", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json"  // CORREGIDO: era "application.json"
        //   },
        //   body: JSON.stringify({ id: person.id })  // CORREGIDO: envolver en objeto y usar JSON.stringify
        // });
        setLoading(true)
        const [dataSplits, response] = await Promise.all([
          getCustomFields(CustomSplits),
          fetch("https://n8n.homelasvegasnevada.com/webhook/cc7d0495-3874-4a06-8c7e-f2c92fe4bf55", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"  // CORREGIDO: era "application.json"
            },
            body: JSON.stringify({ personId: person.id })  // CORREGIDO: envolver en objeto y usar JSON.stringify
          })
        ]);

        const result = await response.json();

        if (dataSplits) setChoices(dataSplits);
        if (dataHistory) setDataHistory(result?.data || []);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false)
      }
    };
    if (person) {
      fetchData();
      handleChange("language", person?.customClientLanguage)

      if (person?.customVaAsignStatus === "Active") {
        setNeedVa(false)
      }
      if (person?.customVaAsignNotification) {
        setStatusReturnVa(true)
      }
    }
  }, [person]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async () => {
    try {
      if (!context?.user?.id) {
        throw new Error("No se encontró el usuario en el contexto");
      }

      const isSpanish = formData.language === "Spanish";
      const newTag = isSpanish ? "VaAsignSpanish" : "VaAsignEnglish";

      //const tags = [...new Set([...(person.tags || []), newTag])];
      const tags = [
        ...(person.tags || []).filter(
          (tag) => tag !== "VaAsignSpanish" && tag !== "VaAsignEnglish"
        ),
        newTag,
      ];
      const userAsCollaborator = {
        id: person?.assignedUserId,
        name: person?.assignedTo
      }

      const data = {
        clientId: person.id,
        customClientLanguage: formData?.language || person?.customClientLanguage,
        note: formData?.comments || "Not Note",
        tags,
        customVaAsignStatus: "Active",
        newCollaborator: userAsCollaborator,
        split: person.customRLeadOwnerSplitType
      }
      const url = "https://n8n.homelasvegasnevada.com/webhook/5bd5c426-77c4-4afb-8367-0d4c652866a0"
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })
      setNeedVa(false)
      console.log("Actualizado:", response);

    } catch (error) {
      console.log(error);
    }
  };

  const handleSubmitReturnLeadNotificate = async () => {
    console.log("retornando lead")
    //customVaAsignNotification
    try {
      const body = {
        customVaAsignNotification: "Active"
      };
      const response = await updatePeople(person.id, body);
      const result = response.data;

      const status = {
        clientId: person.id,
        clientName: person.name,
        clientLink: `https://homelasvegasnevada.followupboss.com/2/people/view/${person.id}`,
        clientRealtor: context.user.name,
        vaActual: person.assignedTo,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: '2-digit',
          timeZone: 'America/Los_Angeles'
        }),
        split: person?.customRRealtorSOILeadRefferalLeadCompanyLead
      }
      const responseNotificate = await fetch("https://n8n.homelasvegasnevada.com/webhook/7c2c9331-a6ad-4427-9706-611ca1cadf31", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(status),
      })
      setStatusReturnVa(true)
    } catch (error) {
      console.log(error);
    }
  }

  const handleSubmitConfirmReturnLead = async () => {

    try {
      const tags = [
        ...(person.tags || []).filter(
          (tag) => tag !== "VaAsignSpanish" && tag !== "VaAsignEnglish"
        )
      ];
      const body = {
        customVaAsignStatus: "",
        customVaAsignNotification: "",
        tags
      };
      if (splitType === "Company Lead") {
        body.customRLeadOwnerSplitType = split || ""
      }

      const response = await updatePeople(person.id, body);
      const result = response.data;

      const status = {
        clientId: person.id,
        clientName: person.name,
        clientLink: `https://homelasvegasnevada.followupboss.com/2/people/view/${person.id}`,
        clientRealtor: context.user.name,
        vaActual: person.assignedTo,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: '2-digit',
          timeZone: 'America/Los_Angeles'
        }),
        split: split || ""
      }

      const responseNotificate = await fetch("https://n8n.homelasvegasnevada.com/webhook/69a7996d-45f5-4c1d-97b2-45b3a4bf7261", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(status),
      })
    } catch (error) {
      console.log(error);
    }
    //
  }

  const isDisabled = !formData.language && !formData.comments.trim()

  if (
    !person?.customRRealtorSOILeadRefferalLeadCompanyLead ||
    !person?.customRLeadOwnerSplitType
  ) {
    return (
      <div className="d-flex align-items-center gap-2 p-3 bg-danger-subtle border border-danger rounded-3">
        <i className="bi bi-exclamation-triangle-fill text-danger fs-4"></i>

        <div>
          <h6 className="mb-1 text-danger fw-bold">
            Configuración incompleta
          </h6>

          <p className="mb-0 text-dark">
            Necesita agregar el tipo de <strong>Split</strong> en la sección
            <strong> Splits</strong>.
          </p>
        </div>
      </div>
    );
  }

  // Reusable field wrapper
  const Field = ({ label, children }) => (
    <div className="mb-1">
      <label className="form-label fw-semibold">{label}</label>
      {children}
    </div>
  );

  const ids = (CustomSplits ?? []).join(",");

  const choicesResp = choices?.data ?? choices ?? [];

  const byId = useCallback(
    (id) => choicesResp.find((f) => f.id === id)?.choices ?? [],
    [choicesResp]
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-4">
        <span className="spinner-border spinner-border-sm me-2" role="status" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="container py-3">
      <div
        className="card shadow-sm border-0 mx-auto"
        style={{ maxWidth: '500px', borderRadius: '16px' }}
      >
        <div className="card-body p-4">
          {dataHistory && dataHistory.length > 0 && (
            <>
              {/* Header */}
              <div className="text-center mb-4">
                <h5 className="fw-bold mb-1">Request VA Follow-Up</h5>
                <p className="text-muted mb-0 small">** {person?.customRRealtorSOILeadRefferalLeadCompanyLead || "Company Lead o SOI"} **</p>
                <button
                  className='btn btn-sm btn-info fw-bold mt-2'
                  onClick={() => setShowHistory(!showHistory)}  // Necesitas este estado
                >
                  {showHistory ? "Close History" : "Open History"}
                </button>
              </div>

              {/* Tabla que se muestra u oculta */}
              {showHistory && (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead className="table-dark">
                      <tr className='align-middle'>
                        <th scope="col">#</th>
                        <th scope="col">Date Assigned</th>
                        <th scope="col">VA Assigned</th>
                        <th scope="col">Return Date</th>
                        <th scope="col">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataHistory.map((item, index) => (
                        <tr className='align-middle' key={item._id || index}>
                          <th scope="row">{index + 1}</th>
                          <td>{new Date(item.date).toLocaleDateString()}</td>
                          <td>{item.vaAssigned}</td>
                          <td>{item.returnDate ? new Date(item.returnDate).toLocaleDateString() : 'N/A'}</td>
                          <td>{item.note || 'No notes'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Cuando el lead pertenece al Realtor */}

          {needVa && (
            <div className="d-flex justify-content-between align-items-center border rounded-3 px-3 py-2 mb-3 bg-light">
              <div>
                <div className="fw-semibold">What happens after a VA is assigned?</div>
                {person?.customRRealtorSOILeadRefferalLeadCompanyLead === "Company Lead" && (
                  <small className="text-muted">
                    Once a VA is assigned, they become the primary account manager and the realtor becomes a collaborator. To regain control, SOI clients can be reassigned directly, while Company Leads must request it through an admin.
                    Returning a Company Lead resets the split. A new one is assigned based on client stage
                  </small>
                )}
                {person?.customRRealtorSOILeadRefferalLeadCompanyLead === "SOI Lead" && (
                  <small className="text-muted">
                    Once a VA is assigned, they become the primary account manager and the realtor becomes a collaborator. To regain control, SOI clients can be reassigned directly, while Company Leads must request it through an admin.
                  </small>
                )}
              </div>

            </div>
          )}

          {/* Cuando el lead esta siendo trabajado por el VA */}

          {!needVa && !statusReturnVa && splitType === "Company Lead" && (
            <div className="d-flex justify-content-between align-items-center border rounded-3 px-3 py-2 mb-3 bg-light">
              <div>
                <div className="fw-semibold">Return Lead (Admin Required)</div>
                <small className="text-muted">
                  For Company Leads, click ‘Return Lead’ to notify admin. For faster assistance, please contact the admin team directly
                </small>
              </div>

            </div>
          )}

          {/* Cuando el realtor quiere de vuelta su lead */}

          {!needVa && statusReturnVa && splitType === "Company Lead" && (
            <div className="d-flex justify-content-between align-items-center border rounded-3 px-3 py-2 mb-3 bg-light">
              <div>
                <div className="fw-semibold">The admin was notificated</div>
                <small className="text-muted">
                  Aqui va la explicacion de como funciona el proceso de reasignacion de VA por el Realtor que esta asignado a este cliente
                </small>
              </div>

            </div>
          )}

          {/* Conditional form */}
          {needVa && (
            <div className="d-flex flex-column gap-3">
              <div>
                <label className="form-label fw-semibold">Language</label>
                <select
                  className="form-select"
                  value={formData.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                >
                  <option value="">Select language</option>
                  <option value="Spanish">Spanish</option>
                  <option value="English">English</option>
                </select>
              </div>

              <div>
                <label htmlFor="comments" className="form-label fw-semibold">
                  What does the VA need to know?
                </label>
                <textarea
                  id="comments"
                  className="form-control"
                  rows="4"
                  placeholder="Add any relevant notes here..."
                  value={formData.comments}
                  onChange={(e) => handleChange('comments', e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn btn-success w-100 fw-semibold"
                onClick={handleSubmit}
                disabled={isDisabled}
              >
                Save Assignment
              </button>
            </div>
          )}

          {!needVa && !statusReturnVa && splitType === "Company Lead" && (
            <div className='d-flex flex-column gap-2'>

              <button
                className='btn btn-sm btn-success'
                type='button'
                onClick={handleSubmitReturnLeadNotificate}
              >Return Lead</button>
            </div>

          )}
          {!needVa && statusReturnVa && splitType === "Company Lead" && isBroker && (
            <>
              <div className="d-flex justify-content-between align-items-center border rounded-3 px-3 py-2 mb-3 bg-light">
                <div>
                  <div className="fw-semibold">Stage</div>
                  <small className="text-muted">
                    <b>{person.stage}</b>
                  </small>
                  <div className="fw-semibold">Split Sugestion</div>
                  <small className="text-muted">
                    <b>{person.stage}</b>
                  </small>
                </div>

              </div>
              <Field label="Select Splits">
                <select
                  className="form-select form-select-sm"
                  value={split || ""}
                  onChange={(e) => setSplit(e.target.value)}
                >
                  <option value="">EMPTY</option>
                  <option disabled>----------</option>
                  {byId(334)?.map((option, index) => {

                    return (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    );
                  })}
                </select>

              </Field>
              <div className='d-flex flex-column gap-2'>
                <button
                  className='btn btn-sm btn-success'
                  type='button'
                  onClick={handleSubmitConfirmReturnLead}
                >Confirm Return Lead</button>
              </div>
            </>

          )}
          {!needVa && splitType === "SOI Lead" && (
            <div className='d-flex flex-column gap-2'>
              <button
                className='btn btn-sm btn-success'
                type='button'
                onClick={handleSubmitConfirmReturnLead}
              >Confirm Return Lead</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VaAsign