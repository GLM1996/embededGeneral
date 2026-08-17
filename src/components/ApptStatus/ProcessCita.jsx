import React, { useState, useEffect, useCallback } from "react";
import {
  searchAppointmentOutcomeFUB,
  searchAppointmentTypeOutcomeFUB,
  getChoicesCustomFields,
  searchStages,
  updateAppointment,
  putStage,
  saveAppointmentMongoCaptacionV2,
  saveAppointmentMongoDatosClienteV2,
  postTask,
  saveAppointment,
  getAppointmentMongo,
  createNote,
  getCaptacionPeopleMongo,
} from "../../config/funciones";
import {
  ajustarFecha,
  ajustarFechaUtcModify,
  formatearFecha,
  servidor_n8n,
} from "../../config/utils";
import Loading from "../Loading";
import { toast } from "react-toastify";
import { Time } from "../../config/Select";
import { useAppContext } from "../../context/AppContext";
import { TextField, Autocomplete } from "@mui/material";
import { leadCampaigns } from "../../config/Campaign";
import { followUpSources } from "../../config/Campaign";
import MuiMultiSelect from "./Checkmarks";
import { CustomProcessCita } from "../../config/CustomFields";
import { getCustomFields } from "../../config/funciones";
import Accordion2 from "./Accordion2";
import { searchCustomFields } from "../../config/funciones";
import ReasonDidSign from "./ReasonDidSign";
import { now } from "moment-timezone";

export default function ProcessCita({
  handleFormData,
  appointment,
  handleBack,
  personFilter,
  lastCita,
}) {
  const [loading, setLoading] = useState(false);
  const [finishChoices, setFinishChoices] = useState(false);
  const [formData, setFormData] = useState({
    datePending: "",
    dateTime: "",
    dateLastSource: "",
  });
  const [typeOutcomeFUB, setTypeOutcomeFUB] = useState([]);
  const [outcomeFUB, setOutcomeFUB] = useState([]);
  const [choices, setShoices] = useState([]);
  const [stages, setStages] = useState([]);
  const [stagesFiltered, setStagesFiltered] = useState([]);

  const [quitReasonSpecificChoices, setQuitReasonSpecificChoices] = useState(
    [],
  );
  const [appointmentDb, setAppointmentDB] = useState();
  const [statusBtn, setStatusBtn] = useState(false);
  const [needFollowUp, setNeedFollowUp] = useState(false);
  const [reasonOther, setReasonOther] = useState([]);
  const [quitReasonSpecificFilter, setQuitReasonSpecificFilter] = useState([]);
  const [rasonOtherControl, setReasonOtherControl] = useState(false);

  const { person, context, dataCampaingSheet } = useAppContext();

  const [formDataAccordion2, setFormDataAccordion2] = useState();
  const [formDataReason, setFormDataReason] = useState();
  const [typeProblems, setTypeProblems] = useState(person?.customNEWLeadType);

  const [cleanProblems, setCleanProblems] = useState(false);
  const [cleanReason, setCleanReason] = useState(false);
  const [problem, setProblems] = useState([]);
  const [reasonDidSign, setReasonDidSign] = useState([]);

  const cleanSelectProblems = (valor) => {
    setCleanProblems(valor);
  };
  const cleanSelectReason = (valor) => {
    setReasonDidSign(valor);
  };

  //SE ENCARGA DE MANTENER ACTUALIZADA LA INFO DESDE LOS COMPONENTES
  const handleFormDataAcc = (accordion, data) => {
    switch (accordion) {
      case 2:
        setFormDataAccordion2(data);
        break;
      default:
        break;
    }
  };

  const handleFormDataReason = (accordion, data) => {
    switch (accordion) {
      case 2:
        setFormDataReason(data);
        break;
      default:
        break;
    }
  };

  const ids = (CustomProcessCita ?? []).join(",");

  //cargar toda la data de los customfields pero sin asignar valores
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setFinishChoices(false);

      try {
        const [data, responseStages, outcomes, typeOutcome, dataCustomFields] =
          await Promise.all([
            getCustomFields(ids),
            searchStages(),
            searchAppointmentOutcomeFUB(),
            searchAppointmentTypeOutcomeFUB(),
            searchCustomFields(),
          ]);

        if (outcomes?.success) {
          const filterOutcomes = outcomes.data.filter(
            (item) => !/\d/.test(item.name),
          );
          setOutcomeFUB(filterOutcomes);
          //setOutcomeFUB(outcomes.data);
        }

        if (typeOutcome?.success) {
          setTypeOutcomeFUB(typeOutcome.data);
        }

        if (dataCustomFields && dataCustomFields?.length > 0) {
          const filtered = dataCustomFields.filter((item) =>
            item.label.toLowerCase().includes("(NEW) Problem".toLowerCase()),
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

          const filteredReason = dataCustomFields.filter((item) =>
            item.label
              .toLowerCase()
              .includes("(NEW) Didn´t Sign Reason".toLowerCase()),
          );
          setReasonDidSign(filteredReason);
        }

        setShoices(data); // <-- Este parece un typo, ¿debería ser setChoices?

        const filterStages = responseStages.stages.filter((item) =>
          item.name.includes("*"),
        );
        const lead = responseStages.stages.find((item) => item.name === "Lead");
        const trash = responseStages.stages.find(
          (item) => item.name === "Trash",
        );

        if (lead) filterStages.push(lead);
        if (trash) filterStages.push(trash);

        setStages(filterStages);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
        setFinishChoices(true);
      }
    };

    fetchData();
  }, []);
  //actualiza los valores que vienen desde los datos
  useEffect(() => {
    const fetchData = async () => {
      if (appointment && finishChoices) {
        filtrarStages(person?.customNEWPIPELINE || "");
        const findItem = outcomeFUB.find(
          (item) => item.id === Number(appointment?.outcomeId),
        );

        const updated = {
          outcome: Number(appointment?.outcomeId || ""),
          typeOutcomeName: findItem ? findItem?.name : "",
          pipeline: person?.customNEWPIPELINE || "",
          stage: person?.stage || "",
          datePending: new Date().toISOString()?.split("T")[0],
          dateTime: "09:00 AM",
          //cita: "Waiting for Appt date",
          lastSource: person?.customVALastLeadSource || "",
          campaing: person?.customVACampaing || "",
          dateLastSource: person?.customAdminLastLeadSourceDate || "",
          notaPond: personFilter?.notaPond || "",
          readyBuySell: person?.customVaClientSignedReadyToBuyOrSell || "",
          clientReadyDate: person?.customVAClientSignedReadyToBuyOrSellDate || ""
        };
        const cita = personFilter?.citas?.find(
          (item) => item.appointmentId === appointment.id,
        );

        if (cita) {
          //updated.cita = cita?.attendance;
          updated.actions = cita?.results;
          updated.reasonSign = person?.customNEWDidnTSignReason;
          updated.pendiente = cita?.pending;
          updated.datePending = cita?.datePending.slice(0, 10);
          //updated.dateTime=cita?.datePending.slice(10) || "09:00 AM"
          updated.dateTime =
            ajustarFechaUtcModify(cita?.datePending)?.slice(17) || "09:00 AM";
          ((updated.lastSource =
            cita?.lastSource || person?.customVALastLeadSource || ""),
            (updated.campaing =
              cita?.customVACampaing || person?.customVACampaing || ""));
          updated.whyNoCita = cita?.typeProblems || "";
          ((updated.problem = cita?.problem || ""),
            (updated.feedback =
              cita?.feedbackStatusCorrectionDate || cita?.feedback || ""),
            (updated.feedbackStatus =
              cita?.feedbackStatusCorrection || cita?.feedbackStatus || ""));
        }
        if (person?.stage?.toLowerCase().includes("4- decided to quit")) {
          filtrarWhyIsOutReason(personFilter?.whyIsOutReason);
          updated.whyIsOut = personFilter?.whyIsOut || "";
          updated.whenIsOut =
            personFilter?.whenIsOut?.split("T")[0] ||
            new Date().toISOString().split("T")[0];
          updated.whyIsOutReason = personFilter?.whyIsOutReason || "";
          const coincidencia =
            personFilter?.whyIsOutReason?.split("-")[0] || "";

          if (
            coincidencia &&
            !personFilter?.whyIsOutReasonSpecific?.includes(coincidencia)
          ) {
            updated.whyIsOutReasonSpecific = `${coincidencia}- (BUYER)  Other (please specify)`;
          } else {
            updated.whyIsOutReasonSpecific =
              personFilter?.whyIsOutReasonSpecific || "";
          }
          updated.note = personFilter?.whyIsOutReasonSpecific || "";
          updated.reasonOther = personFilter?.whyIsOutReasonSpecific || "";
        }
        setFormData(updated);
        try {
          const data = await getAppointmentMongo(appointment.id);
          if (data) {
            setAppointmentDB(data[0] || []);
          }
        } catch (error) {
          console.log(error);
        }
      }
    };
    fetchData();
  }, [appointment, personFilter, finishChoices]);

  const handleChange = (clave, valor) => {
    const updated = { ...formData, [clave]: valor };

    if (clave === "typeOutcome") {
      const findItem = typeOutcomeFUB.find((item) => item.id === Number(valor));
      updated.typeOutcomeName = findItem.name || "";
    }

    if (clave === "outcome") {
      const findItem = outcomeFUB.find((item) => item.id === Number(valor));
      updated.typeOutcomeName = findItem?.name || "";
      updated.outcome = Number(valor);
    }
    setFormData(updated); // actualiza el estado local del hijo
    //handleFormData(1, updated);      // notifica al padre con los datos actualizados
  };
  //SE ENCARGA DE FILTRAR LOS STAGES SEGUN EL PIPELINE SELECCIONADO
  const filtrarStages = (pipeline) => {
    if (pipeline !== "Other Stages") {
      const coincidencia = pipeline?.split("-")[0];
      const stagesData = stages.filter((item) =>
        item.name.includes(coincidencia + "-"),
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
  //SE ENCARGA DE CABIAR EL PIPELINE Y DE LLAMAR A FILTRAR LOS STAGES
  const handlePipeline = (valor) => {
    handleChange("pipeline", valor);
    filtrarStages(valor);
  };
  const filtrarWhyIsOutReason = (reason) => {
    const leadType = (person?.customNEWLeadType ?? "").toLowerCase();

    if (!reason?.includes("OTHER")) {
      const coincidencia = reason?.split("-")[0];

      setQuitReasonSpecificFilter(
        quitReasonSpecificChoices.filter((item) => {
          const itemLower = (item ?? "").toLowerCase();

          // 1) Debe corresponder a la reason (ej: "1-" o "2-")
          const matchesReason = item.includes(coincidencia + "-");
          if (!matchesReason) return false;

          // 2) Extraer tipo dentro de paréntesis: "(Buyer) ..." -> "buyer"
          const itemType = (itemLower.match(/\(([^)]+)\)/)?.[1] ?? "").trim(); // buyer / seller

          // 3) Match por lead type (buyer converted... incluye buyer)
          const matchesLead =
            (itemType && leadType.includes(itemType)) ||
            (leadType === "buyer & seller" && !itemLower.includes("refi"));

          return matchesLead;
        }),
      );

      if (personFilter?.whyIsOutReasonSpecific) {
        if (quitReasonSpecificFilter?.length === 0) {
          setReasonOtherControl(true);
          setReasonOther(true);
        }
      } else {
        setReasonOther(false);
      }
    } else {
      setQuitReasonSpecificFilter([]);
      setReasonOther(true);
    }

    if (reason?.includes("OTHER")) {
      setReasonOther(true);
    }
  };
  //CAMBIA WHY IS OUT RESON Y DE LLAMAR FILTRAR LAS RAZONES
  const handleWhyIsOutReason = (valor) => {
    handleChange("whyIsOutReason", valor);
  };
  //SE ENCARGA DE DAR ESTILO CUANDO EL VALOR ES VACIO
  const getClassEmpty = (clave) => {
    if (formData[clave] === "" || !formData[clave]) {
      return "border-danger-suave";
    }
  };
  // Normaliza custom fields: puede venir {data: [...]} o [...]
  const choicesResp = choices?.data ?? choices ?? [];

  const byId = useCallback(
    (id) => choicesResp.find((f) => f.id === id)?.choices ?? [],
    [choicesResp],
  );
  //FUNCCION PRINCIPAL QUE SE ENCARGA DE TODAS LAS AUTOMATIZACIONES
  const handleSave = async () => {
    setStatusBtn(true);
    if (
      formData?.actions?.includes("Qualify") &&
      (!formDataAccordion2 ||
        !Object.keys(formDataAccordion2).length ||
        !Object.values(formDataAccordion2).some((value) => value === "Yes"))
    ) {
      setStatusBtn(false);
      toast.error("Debe marcar al menos una opción como Yes", {
        position: "top-right",
        autoClose: 2000,
      });
      return;
    }

    try {
      if (formData?.outcome === 112) {
        const urlNew = `${servidor_n8n}/webhook/5d822c56-1a7c-4ba5-bc6e-c5029cf0097b`;

        try {
          const dataN8n = {
            apptId: appointment.id,
          };
          const options = {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // "Authorization": `Bearer ${token}`, // Descomenta si necesitas autenticación
            },
            //Eddie-Morales-Phone
            body: JSON.stringify(dataN8n),
          };
          await fetch(urlNew, options);
        } catch (error) {
          console.log(error);
        }
      }
      //// Para cuando el cliente se manda al pond registrar el Motivo
      const stagesPond = [
        "Trash",
        "6-DO NOT CALL LIST *",
        "6-NO ACTION TO TAKE *",
        "6- INVESTOR *",
        "6-UNRESPONSIVE *",
      ];

      if (stagesPond.includes(formData?.stage)) {
        if (
          person.stage !== formData.stage ||
          personFilter.notaPond !== formData.notaPond
        ) {
          if (!formData.notaPond) {
            toast.warning(" WHY THIS STAGE IS EMPTY ");
            return;
          }
          const dataPond = {
            clientId: person.id,
            link: `https://homelasvegasnevada.followupboss.com/2/people/view/${person.id}`,
            name: person.name,
            updatedBy: context.user.name,
            stage: formData?.stage,
            razon: formData?.notaPond,
            date: formatearFecha(new Date()),
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
              },
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
      // Ejecutar todas las operaciones independientemente de si fallan o no
      const operations = [
        updateAppointmentIfNeeded(),
        updateMongoDBCaptacion(),
        updateMongoDBCitas(),
        updateGoogleSheets(),
        updateFollowUpBossIfNeeded(),
      ];

      // Ejecutar todas las operaciones y capturar los resultados
      const results = await Promise.allSettled(operations);

      const errors = results.filter((result) => result.status === "rejected");

      if (errors.length > 0) {
        const errorMessages = errors
          .map(
            (err, i) =>
              `${i + 1}. ${err.reason?.message || "Error desconocido"}`,
          )
          .join("\n");

        toast.error(
          `Se completó con ${errors.length} errores:\n${errorMessages}`,
          {
            position: "top-right",
            autoClose: 5000,
          },
        );
        // Esperar 5 segundos antes de recargar
        /*setTimeout(() => {
          window.location.reload();
        }, 5000);*/
      } else {
        toast.success("Todas las operaciones se completaron con éxito", {
          position: "top-right",
          autoClose: 2000,
        });
        //window.location.reload();
      }
    } catch (error) {
      console.log(error);
      toast.error("Ocurrió un error inesperado", {
        position: "top-right",
        autoClose: 2000,
      });
    } finally {
      setStatusBtn(false);
      window.location.reload();
    }
  };
  //ACTUALIZA EL APPOINTMENT DES SER NECESARIO
  const updateAppointmentIfNeeded = async () => {
    if (appointment.outcomeId !== Number(formData?.outcome)) {
      appointment.newOutcome =
        formData.outcome !== null ? Number(formData.outcome) : null;
      const put_appointment = await updateAppointment(appointment);

      if (put_appointment.success) {
        toast.success("Appt actualizado", {
          position: "top-right",
          autoClose: 2000,
        });
      }
    }
  };
  //ACTUALIZA LA BASE DE DATOS EN MONGO DB (PERSON)
  const updateMongoDBCaptacion = async () => {
    const dataSaved = {
      personId: context.person.id,
      pipeline: personFilter?.pipeline,
      stage: formData?.stage,
    };
    if (lastCita?.id === appointment?.id) {
      dataSaved.pipeline = formData?.pipeline;
    }

    if (formData?.stage?.toLowerCase().includes("4- decided to quit")) {
      dataSaved.whyIsOut = formData?.whyIsOut || "";
      dataSaved.whenIsOut = new Date(formData?.whenIsOut || "");
      dataSaved.whyIsOutReason = formData?.whyIsOutReason || "";
      dataSaved.whyIsOutReasonSpecific =
        formData?.whyIsOutReason?.toLowerCase().includes("other") ||
        formData?.whyIsOutReasonSpecific?.toLowerCase().includes("other")
          ? formData?.reasonOther || ""
          : formData?.whyIsOutReasonSpecific || "";

      const text = `<b style="color: red">${formData?.note}</b>`;
      await createStageChangeNote("DECIDED QUIT NOTE", text);
    }

    const response = await saveAppointmentMongoCaptacionV2(dataSaved);
    if (response.success) {
      toast.success(`BD ${response.operation} Captacion`, {
        position: "top-right",
        autoClose: 2000,
      });
    } else {
      throw new Error("Save APPT DB FAIL");
    }
  };
  //ACTUALIZA LA BASE DE DATOS EN MONGO DB (CITAS)
  const updateMongoDBCitas = async () => {
    if (new Date(appointment.created) < new Date("2023-02-16")) {
      return;
    }
    const dataSavedCliente = {
      vaName: context.user.name,
      personId: context.person.id,
      appointmentId: Number(appointment.id) || "",
      appointmentName: appointment?.title || "",
      appointmentTypeId: Number(appointment?.typeId) || "",
      appointmentOutcomeId: formData?.outcome || appointment.outcomeId || "",
      appointmentType: appointment.type || "",
      appointmentOutcome:
        outcomeFUB?.find((item) => item.id === Number(formData?.outcome))
          ?.name ||
        appointment.outcome ||
        "",
      appointmentStart: appointment?.start || "",
      realtorOrLender: appointmentDb?.realtorLender || "",
      realtorOrLenderName: appointmentDb?.realtorLenderValue || "",
      attendance: outcomeFUB?.find(
        (item) => item.id === Number(formData?.outcome),
      )?.name,
      typeProblems: formData.whyNoCita,
      problem: formData.problem,
      results: formData?.actions || "",
      pending: formData?.pendiente || "",
      datePending: formData?.datePending
        ? ajustarFecha(formData?.datePending, formData?.dateTime)
        : "",
      lastSource: formData?.lastSource || "",
      campaing: formData?.campaing || "",
      feedback: formData?.feedback || "",
      //feedbackStatus: formData?.feedbackStatus || ""
    };

    const cita = personFilter?.citas?.find(
      (item) => item.appointmentId === appointment.id,
    );
    if (cita && !cita?.feedbackStatus) {
      dataSavedCliente.feedbackStatus = formData?.feedbackStatus || "";
    } else {
      dataSavedCliente.feedbackStatus =
        cita?.feedbackStatus || formData?.feedbackStatus || "";
    }
    if (
      cita &&
      cita?.feedbackStatus !== formData?.feedbackStatus &&
      cita?.feedbackStatus
    ) {
      dataSavedCliente.feedbackStatusCorrection = formData?.feedbackStatus;
      dataSavedCliente.feedbackStatusCorrectionDate = new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone: "UTC",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        },
      ).format(new Date());
    }

    const response = await saveAppointmentMongoDatosClienteV2(dataSavedCliente);
    if (response.success) {
      toast.success(`BD ${response.operation} Cita`, {
        position: "top-right",
        autoClose: 2000,
      });
    } else {
      throw new Error("Save APPT DB FAIL");
    }
  };
  //Funcion que prepara el resto de la data de Sheet (New May 2025 Citas)
  function prepareDataForGoogleSheet() {
    const dataReady = {};

    switch (formData.outcome) {
      case 110:
        dataReady.actions = formData.actions;
        if (
          formData?.actions === "Client Didn´t Qualify" ||
          formData?.actions === "Client Didn´t Sign"
        ) {
          dataReady.requisitos = formData?.requisitos;
          if (formData?.requisitos === "Decided to Quit") {
            dataReady.whyNoContinue = formData?.whyNoContinue;
          }
        }
        break;

      case 111:
        dataReady.whyNoCita = formData?.whyNoCita;
        if (formData.whyNoCita === "External Problems") {
          dataReady.externalProblem = formData?.problem;
        } else {
          if (formData.whyNoCita === "Internal Problems") {
            dataReady.internalProblem = formData?.problem;
          }
        }
        break;
      case 112:
        dataReady.whyNoCita = formData?.whyNoCita;
        if (formData.whyNoCita === "External Problems") {
          dataReady.externalProblem = formData?.problem;
        } else {
          if (formData.whyNoCita === "Internal Problems") {
            dataReady.internalProblem = formData?.problem;
          }
        }

        break;
    }

    if (needFollowUp) {
      dataReady.pendiente = formData.pendiente || person.name;
      dataReady.createPending = formatearFecha(new Date());
      dataReady.datePending =
        formatearFecha(new Date(formData.datePending + "T06:00:00")) +
        ` ${formData.dateTime}`;
    }
    if (formData?.stage?.toLowerCase().includes("4- decided to quit")) {
      dataReady.whyIsOut = formData?.whyIsOut;
      dataReady.whyIsOutReason = formData?.whyIsOutReason;
      dataReady.whyIsOutReasonSpecific =
        formData?.whyIsOutReason?.toLowerCase().includes("other") ||
        formData?.whyIsOutReasonSpecific?.toLowerCase().includes("other")
          ? formData?.reasonOther || ""
          : formData?.whyIsOutReasonSpecific || "";
      dataReady.whenIsOut = formData?.whenIsOut;
    }

    return dataReady;
  }
  //ACTUALIZA LA HOJA DE CITAS  DE A SHEET DESDE n8n
  const updateGoogleSheets = async () => {
    if (new Date(appointment.created) < new Date("2023-02-16")) {
      return;
    }

    const dataReady = prepareDataForGoogleSheet();

    const userName = appointment.invitees.find(
      (item) => item.userId === appointment.createdById,
    )?.name;

    const initialData = {
      apptId: appointment.id,
      clientId: person?.id,
      updated: formatearFecha(new Date(person.updated)),
      name: person.name,
      updatedBy: context?.user?.name || "",
      va: userName || person?.assignedTo || context?.user?.name || "",
      stage: formData?.stage || person.stage || "",
      citas: 1,
      citasGo: getAttendanceCount(),
      citasNoGo: getNotAttendanceCount(),
      leadType: person?.customNEWLeadType,
      legalStatus: person?.customNEWClientSQualifyAs,
      source: person?.source || "",
      outcome: outcomeFUB?.find((item) => item.id === Number(formData?.outcome))
        ?.name,
      lastSource: formData?.lastSource || "",
      campaing: formData?.campaing || "",
      dateLastSource: formData?.dateLastSource || "",
      feedback: formData?.feedback
        ? new Intl.DateTimeFormat("en-US", {
            timeZone: "UTC",
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          }).format(new Date(formData.feedback))
        : "",
    };
    const cita = personFilter?.citas?.find(
      (item) => item.appointmentId === appointment.id,
    );

    if (cita && !cita?.feedbackStatus) {
      initialData.feedbackStatus = formData?.feedbackStatus || "";
    } else {
      initialData.feedbackStatus =
        cita?.feedbackStatus || formData?.feedbackStatus || "";
    }

    if (
      cita &&
      cita?.feedbackStatus !== formData?.feedbackStatus &&
      cita?.feedbackStatus
    ) {
      initialData.feedbackStatusCorrection = formData?.feedbackStatus;
      initialData.feedbackStatusCorrectionDate = new Intl.DateTimeFormat(
        "en-US",
        {
          timeZone: "UTC",
          month: "short",
          day: "2-digit",
          year: "numeric",
        },
      ).format(new Date());
    }

    let dataSaved = { ...initialData, ...dataReady };

    //SOLO PARA CITAS CON REALTORs
    if (formData?.actions?.includes("´t Sign")) {
      // Normaliza OTHER: si venía "Yes", cámbialo por el texto
      const OTHER_KEY = "customNEWDidnTSignReasonOther";

      if (formDataReason?.[OTHER_KEY] === "Yes") {
        formDataReason[OTHER_KEY] =
          formDataReason.textValue?.trim() || person?.[OTHER_KEY] || "No";
      }
      delete formDataReason.textValue;

      // reasonDidSign es ARRAY -> hacemos map name->label
      const labelByName = (reasonDidSign || []).reduce((acc, f) => {
        acc[f.name] = f.label;
        return acc;
      }, {});

      // Keys seleccionadas: valor "Yes" o (Other) texto válido
      const selectedNames = Object.entries(formDataReason || {})
        .filter(([name, value]) => {
          if (!labelByName[name]) return false;

          if (value === "Yes") return true;

          if (name === OTHER_KEY) {
            return typeof value === "string" && value.trim() && value !== "No";
          }

          return false;
        })
        .map(([name]) => name);

      // Construye labels (Other: label + texto)
      const problemReasonAll = selectedNames
        .map((name) => {
          //const label = labelByName[name] || name;
          const label = (labelByName[name] || name).replace(
            /^\(NEW\)\s*Didn´?t Sign Reason\s*-\s*/i,
            "",
          );

          if (name === OTHER_KEY) {
            const otherText = (formDataReason[name] || "").toString().trim();
            return otherText && otherText !== "No" ? `${otherText}` : label;
          }

          return label;
        })
        //.join(" | "); // cambia separador si quieres
        .join("\n");

      dataSaved = {
        ...dataSaved,
        ...formDataReason,
        problemReasonAll,
      };
    }

    //SOLO PARA CITAS CON LENDERs
    if (
      formData?.actions?.includes("Qualify") &&
      formDataAccordion2 &&
      Object.keys(formDataAccordion2).length
    ) {
      const OTHER_KEY = "customNEWProblemOther";

      if (formDataAccordion2?.[OTHER_KEY] === "Yes") {
        formDataAccordion2[OTHER_KEY] =
          formDataAccordion2.textValue?.trim() || person?.[OTHER_KEY] || "No";
      }
      delete formDataAccordion2.textValue;

      const labelByName = (problem || []).reduce((acc, f) => {
        acc[f.name] = f.label;
        return acc;
      }, {});

      const selectedNames = Object.entries(formDataAccordion2 || {})
        .filter(([name, value]) => {
          if (!labelByName[name]) return false;
          if (value === "Yes") return true;

          if (name === OTHER_KEY) {
            return typeof value === "string" && value.trim() && value !== "No";
          }
          return false;
        })
        .map(([name]) => name);

      const problemAll = selectedNames
        .map((name) => {
          const cleanLabel = (labelByName[name] || name)
            .replace(/^\(NEW\)\s*Problem\s*:\s*/i, "")
            .trim();

          if (name === OTHER_KEY) {
            const otherText = (formDataAccordion2[name] || "")
              .toString()
              .trim();
            return otherText && otherText !== "No"
              ? `${otherText}`
              : cleanLabel;
          }

          return cleanLabel;
        })
        //.join(" | ");
        .join("\n");

      dataSaved = {
        ...dataSaved,
        ...formDataAccordion2,
        problemAll,
      };
    }

    try {
      const url =
        "https://n8n.homelasvegasnevada.com/webhook/ae54b7d2-3abe-48e8-90fb-e7422b518a92";
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        //Eddie-Morales-Phone
        body: JSON.stringify(dataSaved),
      };
      const response = await fetch(url, options);
    } catch (error) {
      console.log(error);
    }
  };
  //PREPARA DATOS PARA LA SHEET
  const getAttendanceCount = () => {
    if (formData?.outcome === 110) return 1;
    if (formData?.outcome === 108) return "Pendiente";
    return 0;
  };
  //PREPARA DATOS PARA LA SHEET
  const getNotAttendanceCount = () => {
    if (formData?.outcome === 111) return 1;
    if (formData?.outcome === 112) return 1;
    if (formData?.outcome === 108) return "Pendiente";
    return 0;
  };
  //ACTUALIZA FOLLOW UP BOSS DE SER NECESARIO
  const updateFollowUpBossIfNeeded = async () => {
    //if (!shouldUpdateFollowUpBoss()) return;
    let dataJson = {
      personId: context.person.id,
      customVAApptFollow: formData?.datePending || "",
      customVALastLeadSource: formData?.lastSource || "",
      customVACampaing: formData?.campaing || "",
      customAdminLastLeadSourceDate: formData?.dateLastSource || "",
      customVaClientSignedReadyToBuyOrSell: formData?.readyBuySell || "",
      customVAClientSignedReadyToBuyOrSellDate: formData?.clientReadyDate || ""
    };
    if (lastCita?.id === appointment?.id) {
      dataJson.customNEWPIPELINE = formData?.pipeline;
      dataJson.stage = formData?.stage;
      dataJson.customVALASTAPPTATTENDANCE =
        outcomeFUB?.find((item) => item.id === Number(formData?.outcome))
          ?.name || "";
      dataJson.customVALASTAPPTRESULTS = formData?.actions || "";
    }

    if (formData?.pendiente?.trim() && needFollowUp) {
      const fechaFormated = formatearFecha(new Date());
      // dataJson.background = `${context.user.name
      //   } -- ${fechaFormated}\n APPT PENDING ACTION DATE: ${formatearFecha(
      //     new Date(formData?.datePending + "T16:00:00")
      //   )}\n Description: ${formData?.pendiente} \n\n ${person.background}`;
      await createPendingTask();
    }
    if (
      formDataAccordion2 &&
      typeof formDataAccordion2 === "object" &&
      !Array.isArray(formDataAccordion2) &&
      Object.keys(formDataAccordion2).length > 0
    ) {
      // problems tiene data (tiene propiedades)
      if (
        formDataAccordion2 &&
        formDataAccordion2.customNEWProblemOther === "Yes"
      ) {
        formDataAccordion2.customNEWProblemOther =
          formDataAccordion2.textValue?.trim() ||
          person?.customNEWProblemOther ||
          "No";

        delete formDataAccordion2.textValue;
      }
      //dataJson = { ...dataJson, ...formDataAccordion2 };
    }

    //SOLO PARA CITAS CON REALTORs
    if (formData?.actions?.includes("´t Sign")) {
      if (formDataReason?.customNEWDidnTSignReasonOther === "Yes") {
        formDataReason.customNEWDidnTSignReasonOther =
          formDataReason.textValue?.trim() ||
          person?.customNEWDidnTSignReasonOther ||
          "No";
      }
      delete formDataReason.textValue;
      dataJson = { ...dataJson, ...formDataReason };
    }
    //SOLO PARA CITAS CON LENDERs
    if (
      formData?.actions?.includes("Qualify") &&
      formDataAccordion2 &&
      Object.keys(formDataAccordion2).length
    ) {
      if (formDataAccordion2?.customNEWProblemOther === "Yes") {
        formDataAccordion2.customNEWProblemOther =
          formDataAccordion2.textValue?.trim() ||
          person?.customNEWProblemOther ||
          "No";
      }
      delete formDataAccordion2.textValue;
      dataJson = { ...dataJson, ...formDataAccordion2 };     
    }

    // Actualizar stage en FUB
    const put_stage = await putStage(dataJson);
    if (put_stage.success) {
      toast.success("People actualizada", {
        position: "top-right",
        autoClose: 2000,
      });
    } else {
      throw new Error("Editar Persona FAIL");
    }

    // Crear nota si cambió el stage
    if (
      context.person.stage.name !== formData?.stage &&
      lastCita?.id === appointment?.id
    ) {
      const text = `<b>${context.user.name}</b> changed the Stage from <b style="color: red">${context.person.stage.name}</b> to <b style="color: green">${formData?.stage}</b>`;
      await createStageChangeNote(`STAGE UPDATED >> ${formData?.stage}`, text);
    }
  };
  //CREA TASK AUTOMATICO
  const createPendingTask = async () => {
    const fechaAjustada = ajustarFecha(
      formData?.datePending,
      formData?.dateTime,
    );

    const dataTask = {
      personId: Number(context.person.id),
      assignedUserId: Number(person.assignedUserId),
      name: formData?.pendiente,
      type: "Follow Up",
      dueDateTime: fechaAjustada,
    };
    console.log(dataTask)
    const put_stage = await postTask(dataTask);
    if (put_stage.success) {
      toast.success("Task Creada actualizada", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };
  //CREA TASK AUTOMATICO
  const createStageChangeNote = async (subject, text) => {
    const dataNote = {
      personId: Number(context.person.id),
      subject: subject,
      body: text,
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
  ///Filtro de razones
  const leadType = (person?.customNEWLeadType ?? "").toLowerCase();

  const opcionesFiltradas = byId(259).filter((item) => {
    const itemLower = (item ?? "").toLowerCase();

    // 2) Extraer tipo dentro de paréntesis: "(Buyer) ..." -> "buyer"
    const itemType = (itemLower.match(/\(([^)]+)\)/)?.[1] ?? "").trim();

    // 3) Match por lead type
    const matchesLead =
      (itemType && leadType.includes(itemType)) ||
      (leadType === "buyer & seller" && !itemLower.includes("refi"));

    return matchesLead;
  });

  const coincidencia = (formData?.whyIsOutReason ?? "").includes("OTHER")
    ? ""
    : (formData?.whyIsOutReason ?? "").split("-")[0];

  const opcionesFiltradasEspecificas = (
    formData?.whyIsOutReason ?? ""
  ).includes("OTHER")
    ? [] // si es OTHER, no muestras opciones (o muestra todas si prefieres)
    : byId(260).filter((item) => {
        const itemLower = (item ?? "").toLowerCase();

        //if (itemLower.includes("other")) return false;

        // 1) Debe corresponder a la reason (ej: "1-" o "2-")
        const matchesReason = item.includes(coincidencia + "-");
        if (!matchesReason) return false;

        // 2) Extraer tipo dentro de paréntesis: "(Buyer) ..." -> "buyer"
        const itemType = (itemLower.match(/\(([^)]+)\)/)?.[1] ?? "").trim();

        // 3) Match por lead type
        const matchesLead =
          (itemType && leadType.includes(itemType)) ||
          (leadType === "buyer & seller" && !itemLower.includes("refi"));

        return matchesLead;
      });

  if (loading || !finishChoices) {
    return <Loading text="Loading Choices" />;
  }
  //Stages del Pond
  const stagesPond = [
    "Trash",
    "6-DO NOT CALL LIST *",
    "6-NO ACTION TO TAKE *",
    "6- INVESTOR *",
    "6-UNRESPONSIVE *",
  ];

  return (
    <div className="row w-100 m-auto bg-info">
      <button className="btn btn-primary" onClick={handleBack}>
        <i className="bi bi-arrow-left"></i> Back
      </button>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        {appointment !== "" && (
          <>
            {/* Appoitment Outcome */}
            <div className="col-12">
              <b>Outcome (Appt Attendance)</b>
              <select
                className={`form-select form-select-sm ${getClassEmpty(
                  "outcome",
                )} `}
                aria-label="Lead type select"
                value={formData?.outcome || ""}
                onChange={(e) => handleChange("outcome", e.target.value)}
                required
              >
                <option value="">EMPTY</option>
                <option disabled>----------</option>
                {outcomeFUB.map((item, index) => (
                  <option key={index + 1} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            {/*Cuando es si */}
            {formData?.outcome &&
              formData?.outcome === 110 && ( //Appt Attended
                <>
                  {/* Appt Result */}
                  <div className="col-12">
                    <b>Appt Result</b>
                    <select
                      className={`form-select form-select-sm ${getClassEmpty(
                        "actions",
                      )} `}
                      aria-label="Lead type select"
                      value={formData?.actions}
                      onChange={(e) => handleChange("actions", e.target.value)}
                      required
                    >
                      <option value="">EMPTY</option>
                      <option disabled>----------</option>
                      {byId(241).map((item, index) => {
                        if (person?.customNEWLeadType === "Personal Rent") {
                          if (
                            !item.includes("Qualified") &&
                            !item.includes("Qualify")
                          ) {
                            <option key={index + 1} value={item}>
                              {item}
                            </option>;
                          } else {
                            return null;
                          }
                        }
                        if (appointmentDb?.realtorLender === "REALTOR") {
                          if (
                            !item.includes("Qualified") &&
                            !item.includes("Qualify")
                          ) {
                            <option key={index + 1} value={item}>
                              {item}
                            </option>;
                          } else {
                            return null;
                          }
                        }
                        if (appointmentDb?.realtorLender === "LENDER") {
                          if (
                            !item.includes("Sign") &&
                            !item.includes("Signed")
                          ) {
                            <option key={index + 1} value={item}>
                              {item}
                            </option>;
                          } else {
                            return null;
                          }
                        }
                        return (
                          <option key={index + 1} value={item}>
                            {item}
                          </option>
                        );
                      })}
                      {/*actionsChoices.map((item, index) => {
                      if (person?.customNEWLeadType === "Personal Rent") {
                        if (!item.includes("Qualified") && !item.includes("Qualify")) {
                          <option key={index + 1} value={item}>
                            {item}
                          </option>
                        } else { return null }
                      }
                      return (
                        <option key={index + 1} value={item}>
                          {item}
                        </option>
                      )
                    })*/}
                    </select>
                  </div>

                  {/* Status feedback */}
                  {formData?.actions &&
                    !formData?.actions.includes("PENDING") && (
                      <>
                        <div className="d-flex flex-column">
                          <b>Date Feedback (Lender/Realtor)</b>
                          <div className="input-group input-group-sm mb-1">
                            <input
                              type="date"
                              className="form-control"
                              value={formData?.feedback || ""}
                              onChange={(e) =>
                                handleChange("feedback", e.target.value)
                              }
                              //required
                            />
                          </div>
                        </div>
                        <div className="col-12">
                          <b>Status Feedback (Lender/Realtor)</b>
                          <select
                            className="form-select form-select-sm"
                            aria-label="Lead type select"
                            value={formData?.feedbackStatus}
                            onChange={(e) =>
                              handleChange("feedbackStatus", e.target.value)
                            }
                            //required
                          >
                            <option value="">EMPTY</option>
                            <option disabled>----------</option>
                            <option value="Feedback Clear & Received">
                              Feedback Clear & Received
                            </option>
                            <option value="Feedback Clarification Needed">
                              Feedback Clarification Needed
                            </option>
                          </select>
                        </div>
                      </>
                    )}
                  {/*Cuando es Client Signed*/}
                  {formData?.actions === "Client Signed" && (
                    <>
                      <div className="col-12">
                        <b>Is the Client Ready to Buy/Sell?</b>
                        <select
                          className="form-select form-select-sm"
                          aria-label="Lead type select"
                          value={formData?.readyBuySell}
                          onChange={(e) =>
                            handleChange("readyBuySell", e.target.value)
                          }
                          //required
                        >
                          <option value="">EMPTY</option>
                          <option disabled>----------</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      {formData?.readyBuySell === "Yes" && (
                        <div className="d-flex flex-column">
                          <b>Client Ready Date</b>
                          <div className="input-group input-group-sm mb-1">
                            <input
                              type="date"
                              className="form-control"
                              value={formData?.clientReadyDate || ""}
                              onChange={(e) =>
                                handleChange("clientReadyDate", e.target.value)
                              }
                              required
                            />
                          </div>
                        </div>
                      )}
                      {formData?.readyBuySell === "No" && (
                        <>
                          <p className="bg-danger mx-2 p-1 my-1 text-center text-white font-bold">
                            Why the client didn`t continue ?
                          </p>
                          <div className="accordion-cita mx-0 my-2 py-1 px-0 border border-danger ">
                            <ReasonDidSign
                              handleFormData={handleFormDataReason}
                              personFilter={personFilter}
                              typeProblems={typeProblems}
                              cleanSelectProblems={cleanSelectReason}
                              cleanProblems={cleanReason}
                              problem={reasonDidSign}
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {/* Problemas */}
                  {formData?.actions?.includes("Qualify") && (
                    <>
                      <p className="bg-danger mx-2 p-1 my-1 text-center text-white font-bold">
                        Why the client didn`t qualify ?
                      </p>
                      <div className="accordion-cita mx-0 my-2 py-1 px-0 border border-danger ">
                        <Accordion2
                          handleFormData={handleFormDataAcc}
                          personFilter={personFilter}
                          typeProblems={typeProblems}
                          cleanSelectProblems={cleanSelectProblems}
                          cleanProblems={cleanProblems}
                          problem={problem}
                        />
                      </div>
                    </>
                  )}
                  {formData?.actions?.includes("´t Sign") && (
                    <>
                      <p className="bg-danger mx-2 p-1 my-1 text-center text-white font-bold">
                        Why the client didn`t sign ?
                      </p>
                      <div className="accordion-cita mx-0 my-2 py-1 px-0 border border-danger ">
                        <ReasonDidSign
                          handleFormData={handleFormDataReason}
                          personFilter={personFilter}
                          typeProblems={typeProblems}
                          cleanSelectProblems={cleanSelectReason}
                          cleanProblems={cleanReason}
                          problem={reasonDidSign}
                        />
                      </div>
                    </>
                  )}
                </>
              )}

            {choices.length > 0 && lastCita?.id === appointment.id && (
              <>
                {/* Pipelines */}
                <div className="col-12">
                  <b>Pipelines</b>
                  <select
                    className={`form-select form-select-sm ${getClassEmpty(
                      "pipeline",
                    )} `}
                    aria-label="Pipelines select"
                    value={formData?.pipeline || ""}
                    onChange={(e) => handlePipeline(e.target.value)}
                    required
                  >
                    <option value="">EMPTY</option>
                    <option disabled>----------</option>
                    {byId(217).map((option, index) => {
                      if (person?.customNEWLeadType === "Personal Rent") {
                        if (
                          option.includes(2) ||
                          option.includes(3) ||
                          option.includes(4) ||
                          option.includes(5)
                        ) {
                          <option key={index + 1} value={option}>
                            {option}
                          </option>;
                        } else {
                          return null;
                        }
                      }
                      return (
                        index !== 0 && (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        )
                      );
                    })}
                  </select>
                </div>
                {/* Stages */}
                <div className="col-12">
                  <b>Stages</b>
                  <select
                    className={`form-select form-select-sm ${getClassEmpty(
                      "stage",
                    )} `}
                    aria-label="Stages select"
                    value={formData?.stage || ""}
                    onChange={(e) => handleChange("stage", e.target.value)}
                    required
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
              </>
            )}

            {lastCita?.id !== appointment.id && (
              <div className="col-12 p-1">
                <h6 className="bg-danger fw-bold text-white rounded-2">
                  "There is a more recent appointment created. To change the
                  Stage, go to the latest appointment created."
                </h6>
              </div>
            )}
          </>
        )}

        <div className="col-12">
          <div className="bg-warning my-2 p-4 rounded-2 ">
            <div className="form-check d-flex justify-content-center align-items-center gap-2">
              <input
                className="form-check-input scale-checkbox me-2"
                type="checkbox"
                value={needFollowUp}
                id="checkDefault"
                onChange={() => setNeedFollowUp(!needFollowUp)}
              />
              <label
                className="form-check-label d-flex align-items-center fs-2 text-black"
                htmlFor="checkDefault"
              >
                Create a Follow Up Tasks?
              </label>
            </div>
          </div>
        </div>
        {/*Cosas Pendientes Por realtor ...*/}
        {formData?.outcome &&
          needFollowUp &&
          (formData?.outcome === 109 || // "Attendance Pending"
            formData?.outcome === 110 || //"Appt Attended"
            formData?.outcome === 111 || //"Appt NOT Attended"
            formData?.outcome === 112) && ( //"Appt Canceled"
            <>
              {/*Cosas Pendientes Por realtor ...*/}
              <div className="col-12">
                <b>Appt Follow Up</b>
                <div className="input-group input-group-sm mb-1">
                  <textarea
                    type="text"
                    className={`form-control ${getClassEmpty("pendiente")} `}
                    placeholder="pending actions"
                    value={formData?.pendiente}
                    onChange={(e) => handleChange("pendiente", e.target.value)}
                  />
                </div>
                <div className="d-flex flex-column">
                  <b>Appt Follow Up Date</b>
                  <div className="input-group input-group-sm mb-1">
                    <input
                      type="date"
                      className={`form-control ${getClassEmpty("datePending")} `}
                      value={formData?.datePending}
                      onChange={(e) =>
                        handleChange("datePending", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="d-flex flex-column">
                  <b>Appt Follow Up Time</b>
                  <div className="input-group input-group-sm mb-3">
                    <select
                      className="form-select form-select-sm"
                      aria-label="Pipelines select"
                      value={formData?.dateTime}
                      onChange={(e) => handleChange("dateTime", e.target.value)}
                      required
                    >
                      <option value="">EMPTY</option>
                      <option disabled>----------</option>
                      {Time.map((option, index) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
        {/* PARA CUANDO EL STAGE SE MANDA AL POND */}
        {stagesPond.includes(formData?.stage) && (
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
        )}
        {/* Cuando es 4- DECIDED TO QUIT */}
        {formData?.stage?.toLowerCase().includes("4- decided to quit") && (
          <>
            <div className="col-12">
              <b>Why did the client quit?</b>
              <div className="input-group input-group-sm mb-1">
                <textarea
                  type="text"
                  className={`form-control ${getClassEmpty("note")} `}
                  placeholder="note"
                  value={formData?.note || ""}
                  onChange={(e) => handleChange("note", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="col-12">
              <b>Client Quit Moment</b>
              <select
                className={`form-select form-select-sm ${getClassEmpty(
                  "whyIsOut",
                )} `}
                aria-label="Lead type select"
                value={formData?.whyIsOut || ""}
                onChange={(e) => handleChange("whyIsOut", e.target.value)}
                required
              >
                <option value="">EMPTY</option>
                <option disabled>----------</option>
                {byId(256).map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
                {/* {quitChoices.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))} */}
              </select>
            </div>
            <div className="col-12">
              <b>CLIENT QUIT REASONS</b>
              <select
                className={`form-select form-select-sm ${getClassEmpty(
                  "whyIsOutReason",
                )} `}
                aria-label="Lead type select"
                value={formData?.whyIsOutReason || ""}
                onChange={(e) => handleWhyIsOutReason(e.target.value)}
                required
              >
                <option value="">EMPTY</option>
                <option disabled>----------</option>
                {opcionesFiltradas.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12">
              <b>CLIENT QUIT REASONS SPECIFIC</b>
              {!formData?.whyIsOutReason?.includes("OTHER") && (
                <select
                  className={`form-select form-select-sm ${getClassEmpty(
                    "whyIsOutReasonSpecific",
                  )} `}
                  aria-label="Lead type select"
                  value={formData?.whyIsOutReasonSpecific || ""}
                  onChange={(e) =>
                    handleChange("whyIsOutReasonSpecific", e.target.value)
                  }
                  required
                >
                  <option value="">EMPTY</option>
                  <option disabled>----------</option>
                  {opcionesFiltradasEspecificas.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="col-12">
              <b>CLIENT QUIT DATE</b>
              <input
                className={`form-control form-control-sm ${getClassEmpty(
                  "whenIsOut",
                )} `}
                type="date"
                value={formData?.whenIsOut || ""}
                onChange={(e) => handleChange("whenIsOut", e.target.value)}
                required
              ></input>
            </div>
            {(formData?.whyIsOutReason?.toLowerCase().includes("other") ||
              formData?.whyIsOutReasonSpecific
                ?.toLowerCase()
                .includes("other") ||
              rasonOtherControl) && (
              <div className="input-group input-group-sm my-1">
                <textarea
                  type="text"
                  className={`form-control ${getClassEmpty("reasonOther")} `}
                  placeholder="other reason"
                  value={formData?.reasonOther}
                  onChange={(e) => handleChange("reasonOther", e.target.value)}
                  required
                />
              </div>
            )}
          </>
        )}
        {formData?.outcome && context?.user?.role === "Broker" && (
          <div className="fade-in">
            {/*LAST SOURCE */}
            <div className="col-12">
              <b>Last Appt Source</b>
              <Autocomplete
                value={formData?.lastSource || ""}
                onChange={(event, newValue) =>
                  handleChange("lastSource", newValue || "")
                }
                options={followUpSources}
                getOptionLabel={(option) => option || ""}
                isOptionEqualToValue={(option, value) => option === value}
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Follow Source"
                    size="small"
                  />
                )}
                freeSolo={false}
              />
            </div>
            {/* Campaign */}
            {(formData?.lastSource || "")
              .toLowerCase()
              .includes("facebook ads") && (
              <div className="col-12">
                <b>Campaign</b>
                <Autocomplete
                  value={String(formData?.campaing ?? "").trim()}
                  onChange={(event, newValue) =>
                    handleChange("campaing", String(newValue ?? "").trim())
                  }
                  options={leadCampaigns}
                  getOptionLabel={(option) => String(option ?? "")}
                  isOptionEqualToValue={(option, value) =>
                    String(option ?? "").trim() === String(value ?? "").trim()
                  }
                  size="small"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Campaign"
                      size="small"
                    />
                  )}
                  freeSolo={false}
                />
              </div>
            )}

            {/* Date Last Source */}
            <div className="d-flex flex-column">
              <b>Date Last Source</b>
              <div className="input-group input-group-sm mb-1">
                <input
                  type="date"
                  className="form-control"
                  value={formData?.dateLastSource || ""}
                  onChange={(e) =>
                    handleChange("dateLastSource", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/*Cuando es no */}
        {formData?.outcome &&
          (formData?.outcome === 111 || formData?.outcome === 112) &&
          context?.user?.role === "Broker" && (
            <>
              <div className="d-flex justify-content-center align-items-center border-top border-5 border-black mt-2">
                <b className="fs-5">ONLY ADMIN</b>
              </div>
              {/* No show reason */}
              <div className="col-12">
                <b>No show reason</b>
                <select
                  className={`form-select form-select-sm ${getClassEmpty(
                    "whyNoCita",
                  )} `}
                  aria-label="Lead type select"
                  value={formData?.whyNoCita}
                  onChange={(e) => handleChange("whyNoCita", e.target.value)}
                >
                  <option value="">EMPTY</option>
                  <option disabled>----------</option>
                  {byId(243).map((item, index) => (
                    <option key={index + 1} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              {/*Problemas Internos */}
              {formData?.whyNoCita === "Internal Problems" && (
                <div className="col-12">
                  <b>Internal Problems</b>
                  <select
                    className={`form-select form-select-sm ${getClassEmpty(
                      "problem",
                    )} `}
                    aria-label="Lead type select"
                    value={formData?.problem}
                    onChange={(e) => handleChange("problem", e.target.value)}
                  >
                    <option value="">EMPTY</option>
                    <option disabled>----------</option>
                    {byId(245).map((item, index) => (
                      <option key={index + 1} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {/*Problemas Externos */}
              {formData?.whyNoCita === "External Problems" && (
                <div className="col-12">
                  <b>External Problems</b>
                  <select
                    className={`form-select form-select-sm ${getClassEmpty(
                      "problem",
                    )} `}
                    aria-label="Lead type select"
                    value={formData?.problem}
                    onChange={(e) => handleChange("problem", e.target.value)}
                  >
                    <option value="">EMPTY</option>
                    <option disabled>----------</option>
                    {byId(244).map((item, index) => (
                      <option key={index + 1} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

        <div className="d-flex justify-content-center align-items-center mt-1 mb-1">
          <button
            className="btn btn-success"
            type="onSubmit"
            disabled={statusBtn}
          >
            <i className="bi bi-floppy me-1"></i>{" "}
            {statusBtn ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
