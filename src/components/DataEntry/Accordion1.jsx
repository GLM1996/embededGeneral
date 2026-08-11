import React, { useState, useEffect } from "react";
import { getChoicesCustomFields, searchStages } from "../../config/funciones";
import { CustomFieldsAccordion1 } from "../../config/CustomFields";
import Loading from "../Loading";
import { useAppContext } from "../../context/AppContext";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";



export default function Accordion1({
  handleFormData,
  personFilter,
  cleanSelectProblems,
  apptFub
}) {
  const [loading, setLoading] = useState(false);
  const { person, context, isLoading, error } = useAppContext();
  const [choices, setShoices] = useState([]);
  const [formData, setFormData] = useState({
    pastClientTag: "",
    leadType: "",
    language: "",
    pipeline: "",
    stage: "",
    attemps: "",
    contactFuture: "",
    clientQualify: "",
    bestTimeToCall: "",
    bestTimeToCall2: "",
    zillowEstimated: "",
    bestEstimated: 0,
    sellerAddress: "",
    sellerPending: 0,
    clientReadyDate: "",
    nextContactDay: "",
    nextContactDayNote: "",
    clientReadyDateNote: "",
    nextContactDayCheck: false,
    clientReadyDateCheck: false,
    daysWeekSelected: [],
    lastSource: "",
    campaing: "",
    dateLastSource: "",
    notaPond: "",
    checkByAdmin: false
  });
  const [stages, setStages] = useState([]);
  const [stagesFiltered, setStagesFiltered] = useState([]);
  const [daysWeekSelected, setDaysWeekSelected] = useState([]);

  //Automatizacion Juan Orozco
  const [buyerPotencial, setBuyerPotencial] = useState(false)
  const [citaAgendada, setCitaAgendada] = useState(false)
  const [formDataBuyerPotencial, setFormDataBuyerPotencial] = useState({
    credito: false, ahorro: false, renta: false, mercado: false, info: false
  })

  const daysWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const optionsBuyerPotencial = [{ clave: "credito", name: "CREDITO BAJO" }, { clave: "ahorro", name: "SIN AHORROS" }, { clave: "renta", name: "SOLO RENTA" }, { clave: "mercado", name: "MIEDO MERCADO" }, { clave: "info", name: "NO DA INFO" }]

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      //const data = await getChoicesCustomFields(CustomFieldsAccordion1);
      const [data, responseStages] = await Promise.all([
        getChoicesCustomFields(CustomFieldsAccordion1),
        searchStages(),
      ]);
      setShoices(data.data);
      const filterStages = responseStages.stages.filter((item) =>
        item.name.includes("*")
      );
      const lead = responseStages.stages.find((item) => item.name === "Lead");
      const trash = responseStages.stages.find((item) => item.name === "Trash");

      filterStages.push(lead);
      filterStages.push(trash);
      const daysArray = person?.customBestDaysToCall?.split('-');
      if (daysArray) {
        setDaysWeekSelected(daysArray)
      }

      setStages(filterStages);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (formData?.pipeline !== "") {
      filtrarStages(formData?.pipeline);
    } else {
      setStagesFiltered([]);
    }
  }, [formData?.pipeline]);


  useEffect(() => {
    if (personFilter && stages.length > 0) {

      const updated = {
        pastClientTag: person.customVAPASTCLIENTTAGSFOLLOWUP ?? "",
        leadType: person?.customNEWLeadType ?? "",
        pipeline: person?.customNEWPIPELINE ?? "",
        stage: person?.stage ?? "",
        attemps: person?.customVANOANSWERATTEMPTS ?? "",
        contactFuture: person.customNEWClientOpenToNewContactInTheFuture ?? "",
        clientQualify: person?.customNEWClientSQualifyAs ?? "",
        bestTimeToCall: person.customVAAMPMTimeToCall ?? "",
        bestTimeToCall2: person.customVAAMPM2ndTimeToCall ?? "",
        zillowEstimated: personFilter.zillowEstimated ?? "",
        bestEstimated: personFilter.bestEstimated ?? 0,
        sellerAddress: (person.addresses?.length
          ? `${person.addresses[person.addresses.length - 1]?.street ?? ""} ${person.addresses[person.addresses.length - 1]?.city ?? ""} ${person.addresses[person.addresses.length - 1]?.state ?? ""} ${person.addresses[person.addresses.length - 1]?.code ?? ""} ${person.addresses[person.addresses.length - 1]?.country ?? ""}`
          : "")
          ?? "",
        sellerPending: personFilter.sellerPending ?? 0,
        clientReadyDate: person.customVAPromiseToCallOrApptReminder ?? "", ////////RENOMBRAR SEGUN CUSTOM
        nextContactDay: person.customVANextContactDay3M ?? "",
        nextContactDayNote: personFilter.nextContactDayNote ?? "",
        clientReadyDateNote: personFilter.clientReadyDateNote ?? "",
        language: person?.customClientLanguage || "",
        lastSource: person?.customVALastLeadSource || "",
        campaing: person?.customVACampaing || "",
        buyerPotencial: personFilter?.buyerPotencial || false,
        citaAgendada: personFilter?.citaAgendada || false,
        credito: personFilter?.optionsBuyerPotencial?.credito || false,
        ahorro: personFilter?.optionsBuyerPotencial?.ahorro || false,
        renta: personFilter?.optionsBuyerPotencial?.renta || false,
        mercado: personFilter?.optionsBuyerPotencial?.mercado || false,
        info: personFilter?.optionsBuyerPotencial?.info || false,
        notaPond: personFilter?.notaPond || "",
        checkByAdmin: person.customAdminPondCheckedByAdmin
      };
      setFormData(updated);
      handleFormData(1, updated);
    } else {
      if (stages.length > 0) {
        const updated = {
          language: person?.customClientLanguage || "",
          leadType: person.customNEWLeadType ?? "",
          pipeline: person.customNEWPIPELINE ?? "",
          stage: person.stage ?? "",
          attemps: person.customVANOANSWERATTEMPTS ?? "",
          clientReadyDate: person.customVAPromiseToCallOrApptReminder ?? "",
          sellerAddress: (person.addresses?.length
            ? `${person.addresses[person.addresses.length - 1]?.street ?? ""} ${person.addresses[person.addresses.length - 1]?.city ?? ""} ${person.addresses[person.addresses.length - 1]?.state ?? ""} ${person.addresses[person.addresses.length - 1]?.code ?? ""} ${person.addresses[person.addresses.length - 1]?.country ?? ""}`
            : "")
            ?? "",
          lastSource: person?.customVALastLeadSource || "",
          campaing: person?.customVACampaing || "",
          checkByAdmin: person.customAdminPondCheckedByAdmin
        };
        setFormData(updated);
        handleFormData(1, updated);
      }
    }

  }, [personFilter, stages]);

  useEffect(() => {
    if (
      formData?.leadType !== "" &&
      formData?.leadType !== personFilter?.leadType
    ) {
      cleanSelectProblems(true);
    }
  }, [formData?.leadType]);

  const handleChange = (clave, valor) => {

    const updated = { ...formData, [clave]: valor };
    setFormData(updated); // actualiza el estado local del hijo
    handleFormData(1, updated); // notifica al padre con los datos actualizados  
  };

  const handleDaysWeek = (e) => {
    console.log(e)
    const { checked, value } = e.target;

    // Actualiza el array local de días seleccionados
    const updatedDays = checked
      ? [...daysWeekSelected, value]
      : daysWeekSelected.filter((day) => day !== value);

    setDaysWeekSelected(updatedDays); // Actualiza el estado local (si lo necesitas)

    // Actualiza el estado global formData
    handleChange('daysWeekSelected', updatedDays);
  };

  const filtrarStages = (pipeline) => {
    if (pipeline !== "Other Stages") {
      const coincidencia = pipeline.split("-")[0];
      const stagesData = stages.filter((item) =>
        item.name.includes(coincidencia + "-")
      );

      if (pipeline === "1- No Income No Address Info") {
        stagesData.push(stages.find((item) => item.name === "Lead"));
      }
      setStagesFiltered(stagesData);

      //setStagesFiltered(stages)
    } else {
      const stagesData = stages.filter((item) => item.name.includes("6-"));
      stagesData.push(stages.find((item) => item.name === "Trash"));
      setStagesFiltered(stagesData);
    }
  };

  //Automatizacion orozco
  // const handleFormDataBuyerPotencial = (clave, valor) => {
  //   const updated = { ...formData, [clave]: valor }
  //   setFormData(updated); // actualiza el estado local del hijo
  //   handleFormData(1, updated); // notifica al padre con los datos actualizados  
  //   // Crear una nueva copia del estado para evitar mutación
  //   const nuevoEstado = {
  //     ...formDataBuyerPotencial,
  //     [clave]: valor
  //   };
  //   setFormDataBuyerPotencial(nuevoEstado);
  //   console.log(formDataBuyerPotencial)
  // }

  if (loading || choices.length === 0) {
    return <Loading text="Loading Choices" />;
  }

  //Stages del Pond
  const stagesPond = [
    "Trash",
    "6-DO NOT CALL LIST *",
    "6-NO ACTION TO TAKE *",
    "6- INVESTOR *",
    "6-UNRESPONSIVE *"
  ]

  return (
    <div className="row w-100 m-auto bg-info p-0">
      {/* Languaje */}
      <div className="col-12 mb-1">
        <b>Language</b>
        <select
          className="form-select form-select-sm"
          aria-label="Lead type select"
          value={formData?.language || ""}
          onChange={(e) => handleChange("language", e.target.value)}
        >
          <option value="">EMPTY</option>
          <option disabled>----------</option>
          <option value="Spanish">Spanish</option>
          <option value="English">English</option>
        </select>
      </div>
      {/* Solo Past Client */}
      {person.tags.indexOf('PAST CLIENT') !== -1 && (
        <div className="col-12">
          <b>Past Client Tag Follow Up</b>
          <select
            className="form-select form-select-sm"
            aria-label="Lead type select"
            value={formData?.pastClientTag || ""}
            onChange={(e) => handleChange("pastClientTag", e.target.value)}
          >
            <option value="">EMPTY</option>
            <option disabled>----------</option>
            {choices[6].choices.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
      {/* Lead Type */}
      <div className="col-12 mb-2">
        <b>Lead Type</b>
        <select
          className="form-select form-select-sm"
          aria-label="Lead type select"
          value={formData?.leadType || ""}
          onChange={(e) => handleChange("leadType", e.target.value)}
        >
          <option value="">EMPTY</option>
          <option disabled>----------</option>
          {choices[0].choices.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      {formData?.leadType === "Personal Rent" && (
        <>
          <div className="col-12">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                value={formData?.buyerPotencial || false}
                id="checkDefault"
                checked={formData?.buyerPotencial || false}
                onChange={(e) => handleChange("buyerPotencial", e.target.checked)}
              />
              <label className="form-check-label" htmlFor="checkDefault">
                Buyer Potencial
              </label>
            </div>
          </div>
          {formData?.buyerPotencial && (
            <>
              <div className="col-12">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    value={formData?.citaAgendada || false}
                    id="checkDefault"
                    checked={formData?.citaAgendada || false}
                    onChange={(e) => handleChange("citaAgendada", e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="checkDefault">
                    Cita Agendada
                  </label>
                </div>
              </div>
              {!formData?.citaAgendada && (
                <div className="d-flex flex-wrap gap-1 border-top rounded-1">
                  {optionsBuyerPotencial.map((item, index) => {
                    return (
                      <div className="flex-1" key={index}>
                        <div className="form-check form-check-sm">
                          <input
                            className="form-check-input form-check-input-sm"
                            type="checkbox"
                            id={`check-${item.clave}`}
                            checked={formData[item.clave] || false}
                            onChange={(e) => handleChange(item.clave, e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="checkDefault">
                            {item.name}
                          </label>
                        </div>
                      </div>
                    )
                  })}
                  {/* <div className="flex-1">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="checkDefault"
                        checked={formDataBuyerPotencial?.credito || false}
                        onChange={(e) => handleFormDataBuyerPotencial("credito", e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="checkDefault">
                        Credito Bajo
                      </label>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="checkDefault"
                        checked={formDataBuyerPotencial?.ahorros || false}
                        onChange={(e) => handleFormDataBuyerPotencial("ahorros", e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="checkDefault">
                        Sin Ahorros
                      </label>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="checkDefault"
                        checked={formDataBuyerPotencial?.curioso || false}
                        onChange={(e) => handleFormDataBuyerPotencial("curioso", e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="checkDefault">
                        Solo Curiosea
                      </label>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="checkDefault"
                        checked={formDataBuyerPotencial?.mercado || false}
                        onChange={(e) => handleFormDataBuyerPotencial("mercado", e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="checkDefault">
                        Miedo Mercado
                      </label>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="checkDefault"
                        checked={formDataBuyerPotencial?.noinfo || false}
                        onChange={(e) => handleFormDataBuyerPotencial("noinfo", e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="checkDefault">
                        No da Info
                      </label>
                    </div>
                  </div> */}
                </div>
              )}</>
          )}
        </>
      )}

      {/* Pipleine */}
      <div className="col-12">
        <b>Pipelines</b>
        <select
          className="form-select form-select-sm"
          aria-label="Pipelines select"
          value={formData?.pipeline || ""}
          onChange={(e) => handleChange("pipeline", e.target.value)}
        >
          <option value="">EMPTY</option>
          <option disabled>----------</option>
          {choices[1].choices.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      {/* Stage */}
      <div className="col-12">
        <div className="d-flex flex-column">
          <b>Stages</b>
          {formData?.stage.toLowerCase().includes('quit') && (
            <span className="bg-danger text-white rounded-1 fs-6 px-1">
              Decided to quit Stage can only be changed on the <b className="badge bg-success">Appt Status<i className="bi bi-pencil ms-1"></i></b> Section
              Please select go to Appt status
            </span>
          )}
        </div>
        <select
          className="form-select form-select-sm"
          aria-label="Stages select"
          value={formData?.stage || ""}
          onChange={(e) => handleChange("stage", e.target.value)}
        >
          <option value="">EMPTY</option>
          <option disabled>----------</option>
          {stagesFiltered.map((option, index) => (
            <option key={index} value={option.name}>
              {option.name}
            </option>
          ))}
        </select>
      </div>

      {/* PARA CUANDO EL STAGE SE MANDA AL POND */}
      {stagesPond.includes(formData?.stage) && (
        <>
          <div className="col-12">
            <b>⚠️ WHY THIS STAGE ??? ⚠️ </b>
            <div className="input-group input-group-sm mb-1 bg-danger p-1">
              <textarea
                className="form-control"
                value={formData?.notaPond || ""}
                onChange={(e) => handleChange("notaPond", e.target.value)}
              />
            </div>
          </div>
          {context.user.role === "Broker" && (
            <div className="mx-2 form-check">
              <input
                className="form-check-input"
                type="checkbox"
                checked={formData?.checkByAdmin === "Yes"}
                onChange={(e) =>
                  handleChange(
                    "checkByAdmin",
                    e.target.checked ? "Yes" : "No"
                  )
                }
              />
              <b>Check By Admin</b>
            </div>
          )}
        </>
      )}

      {/* Answer */}
      <div className="col-12">
        <b>No Answer Attempts</b>
        <select
          className="form-select form-select-sm"
          aria-label="No answer attempts select"
          value={formData?.attemps || ""}
          onChange={(e) => handleChange("attemps", e.target.value)}
        >
          <option value="">EMPTY</option>
          <option disabled>----------</option>
          {choices[2].choices.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      {/* Contact Future */}
      <div className="col-12 mb-1">
        <b>Is the client open to a new contact in the future?</b>
        <select
          className="form-select form-select-sm"
          aria-label="Lead type select"
          value={formData?.contactFuture || ""}
          onChange={(e) => handleChange("contactFuture", e.target.value)}
        >
          <option value="">EMPTY</option>
          <option disabled>----------</option>
          {choices[3].choices.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      {/* Legal Status */}
      {formData?.leadType !== "Seller" && (
        <div className="col-12">
          <b>Legal Status</b>
          <select
            className="form-select form-select-sm"
            aria-label="Lead type select"
            value={formData?.clientQualify || ""}
            onChange={(e) => handleChange("clientQualify", e.target.value)}
          >
            <option value="">EMPTY</option>
            <option disabled>----------</option>
            {choices[4].choices.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
      {/* Solo Seller */}
      {(formData?.leadType.includes("Seller") || formData?.leadType.includes("Refi")) && (
        <>
          <div className="col-12">
            <b>SELLER ADDRESS</b>
            <div className="input-group input-group-sm mb-1">
              <textarea
                className="form-control"
                type="text"
                value={formData?.sellerAddress}
                onChange={(e) => handleChange("sellerAddress", e.target.value)}
              />
            </div>
          </div>
          <div className="col-12">
            <b>ZILLOW ESTIMATED HOME VALUE</b>
            <div className="input-group input-group-sm mb-1">
              <textarea
                className="form-control"
                type="text"
                value={formData?.zillowEstimated}
                onChange={(e) =>
                  handleChange("zillowEstimated", e.target.value)
                }
              />
            </div>
          </div>
          <div className="col-12">
            <b>BEST HOME ESTIMATED HOME VALUE</b>
            <div className="input-group input-group-sm mb-1">
              <input
                className="form-control"
                type="number"
                value={formData?.bestEstimated}
                onChange={(e) => handleChange("bestEstimated", e.target.value)}
              />
            </div>
          </div>
          <div className="col-12">
            <b>SELLER PENDING LOAN AMMOUNT</b>
            <div className="input-group input-group-sm mb-1">
              <input
                className="form-control"
                type="number"
                value={formData?.sellerPending}
                onChange={(e) => handleChange("sellerPending", e.target.value)}
              />
            </div>
          </div>
        </>
      )}
      {/* BEST DAY AND TIME TO CALL */}
      <div className="bg-secondary my-1">
        {/* Best Time To Call */}
        <div className="col-12 mb-1">
          <b className="d-flex justify-content-center fw-bold text-decoration-underline">Best Time To Call</b>
          <div className="row">
            <div className="col-6 d-flex flex-column align-items-center">
              <b>From</b>
              <select
                className="form-select form-select-sm"
                aria-label="Lead type select"
                value={formData?.bestTimeToCall || ""}
                onChange={(e) => handleChange("bestTimeToCall", e.target.value)}
              >
                <option value="">EMPTY</option>
                <option disabled>----------</option>
                {choices[5].choices.map((option, index) => (
                  <option key={index} value={option}>
                    {option.split("-")[1]}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 d-flex flex-column align-items-center">
              <b>To</b>
              <select
                className="form-select form-select-sm"
                aria-label="Lead type select"
                value={formData?.bestTimeToCall2 || ""}
                onChange={(e) => handleChange("bestTimeToCall2", e.target.value)}
              >
                <option value="">EMPTY</option>
                <option disabled>----------</option>
                {choices[5].choices.map((option, index) => (
                  <option key={index} value={option}>
                    {option.split("-")[1]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {/* Best Days To Call */}
        <div className="col-12 mb-1">
          <div className="d-flex justify-content-center flex-wrap gap-2">
            {daysWeek.map((item, index) => (
              <div className="form-check" key={index}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={index + item}
                  value={item}
                  onChange={handleDaysWeek}
                  checked={daysWeekSelected.includes(item)} // Para mantener el estado controlado
                />
                <b>{item}</b>
              </div>
            ))}

          </div>
        </div>
      </div>
      {/* CHECKED */}
      <div className="col-12 mb-1">
        <div className="d-flex flex-column bg-warning rounded-1">
          <div className="form-check ms-2 border-bottom border-2 border-black">
            <input
              className="form-check-input"
              type="checkbox"
              value={formData?.nextContactDayCheck}
              onChange={() =>
                handleChange(
                  "nextContactDayCheck",
                  !formData?.nextContactDayCheck
                )
              }
            />
            <label className="form-check-label">
              <i className="bi bi-telephone-fill text-success me-1"></i>Next
              Contact Day
            </label>
          </div>
        </div>
      </div>
      {/* Next Contact Day */}
      {formData?.nextContactDayCheck && (
        <>
          {/* Next Contact Day NOTE */}
          <div className="col-12">
            <b>Next Contact Day (Note)</b>
            <div className="input-group input-group-sm mb-1">
              <input
                className="form-control"
                type="text"
                value={formData?.nextContactDayNote}
                onChange={(e) =>
                  handleChange("nextContactDayNote", e.target.value)
                }
              />
            </div>
          </div>
          {/* Next Contact Date */}
          <div className="d-flex flex-column">
            <b>(VA) Next Contact Day (Date)</b>
            <div className="input-group input-group-sm mb-1">
              <input
                type="date"
                className="form-control"
                value={formData?.nextContactDay}
                onChange={(e) => handleChange("nextContactDay", e.target.value)}
              />
            </div>
          </div>
          {/* Best Time To Call Next Contact Day */}
          <div className="col-12 mb-1">
            <b>Next Contact Day Time</b>
            <select
              className="form-select form-select-sm"
              aria-label="Lead type select"
              value={formData?.bestTimeToCallNextContactDay || ""}
              onChange={(e) => handleChange("bestTimeToCallNextContactDay", e.target.value)}
            >
              <option value="">EMPTY</option>
              <option disabled>----------</option>
              {choices[5].choices.map((option, index) => (
                <option key={index} value={option}>
                  {option.split("-")[1]}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
      <div className="col-12 mb-1">
        <div className="d-flex flex-column bg-warning  rounded-1">
          <div className="form-check ms-2 border-bottom border-2 border-black">
            <input
              className="form-check-input"
              type="checkbox"
              value={formData?.clientReadyDateCheck}
              onChange={() =>
                handleChange(
                  "clientReadyDateCheck",
                  !formData?.clientReadyDateCheck
                )
              }
            />
            <label className="form-check-label">
              <i className="bi bi-heart-fill text-danger me-1"></i>Promise To
              Call
            </label>
          </div>
        </div>
      </div>
      {/* Client Ready Date */}
      {formData?.clientReadyDateCheck && (
        <>
          {/* Best Time To Call NOTE */}
          <div className="col-12">
            <b>Promise To Call (Note)</b>
            <div className="input-group input-group-sm mb-1">
              <input
                className="form-control"
                type="text"
                value={formData?.clientReadyDateNote}
                onChange={(e) =>
                  handleChange("clientReadyDateNote", e.target.value)
                }
              />
            </div>
          </div>
          {/* CLIENT READY */}
          <div className="d-flex flex-column">
            <b>(VA) Promise To Call (Date)</b>
            <div className="input-group input-group-sm mb-1">
              <input
                type="date"
                className="form-control"
                value={formData?.clientReadyDate}
                onChange={(e) =>
                  handleChange("clientReadyDate", e.target.value)
                }
              />
            </div>
          </div>
          {/* Best Time To Call Client Ready */}
          <div className="col-12 mb-1">
            <b>Promise To Call Time</b>
            <select
              className="form-select form-select-sm"
              aria-label="Lead type select"
              value={formData?.bestTimeToCallClientReady || ""}
              onChange={(e) => handleChange("bestTimeToCallClientReady", e.target.value)}
            >
              <option value="">EMPTY</option>
              <option disabled>----------</option>
              {choices[5].choices.map((option, index) => (
                <option key={index} value={option}>
                  {option.split("-")[1]}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
