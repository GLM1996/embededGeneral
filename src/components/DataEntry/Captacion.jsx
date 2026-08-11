import React, { useEffect, useState } from "react";
import {
  createNote,
  putStage,
  saveAppointment,
  saveAppointmentMongoCaptacion,
  searchCustomFields, postTask
} from "../../config/funciones";
import { ajustarFecha, formatearFecha, formatUsd } from "../../config/utils";
import { toast } from "react-toastify";
import Accordion1 from "./Accordion1";
import Accordion2 from "./Accordion2";
import Alert from "../Alert";

export default function Captacion({ context, personFilter, person, apptFub }) {
  const [formDataAccordion1, setFormDataAccordion1] = useState({
    leadType: "",
    pipeline: "",
    language: "",
    stage: "",
    attemps: "",
    contactFuture: "",
    clientQualify: "",
  });
  const [formDataAccordion2, setFormDataAccordion2] = useState({
    debtProblem: "",
    textValue: "",
  });
  const [typeProblems, setTypeProblems] = useState(
    formDataAccordion1?.leadType
  );
  const [showAlert, setShowAlert] = useState(false);
  const [cleanProblems, setCleanProblems] = useState(false);
  const [problem, setProblems] = useState([]);
  const [statusBtn, setStatusBtn] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const dataCustomFields = await searchCustomFields();
      if (dataCustomFields && dataCustomFields?.length > 0) {
        const filtered = dataCustomFields.filter((item) =>
          item.label.toLowerCase().includes("(NEW) Problem".toLowerCase())
        );
        // Ordenar: primero Buyers, luego Sellers, luego otros
        filtered.sort((a, b) => {
          const aLabel = a.label.toLowerCase();
          const bLabel = b.label.toLowerCase();

          if (aLabel.includes("buyer") && !bLabel.includes("buyer")) {
            return -1; // a viene primero
          }
          if (!aLabel.includes("buyer") && bLabel.includes("buyer")) {
            return 1; // b viene primero
          }
          if (aLabel.includes("seller") && !bLabel.includes("seller")) {
            return -1; // a viene primero (después de buyers)
          }
          if (!aLabel.includes("seller") && bLabel.includes("seller")) {
            return 1; // b viene primero (después de buyers)
          }
          return 0; // mantener orden actual
        });
        setProblems(filtered);
      }
    };
    fetchData();
  }, []);

  //SE ENCARGA DE MANTENER ACTUALIZADA LA INFO DESDE LOS COMPONENTES
  const handleFormData = (accordion, data) => {
    switch (accordion) {
      case 1:
        setFormDataAccordion1(data);
        setTypeProblems(data.leadType);
        break;
      case 2:

        setFormDataAccordion2(data);
        break;
      default:
        break;
    }
  };

  //FUNCION PRINCIPAL QUE SE ENCARGA DE GUARDAR TODOS LOS DATOS
  const handleSave = async () => {
    if (formDataAccordion1?.stage.toLowerCase().includes('quit') && !person?.stage?.toLowerCase().includes('quit')) {
      toast.error(`Solo se puede cambiar este Stage desde APPt STATUS`, {
        position: "top-center",
        autoClose: 2000,
      });
      return
    }
    setStatusBtn(true)
    // 1. Preparación de datos
    const dataSaved = { ...formDataAccordion1, ...formDataAccordion2 };
    const problems = getSelectedProblems(formDataAccordion2);
    const nameProblems = getProblemLabels(problems);

    // Obtener valor de "Problem Other"
    const otherProblemValue = formDataAccordion2.textValue;
    if (otherProblemValue?.trim()) {
      if (nameProblems.indexOf('(NEW) Problem: Other') === -1) {
        nameProblems.push("(NEW) Problem: Other");
      }
    }

    if (!formDataAccordion1?.pipeline?.includes(1) && !formDataAccordion1?.pipeline?.includes("Other") && nameProblems.length === 0 && !formDataAccordion2?.textValue) {
      setStatusBtn(false)
      toast.error(`Debe seleccionar algun problem para ${formDataAccordion1.pipeline}`, {
        position: "top-center",
        autoClose: 5000,
      });
      return
    }

    try {
      setShowAlert(true);
      let taskCall
      let taskThankYou

      if (dataSaved?.nextContactDayCheck && dataSaved?.nextContactDay) {
        const responseCall = await createPendingTask("Call")
        if (responseCall.success) {
          taskCall = responseCall?.data?.task
        }
      }
      if (dataSaved?.clientReadyDateCheck && dataSaved?.clientReadyDate) {
        const responseThankYou = await createPendingTask("Thank You")
        if (responseThankYou.success) {
          taskThankYou = responseThankYou?.data?.task
        }
      }
      //// Para cuando el cliente se manda al pond registrar el Motivo
      const stagesPond = [
        "Trash",
        "6-DO NOT CALL LIST *",
        "6-NO ACTION TO TAKE *",
        "6- INVESTOR *",
        "6-UNRESPONSIVE *"
      ]

      if (stagesPond.includes(dataSaved?.stage)) {
        if (person.stage !== dataSaved.stage || personFilter.notaPond !== dataSaved.notaPond) {

          if(!dataSaved.notaPond){
            setStatusBtn(false)
            toast.warning(" WHY THIS STAGE IS EMPTY ")
            return
          }
          const dataPond = {
            clientId: person.id,
            link: `https://homelasvegasnevada.followupboss.com/2/people/view/${person.id}`,
            name: person.name,
            updatedBy: context.user.name,
            stage: dataSaved.stage,
            razon: dataSaved.notaPond,
            date: formatearFecha(new Date()),
            checkByAdmin: dataSaved?.checkByAdmin
          };

          try {
            const response = await fetch(
              "https://n8n.homelasvegasnevada.com/webhook/f0332e49-0fb1-48cf-a546-50fee5a6822a",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(dataPond),
              }
            );

            if (!response.ok) {
              throw new Error(`Error ${response.status}`);
            }

            console.log("Pond notification sent");
          } catch (error) {
            console.error("Error sending Pond notification:", error);
          }
        }

      }
      const results = await Promise.allSettled([
        updateGoogleSheets(
          dataSaved,
          problems,
          nameProblems,
          otherProblemValue
        ),
        updateMongoDB(dataSaved, nameProblems, taskCall, taskThankYou),
        updateFollowUpBoss(dataSaved, problems, otherProblemValue),
      ]);
      // Verificar qué operaciones fallaron
      const failedOperations = results.filter(
        (result) => result.status === "rejected"
      );
      if (failedOperations.length > 0) {
        console.error("Algunas operaciones fallaron:", failedOperations);
        // Puedes mostrar un mensaje específico con qué falló
      }
      // Crear nota si cambió el stage (solo si las operaciones principales no fallaron)
      if (personFilter?.stage !== dataSaved?.stage && failedOperations.length === 0) {
        await createStageChangeNote(dataSaved.stage);
      }

      setStatusBtn(false)
      window.location.reload();
    } catch (error) {
      console.error("Error inesperado:", error);
      toast.error("Ocurrió un error al guardar los datos", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  //SE ENCARGA DE CREAR LAS TASK AUTOMATICAS EN FOLLOW
  const createPendingTask = async (type) => {
    let fechaAjustada = ""
    if (type === 'Call') {
      fechaAjustada = ajustarFecha(formDataAccordion1?.nextContactDay, formDataAccordion1?.bestTimeToCallNextContactDay?.split('-')[1])
    } else {
      if (type === 'Thank You') {
        fechaAjustada = ajustarFecha(formDataAccordion1?.clientReadyDate, formDataAccordion1?.bestTimeToCallClientReady?.split('-')[1])
      }
    }

    const dataTask = {
      personId: Number(context.person.id),
      assignedUserId: Number(person.assignedUserId),
      name: type === 'Call' ? formDataAccordion1?.nextContactDayNote || person.name : formDataAccordion1?.clientReadyDateNote || person.name,
      type: type,
      dueDateTime: fechaAjustada,
    };

    const put_stage = await postTask(dataTask);
    if (put_stage.success) {
      toast.success("Task Creada", {
        position: "top-right",
        autoClose: 2000,
      });
    }
    return put_stage
  };

  // Funciones auxiliares
  const getSelectedProblems = (formData) => {
    return Object.entries(formData)
      .filter(([_, value]) => value === "Yes")
      .map(([key]) => key);
  };

  const getProblemLabels = (problems) => {
    return problem
      .filter((item) => problems.includes(item.name))
      .map((item) => item.label);
  };

  //PREPARA EL FORMATO PARA INSERTAR EN LA SHEET
  const formatDataForGoogleSheets = (
    dataSaved,
    problems,
    nameProblems,
    otherProblemValue
  ) => {
    const values = [
      formatearFecha(new Date(person?.created)), // Creación del cliente
      formatearFecha(new Date()), // Actualizacion del cliente
      person?.name, // Name del cliente
      `https://homelasvegasnevada.followupboss.com/2/people/view/${person?.id}`, // Link del cliente
      context.user.name || "", //Quien lo actualizo
      person?.assignedTo || context?.user?.name || "", // VA del cliente          
      formatUsd(dataSaved?.debs?.withDebt || ""), // With debt
      formatUsd(dataSaved?.debs?.withoutDebt || ""), // Without debt
      dataSaved?.debtProblem || "", // Debt Problem
      dataSaved?.leadType || "", // Lead Type
      dataSaved?.pipeline || "", // Pipeline
      dataSaved?.stage || "", // Stage
      dataSaved?.attemps || "", // Attemps
      dataSaved?.contactFuture || "", // Contact Future
      dataSaved?.clientQualify || "", // Legal Status
      nameProblems.join("\n"), // Problems as string
    ];

    // Add problem values (Yes/No)
    const valuesProblems = problem.map((item) =>
      problems.includes(item.name) ? "Yes" : "No"
    );

    if (otherProblemValue?.trim()) {
      valuesProblems[valuesProblems.length - 1] = otherProblemValue;
    }

    return [...values, ...valuesProblems];
  };
  //ACTUALIZA LA INFO QUE SE VA A LA SHEET
  const updateGoogleSheets = async (
    dataSaved,
    problems,
    nameProblems,
    otherProblemValue
  ) => {
    const TIMEOUT_MS = 18000;
    const values = formatDataForGoogleSheets(
      dataSaved,
      problems,
      nameProblems,
      otherProblemValue
    );
    if (dataSaved?.leadType.includes("Seller")) {
      values.push(dataSaved?.zillowEstimated || "")
      values.push(dataSaved?.bestEstimated || "")
      values.push(dataSaved?.sellerAddress || "")
      values.push(dataSaved?.sellerPending || "")
    } else {
      for (let i = 0; i < 4; i++) {
        values.push("")
      }
    }
    //Agregando lead Source y Campaing
    values.push("")
    values.push(dataSaved?.lastSource || "")
    values.push(dataSaved?.campaing || "")
    //Orozco
    values.push(dataSaved?.buyerPotencial ? 'Yes' : 'No')
    values.push(dataSaved?.citaAgendada ? 'Yes' : 'No')
    values.push(dataSaved?.credito ? 'Yes' : 'No')
    values.push(dataSaved?.ahorro ? 'Yes' : 'No')
    values.push(dataSaved?.renta ? 'Yes' : 'No')
    values.push(dataSaved?.mercado ? 'Yes' : 'No')
    values.push(dataSaved?.info ? 'Yes' : 'No')

    const data = {
      id: context.person.id,
      mode: "1ID",
      values,
    };

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Timeout: Google Sheets no respondió a tiempo")),
        TIMEOUT_MS
      )
    );

    const put_appointment = await Promise.race([
      saveAppointment(data),
      timeoutPromise,
    ]);

    if (put_appointment?.success) {
      toast.success("Sheet Actualizada", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };
  //ACTUALIZA LA BASE DE DATOS EN MONGO
  const updateMongoDB = async (dataSaved, nameProblems, taskCall, taskThankYou) => {

    const response = await saveAppointmentMongoCaptacion(
      dataSaved,
      context,
      nameProblems, taskCall, taskThankYou
    );
    if (response.success) {
      toast.success(`BD ${response.operation}`, {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };
  //ACTUALIZA FOLLOW UP BOSS
  const updateFollowUpBoss = async (dataSaved, problems, otherProblemValue) => {
    const dataProblemsYes = Object.fromEntries(
      problems.map((key) => [key, "Yes"])
    );

    const unselectedProblems = problem
      .filter((item) => !problems.includes(item.name))
      .map((item) => item.name);
    const dataProblemsNo = Object.fromEntries(
      unselectedProblems.map((key) => [key, "No"])
    );

    dataProblemsNo.customNEWProblemOther = otherProblemValue?.trim() ? otherProblemValue : "No";

    const oldAddreses = (person.addresses?.length
      ? `${person.addresses[person.addresses.length - 1]?.street ?? ""} ${person.addresses[person.addresses.length - 1]?.city ?? ""} ${person.addresses[person.addresses.length - 1]?.state ?? ""} ${person.addresses[person.addresses.length - 1]?.code ?? ""} ${person.addresses[person.addresses.length - 1]?.country ?? ""}`
      : "")
      ?? ""

    const days = dataSaved?.daysWeekSelected;
    const daysSelected = Array.isArray(days)
      ? days.join('-')
      : days?.replace(/[\[\]"]+/g, '').replace(',', '-');


    const dataJson = {
      personId: context.person.id,
      stage: dataSaved?.stage,
      customNEWLeadType: dataSaved?.leadType || "",
      customNEWPIPELINE: dataSaved?.pipeline || "",
      customNEWStage: dataSaved?.stage || "",
      customVANOANSWERATTEMPTS: dataSaved?.attemps || "",
      customNEWClientOpenToNewContactInTheFuture:
        dataSaved?.contactFuture || "",
      customNEWClientSQualifyAs: dataSaved?.clientQualify || "",
      customVAAMPMTimeToCall: dataSaved?.bestTimeToCall || "",
      customVAAMPM2ndTimeToCall: dataSaved?.bestTimeToCall2 || "",
      ...dataProblemsYes,
      ...dataProblemsNo,
      customVAPromiseToCallOrApptReminder: dataSaved?.clientReadyDate || "", /////RENOMBRAR CUSTOM FIELDs
      customVANextContactDay3M: dataSaved?.nextContactDay || "",
      customVAPASTCLIENTTAGSFOLLOWUP: dataSaved?.pastClientTag || "",
      customClientLanguage: dataSaved?.language || "",
      customBestDaysToCall: daysSelected || "",
      customVALastLeadSource: dataSaved?.lastSource || "",
      customVACampaing: dataSaved?.lastSource?.includes('Facebook') ? dataSaved?.campaing : "",
      //customNextContactDayNote: dataSaved?.nextContactDayNote || "",
      //customPromiseToCallOrApptReminderNote: dataSaved?.clientReadyDateNote || "" 
    };

    if (dataSaved?.sellerAddress !== oldAddreses) {
      const copiaAddresses = [...person.addresses]
      copiaAddresses.push({
        street: dataSaved?.sellerAddress
      })
      dataJson.addresses = copiaAddresses
    }

    if (dataSaved.clientReadyDateCheck) {
      const fechaFormated = formatearFecha(new Date());
      // dataJson.background = `${context.user.name
      //   } -- ${fechaFormated}\n APPT THANK YOU DATE: ${formatearFecha(
      //     new Date(dataSaved?.clientReadyDate + "T16:00:00")
      //   )}\n Description: ${dataSaved?.clientReadyDateNote} \n\n ${person.background}`;
    }
    dataJson.customAdminPondCheckedByAdmin = dataSaved.checkByAdmin || "No"

    const put_stage = await putStage(dataJson);
    if (put_stage.success) {
      toast.success("People actualizada", {
        position: "top-right",
        autoClose: 2000,
      });
    }

    // Crear nota si cambió el stage

    if (person.stage !== dataSaved?.stage) {
      const text = `<b>${context.user.name}</b> changed the Stage from <b style="color: red">${person.stage}</b> to <b style="color: green">${dataSaved?.stage}</b>`
      await createStageChangeNoteNew(`STAGE UPDATED ${dataSaved?.stage}`, text);
    }
  };
  //CREA NOTA EN EL PERFIL
  const createStageChangeNoteNew = async (subject, text) => {
    const dataNote = {
      personId: Number(context.person.id),
      subject: subject,
      body: text
      //text: `<b>${context.user.name}</b> changed the Stage from <b style="color: red">${context.person.stage.name}</b> to <b style="color: green">${formData?.stage}</b>`
    };

    const put_stage = await createNote(dataNote);
    if (put_stage.success) {
      toast.success("Nota de cambio creada", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };
  //CREA NOTA EN EL PERFIL
  const createStageChangeNote = async (newStage) => {
    const dataNote = {
      oldStage: personFilter?.stage,
      personId: person.id,
      userName: context.user.name,
      newStage,
    };

    const put_stage = await createNote(dataNote);
    if (put_stage.success) {
      toast.success("Nota de cambio de etapa creada", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  const cleanSelectProblems = (valor) => {
    setCleanProblems(valor);
  };

  return (
    <div className="px-1 py-0">
      <div className="d-flex justify-content-center mb-1">
        <b className="fs-5 border-bottom border-2 border-black">
          MAIN CLIENT DATA ENTRY
        </b>
      </div>
      <div className="accordion small" id="accordionExample">
        <div className="accordion-item border border-3 border-black rounded-1 mb-2">
          <h2 className="accordion-header" id="headingOne">
            <button
              className="accordion-button"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseOne"
              aria-expanded="true"
              aria-controls="collapseOne"
            >
              Type // Pipeline // Stage // Legal Status
            </button>
          </h2>
          <div
            id="collapseOne"
            className="accordion-collapse collapse show"
            aria-labelledby="headingOne"
            data-bs-parent="#accordionExample"
          >
            <div className="accordion-body m-0 py-1 px-0">
              <Accordion1
                handleFormData={handleFormData}
                personFilter={personFilter}
                cleanSelectProblems={cleanSelectProblems}
                apptFub={apptFub}
              />
            </div>
          </div>
        </div>
        <div className={`accordion-item  rounded-1 mb-2 ${(!formDataAccordion1?.pipeline?.includes(1) && !formDataAccordion1?.pipeline?.includes("Other")) && personFilter?.problems?.length === 0 ? "border border-3 border-danger" : "border border-3 border-black"}`}>
          <h2 className="accordion-header" id="headingTwo">
            <button
              className="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseTwo"
              aria-expanded="false"
              aria-controls="collapseTwo"
            >
              Client Main Problems
            </button>
          </h2>
          <div
            id="collapseTwo"
            className="accordion-collapse collapse"
            aria-labelledby="headingTwo"
            data-bs-parent="#accordionExample"
          >
            <div className="accordion-body m-0 py-1 px-0">
              <Accordion2
                handleFormData={handleFormData}
                personFilter={personFilter}
                typeProblems={typeProblems}
                cleanSelectProblems={cleanSelectProblems}
                cleanProblems={cleanProblems}
                problem={problem}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-center align-items-center mt-1 mb-1">
        <button className="btn btn-success" onClick={handleSave} disabled={statusBtn || !formDataAccordion1?.leadType}>
          <i className="bi bi-floppy me-1"></i> {statusBtn ? "Saving..." : "Save"}
        </button>
      </div>
      {/* Alerta que sale despues de salvar */}
      {showAlert && (
        <Alert
          type="warning"
          onClose={() => setShowAlert(false)}
          duration={3000}
        />
      )}
    </div>
  );
}
