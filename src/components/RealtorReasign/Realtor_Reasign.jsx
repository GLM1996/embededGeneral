import React, { useState, useEffect } from 'react'
import { useAppContext } from '../../context/AppContext';
import { getChoicesCustomFields } from '../../config/funciones';
import { CustomFieldsReasigned } from '../../config/CustomFields';
import { actualDate, servidor_n8n } from '../../config/utils';
import { toast } from 'react-toastify';

export const Realtor_Reasign = () => {

  const [loading, setLoading] = useState(false)
  const [choices, setChoices] = useState([]);
  const [reasignedDate, setReasignedDate] = useState(actualDate())
  const [reasignedFrom, setReasignedFrom] = useState("")
  const [reasignedTo, setReasignedTo] = useState("")
  const [statusClient, setStatusClient] = useState("")
  const { context, person } = useAppContext()
  const [statusBtn, setStatusBtn] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await getChoicesCustomFields(CustomFieldsReasigned)
        if (response.success) {
          setChoices(response.data);
        }
      } catch (error) {
        console.log(error)
        toast.error("Error loading data")
      } finally { setLoading(false) }
    }
    fetchData()
  }, []);

  useEffect(() => {
    if (choices.length !== 0) {
      setReasignedDate(actualDate())
      setReasignedFrom(person.assignedTo || person?.customAdminClientReasignedRemovedFrom || "")
      setReasignedTo("")
    }
  }, [choices, person])

  if (!person?.customRRealtorSOILeadRefferalLeadCompanyLead) {
    return (
      <div className="d-flex align-items-center gap-2 p-3 bg-danger-subtle border border-danger rounded-3">
        <i className="bi bi-exclamation-triangle-fill text-danger fs-4"></i>
        <div>
          <h6 className="mb-1 text-danger fw-bold">Configuración incompleta</h6>
          <p className="mb-0 text-dark">
            Necesita agregar el tipo de <strong>Split</strong> en la sección <strong>Splits</strong>.
          </p>
        </div>
      </div>
    );
  }

  const leadType = person?.customRRealtorSOILeadRefferalLeadCompanyLead

  async function handleSave() {
    if (!consentAccepted) {
      toast.warning("Debes aceptar los términos y condiciones para continuar", {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }

    setStatusBtn(true)
    
    // Simulación - Reemplazar con tu lógica real cuando esté lista
    setTimeout(() => {
      toast.success("Reasignación completada con éxito")
      setStatusBtn(false)
    }, 1500)

    // Tu código original comentado
    // const data = {
    //   id: person.id,
    //   leadType: leadType,
    //   people: {
    //     assignedTo: reasignedTo,
    //     customAdminClientReasignedDate: reasignedDate,
    //     customAdminClientReasignedRemovedFrom: reasignedFrom,
    //     customAdminClientReasignedAssignedTo: reasignedTo,
    //     ...(leadType === "Company Lead" && { customStatusClient: statusClient })
    //   }
    // }
    // try {
    //   const response = await fetch(`${servidor_n8n}/webhook/42f2ec18-6744-44f8-a491-09ac93e31d1b`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ data }),
    //   });
    //   if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    //   toast.success('Reasignación completada')
    // } catch (error) {
    //   console.error(error);
    //   toast.error(error.message)
    // } finally { setStatusBtn(false) }
  }

  if (loading || choices.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center p-4">
        <span className="spinner-border spinner-border-sm me-2" role="status" />
        <span>Loading...</span>
      </div>
    );
  }

  const getBannerText = () => {
    if (leadType === "SOI Lead") {
      return "Caso SOI Lead - Reasignación de agente";
    }
    
    const bannerTexts = {
      "1": "⚠️ El cliente no ha tenido cita - Se requiere seguimiento inmediato",
      "2": "📋 El cliente tuvo cita pero no firmó - Revisar objeciones",
      "3": "✅ Cliente con contrato firmado - Reasignación con contrato activo"
    };
    
    return bannerTexts[statusClient] || "Seleccione un estado para ver la información correspondiente";
  };

  const renderBanner = () => {
    if (leadType === "SOI Lead" || (leadType === "Company Lead" && statusClient)) {
      return (
        <div className="col-12 text-center mt-3">
          <div className="bg-white p-3 rounded-3 d-inline-block shadow-sm border">
            <i className="bi bi-info-circle-fill text-primary me-2"></i>
            <strong className="text-dark">{getBannerText()}</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderConsentCheckbox = () => (
    <div className="col-12 d-flex justify-content-center mt-3">
      <div className="form-check">
        <input
          type="checkbox"
          className="form-check-input"
          id="consentCheck"
          checked={consentAccepted}
          onChange={(e) => setConsentAccepted(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="consentCheck">
          <strong>Acepto</strong> los términos y condiciones descritos anteriormente
        </label>
      </div>
    </div>
  );

  const renderDateField = () => (
    <div className='col-12'>
      <label className="form-label fw-semibold mb-1">
        <i className="bi bi-calendar me-1"></i>Client Reasigned Date
      </label>
      <input
        type="date"
        className="form-control form-control-sm"
        value={reasignedDate}
        onChange={(e) => setReasignedDate(e.target.value)}
        required
      />
    </div>
  );

  const renderSelectFrom = () => (
    <div className="col-12">
      <label className="form-label fw-semibold mb-1">
        <i className="bi bi-person-x me-1"></i>Client Reasigned From
      </label>
      <select
        className="form-select form-select-sm"
        value={reasignedFrom}
        onChange={(e) => setReasignedFrom(e.target.value)}
        required
      >
        <option value="">Select an agent</option>
        <option disabled>----------</option>
        {choices[0]?.choices.map((option, index) => (
          <option key={index} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );

  const renderSelectTo = () => (
    <div className="col-12">
      <label className="form-label fw-semibold mb-1">
        <i className="bi bi-person-check me-1"></i>Client Reasigned To
      </label>
      <select
        className="form-select form-select-sm"
        value={reasignedTo}
        onChange={(e) => setReasignedTo(e.target.value)}
        required
      >
        <option value="">Select an agent</option>
        <option disabled>----------</option>
        {choices[1]?.choices.map((option, index) => (
          <option key={index} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );

  const renderStatusClientField = () => (
    <div className="col-12">
      <label className="form-label fw-semibold mb-1">
        <i className="bi bi-flag me-1"></i>Status Client
      </label>
      <select
        className="form-select form-select-sm"
        value={statusClient}
        onChange={(e) => {
          setStatusClient(e.target.value);
          setConsentAccepted(false); // Reset consent when status changes
        }}
        required
      >
        <option value="">Select client status</option>
        <option disabled>----------</option>
        <option value="1">❌ El cliente no ha tenido cita de Buyer o Listing Presentation</option>
        <option value="2">🤝 El cliente tuvo cita de Buyer o Listing Presentation pero no firmó</option>
        <option value="3">📝 El cliente tiene firmado un BBA o LBA</option>
      </select>
    </div>
  );

  const renderSubmitButton = () => (
    <div className="col-12 d-flex justify-content-center my-3">
      <button 
        className="btn btn-success px-4" 
        type="submit" 
        disabled={statusBtn || !consentAccepted}
      >
        <i className="bi bi-floppy me-2"></i>
        {statusBtn ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );

  // Formulario unificado para ambos tipos de lead
  const renderForm = () => (
    <form
      className="row g-2 w-100 m-auto bg-light p-2 rounded-2 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
    >
      {renderDateField()}
      {renderSelectFrom()}
      {renderSelectTo()}
      
      {leadType === "Company Lead" && renderStatusClientField()}
      
      {renderBanner()}
      {renderConsentCheckbox()}
      {renderSubmitButton()}
    </form>
  );

  return (
    <div className='container px-2 py-3'>
      <div className='card shadow border-0 rounded-4 mx-auto overflow-hidden'>
        <div className="card-header bg-white py-2 border-0">
          <h6 className="mb-0 fw-bold text-primary">
            <i className="bi bi-arrow-repeat me-2"></i>
            Reasignación de {leadType}
          </h6>
        </div>
        <div className="card-body p-3">
          {renderForm()}
        </div>
      </div>
    </div>
  )
}