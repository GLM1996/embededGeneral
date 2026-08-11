import React, { useState, useEffect } from 'react'
import { CustomFieldsAccordion1, CustomFieldsCita } from "../../config/CustomFields";
import { getChoicesCustomFields, searchStages, searchAppointmentOutcomeFUB, searchAppointmentTypeOutcomeFUB } from '../../config/funciones';
import { TextField, Autocomplete } from "@mui/material";
import { useAppContext } from '../../context/AppContext';
import Loading from '../Loading';
import { Time } from '../../config/Select';
import { servidor_n8n } from '../../config/utils';

export default function FormCita({ appt, handleBack }) {

    const [loading, setLoading] = useState(false);
    const { person, context, dataCampaingSheet } = useAppContext()
    const [formData, setFormData] = useState({})
    const [choices, setChoices] = useState([])
    const [stages, setStages] = useState([])
    const [outcomeFub, setOutcomeFUB] = useState([])
    const [typeOutcomeFUB, setTypeOutcomeFUB] = useState([])
    const [stagesFiltered, setStagesFiltered] = useState([]);
    //Custom Fields
    const [citaChoices, setCitaChoices] = useState([]);
    const [actionsChoices, setActionsChoices] = useState([]);
    const [qualifyOrSignChoices, setQualifyOrSignChoices] = useState([]);
    const [problemChoices, setProblemChoices] = useState([]);
    const [externalProblemsChoices, setExternalProblemsChoices] = useState([]);
    const [internalProblemsChoices, setInternalProblemsChoices] = useState([]);
    const [quitChoices, setQuitChoices] = useState([]);
    const [quitReasonChoices, setQuitReasonChoices] = useState([]);
    const [quitReasonSpecificChoices, setQuitReasonSpecificChoices] = useState([]);
    const [quitReasonSpecificFilter, setQuitReasonSpecificFilter] = useState([]);
    const [reasonOther, setReasonOther] = useState(false);
    const [appointmentDb, setAppointmentDB] = useState();
    const [statusBtn, setStatusBtn] = useState(false);
    const [needFollowUp, setNeedFollowUp] = useState(false)
    const [finishChoices, setFinishChoices] = useState(false)

    
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            try {
                const [data, dataCita, responseStages, outcomes, typeOutcome] =
                    await Promise.all([
                        getChoicesCustomFields(CustomFieldsAccordion1),
                        getChoicesCustomFields(CustomFieldsCita),
                        searchStages(),
                        searchAppointmentOutcomeFUB(),
                        searchAppointmentTypeOutcomeFUB(),
                    ]);

                const claveHandlers = {
                    cita: setCitaChoices,
                    actions: setActionsChoices,
                    problem: setProblemChoices,
                    externalProblems: setExternalProblemsChoices,
                    internalProblems: setInternalProblemsChoices,
                    qualifySign: setQualifyOrSignChoices,
                    whyIsOut: setQuitChoices,
                    whyIsOutReason: (choices) => {
                        const filtered = choices.filter((item) =>
                            item.toLowerCase().includes(person?.customNEWLeadType?.toLowerCase()) || (person?.customNEWLeadType?.toLowerCase() === "buyer & seller" && !item.toLowerCase().includes('refi'))
                        );
                        setQuitReasonChoices(filtered);
                    },
                    whyIsOutReasonSpecific: setQuitReasonSpecificChoices,
                };

                dataCita.data.forEach((item) => {
                    const handler = claveHandlers[item.clave];
                    if (handler) {
                        handler(item.choices);
                    }
                });

                if (outcomes?.success) {
                    const filterOutcomes = outcomes.data.filter((item) =>
                        item.name.includes("BETA")
                    );
                    setOutcomeFUB(filterOutcomes);
                }

                if (typeOutcome?.success) {
                    setTypeOutcomeFUB(typeOutcome.data);
                }

                setChoices(data.data); // <-- Este parece un typo, ¿debería ser setChoices?

                const filterStages = responseStages.stages.filter((item) =>
                    item.name.includes("*")
                );
                const lead = responseStages.stages.find((item) => item.name === "Lead");
                const trash = responseStages.stages.find((item) => item.name === "Trash");

                if (lead) filterStages.push(lead);
                if (trash) filterStages.push(trash);

                setStages(filterStages);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
                setFinishChoices(true)
            }
        };

        fetchData();
    }, []);


    if (loading || !finishChoices) {
        return <Loading text="Loading ..." />;
    }

    const handleChange = (clave, valor) => {
        const updated = { ...formData, [clave]: valor };

        if (clave === "typeOutcome") {
            const findItem = typeOutcomeFUB.find((item) => item.id === Number(valor));
            updated.typeOutcomeName = findItem.name || "";
        }

        if (clave === "outcome") {
            const findItem = outcomeFub.find((item) => item.id === Number(valor));
            updated.typeOutcomeName = findItem?.name || "";

            if (findItem?.name.includes("Quit")) {
                updated.pipeline = "4- Post-Appt Follow-Up";
                filtrarStages("4- Post-Appt Follow-Up")
                updated.stage = "4- DECIDED TO QUIT CLIENT CAN & DON'T WANT *";
                updated.whenIsOut = new Date().toISOString().split('T')[0]
                //handlePipeline("4- Appt Outcome")
            } else {
                if (findItem?.name.includes('+ 3 Months')) {
                    updated.pipeline = "4- Post-Appt Follow-Up";
                    filtrarStages("4- Post-Appt Follow-Up")
                    updated.stage = "4- APPT CALL 30 DAYS ACTION + 3 MONTHS *";
                    //updated.whenIsOut = new Date().toISOString().split('T')[0]
                } else {
                    if (findItem?.name.includes('Close')) {
                        updated.pipeline = "5- VA Follow-Up with Realtor";
                        filtrarStages("5- VA Follow-Up with Realtor")
                        updated.stage = "5- CLOSED *";
                        //updated.whenIsOut = new Date().toISOString().split('T')[0]
                    } else {
                        if (findItem?.name.includes('BETA -6-')) {
                            updated.pipeline = "4- Post-Appt Follow-Up";
                            filtrarStages("4- Post-Appt Follow-Up")
                            updated.stage = "4- APPT CALL WITH DATE ACTIONS - 3 MONTHS *";
                            updated.cita = "Appt NOT Attended"
                            //updated.whenIsOut = new Date().toISOString().split('T')[0]
                        }
                    }
                }
            }
        }

        if (clave === "stage") {
            if (valor.includes("QUIT")) {
                updated.outcome = 101
            } else {
                if (valor.includes("+ 3 MONTHS")) {
                    updated.outcome = 104
                } else {
                    if (valor.includes("CLOSED")) {
                        updated.outcome = 102
                    }
                }
            }
            updated.whenIsOut = new Date().toISOString().split('T')[0]
        }

        if (clave === "cita") {
            if (valor.includes("Appt NOT Attended")) {
                updated.outcome = 105
                updated.pipeline = "4- Post-Appt Follow-Up";
                filtrarStages("4- Post-Appt Follow-Up")
                updated.stage = "4- APPT CALL WITH DATE ACTIONS - 3 MONTHS *";
            }

        }
        setFormData(updated); // actualiza el estado local del hijo
        //handleFormData(1, updated);      // notifica al padre con los datos actualizados
    };
    //SE ENCARGA DE FILTRAR LOS STAGES SEGUN EL PIPELINE SELECCIONADO
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
    //SE ENCARGA DE CABIAR EL PIPELINE Y DE LLAMAR A FILTRAR LOS STAGES
    const handlePipeline = (valor) => {
        handleChange("pipeline", valor);
        filtrarStages(valor);
    };
    //SE ENCARGA DE FILTRAR LAS RAZONES
    const filtrarWhyIsOutReason = (reason) => {
        console.log(reason)
        if (!reason.includes("OTHER")) {
            const coincidencia = reason.split("-")[0];
            console.log(coincidencia)
            setQuitReasonSpecificFilter(
                quitReasonSpecificChoices.filter(
                    (item) =>
                        item.includes(coincidencia + "-") &&
                        (item.toLowerCase().includes(personFilter?.leadType.toLowerCase()) || (personFilter?.leadType?.toLowerCase() === "buyer & seller" && !item.toLowerCase().includes('refi')))
                )
            );
            setReasonOther(false);
        } else {
            setQuitReasonSpecificFilter([]);
            setReasonOther(true);
        }
        if (reason.includes("OTHER")) {
            setReasonOther(true);
        }
    };

    //CAMBIA WHY IS OUT RESON Y DE LLAMAR FILTRAR LAS RAZONES
    const handleWhyIsOutReason = (valor) => {
        handleChange("whyIsOutReason", valor);
        filtrarWhyIsOutReason(valor);
    };
    //SE ENCARGA DE DAR ESTILO CUANDO EL VALOR ES VACIO
    const getClassEmpty = (clave) => {
        if (formData[clave] === "" || !formData[clave]) {
            return "border-danger-suave";
        }
    };

    if (loading || !finishChoices) {
        return <Loading text="Loading Choices" />;
    }
    //FUNCCION PRINCIPAL QUE SE ENCARGA DE TODAS LAS AUTOMATIZACIONES
    const handleSave = async () => {
        setStatusBtn(true)
        try {
            if (formData?.cita === "Appt Canceled") {
                const urlNew = `${servidor_n8n}/webhook/5d822c56-1a7c-4ba5-bc6e-c5029cf0097b`

                try {
                    const dataN8n = {
                        apptId: appointment.id
                    }
                    const options = {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            // "Authorization": `Bearer ${token}`, // Descomenta si necesitas autenticación
                        },
                        //Eddie-Morales-Phone
                        body: JSON.stringify(dataN8n),
                    };
                    await fetch(urlNew, options)
                } catch (error) {
                    console.log(error)
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

            const errors = results.filter(result => result.status === "rejected");

            if (errors.length > 0) {
                const errorMessages = errors
                    .map((err, i) => `${i + 1}. ${err.reason?.message || "Error desconocido"}`)
                    .join('\n');

                console.error("Algunas operaciones fallaron:\n", errorMessages);

                toast.error(`Se completó con ${errors.length} errores:\n${errorMessages}`, {
                    position: "top-right",
                    autoClose: 5000,
                });
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

            toast.error("Ocurrió un error inesperado", {
                position: "top-right",
                autoClose: 2000,
            });

        } finally {
            setStatusBtn(false)
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
            dataSaved.pipeline = formData?.pipeline
        }

        if (formData?.stage?.toLowerCase().includes("4- decided to quit")) {
            dataSaved.whyIsOut = formData?.whyIsOut || "";
            dataSaved.whenIsOut = new Date(formData?.whenIsOut || "")
            dataSaved.whyIsOutReason = formData?.whyIsOutReason || "";
            dataSaved.whyIsOutReasonSpecific =
                formData?.whyIsOutReason?.toLowerCase().includes("other") ||
                    formData?.whyIsOutReasonSpecific?.toLowerCase().includes("other")
                    ? formData?.reasonOther || ""
                    : formData?.whyIsOutReasonSpecific || "";

            const text = `<b style="color: red">${formData?.note}</b>`
            await createStageChangeNote('DECIDED QUIT NOTE', text);

        }

        const response = await saveAppointmentMongoCaptacionV2(dataSaved);
        if (response.success) {
            toast.success(`BD ${response.operation} Captacion`, {
                position: "top-right",
                autoClose: 2000,
            });
        } else { throw new Error("Save APPT DB FAIL"); }
    };
    //ACTUALIZA LA BASE DE DATOS EN MONGO DB (CITAS)
    const updateMongoDBCitas = async () => {
        if (new Date(appointment.created) < new Date("2023-02-16")) {
            return
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
                formData?.typeOutcomeName || appointment.outcome || "",
            appointmentStart: appointment?.start || "",
            realtorOrLender: appointmentDb?.realtorLender || "",
            realtorOrLenderName: appointmentDb?.realtorLenderValue || "",
            attendance: formData.cita,
            typeProblems: formData.whyNoCita,
            problem: formData.problem,
            results: formData?.actions || "",
            pending: formData?.pendiente || "",
            datePending: formData?.datePending
                ? ajustarFecha(formData?.datePending, formData?.dateTime)
                : "",
            lastSource: formData?.lastSource || "",
            campaing: formData?.campaing || ""
        };

        const response = await saveAppointmentMongoDatosClienteV2(dataSavedCliente);
        if (response.success) {
            toast.success(`BD ${response.operation} Cita`, {
                position: "top-right",
                autoClose: 2000,
            });
        } else { throw new Error("Save APPT DB FAIL"); }
    };
    //ACTUALIZA LA HOJA DE CITAS  DE A SHEET 
    const updateGoogleSheets = async () => {
        console.log(formData?.outcome)
        if (new Date(appointment.created) < new Date("2023-02-16")) {
            return
        }
        const userName = appointment.invitees.find(
            (item) => item.userId === appointment.createdById
        )?.name;
        //const userName = appointment.invitees.find((item) => item.userId !== null)?.name;
        const values = [
            formatearFecha(new Date(person.created)), // Creación del cliente
            formatearFecha(new Date()), // Actualizacion del cliente
            person.name, // Name del cliente
            `https://homelasvegasnevada.followupboss.com/2/people/view/${person.id}`, // Link del cliente
            context?.user?.name || "", //Quien lo actualizo
            userName || person?.assignedTo || context?.user?.name || "", // VA del cliente      
            formData?.stage || person.stage || "", // Stage
            appointment.typeId || "", // Type Id
            appointment.type || "", // Type
            ...getRealtorLenderValues(),
            formatearFecha(new Date(appointment.created)), // Appt Created
            formatearFecha(new Date(appointment.start)), // Appt Met
            formData?.outcome === 103 ? 0 : 1, // Contador Citas Siempre es 1
            getAttendanceCount(), // Cliente que fueron a cita
            "", // Empty field
            getNotAttendanceCount(), // Cliente que no fueron a cita
            "", // Empty field
            formData.cita, // Attendance
            ...getAdditionalValuesBasedOnAttendance(),
        ];

        if (formData?.stage?.toLowerCase().includes("4- decided to quit")) {
            values.push(
                formData?.whyIsOut || "",
                formData?.whyIsOutReason || "",
                formData.whyIsOutReasonSpecific =
                formData?.whyIsOutReason?.toLowerCase().includes("other") ||
                    formData?.whyIsOutReasonSpecific?.toLowerCase().includes("other")
                    ? formData?.reasonOther || ""
                    : formData?.whyIsOutReasonSpecific || "",
                formatearFecha(new Date()),
                ...Array(2).fill("")
            );
        } else {
            values.push(...Array(7).fill(""));
        }

        values.push(appointmentDb?.whereAppt);
        values.push(appointmentDb?.typeAppt);
        values.push(...Array(7).fill(""));
        values.push(formData?.lastSource || "");
        values.push(formData?.lastSource?.includes("Facebook") ? formData?.campaing : "");

        const data = {
            id1: Number(context.person.id),
            id2: Number(appointment?.id),
            mode: "2IDs",
            values,
        };

        const put_appointment = await saveAppointment(data);

        if (formData?.stage !== person.stage) {
            const valuesCaptacion = [];
            for (let i = 0; i < 10; i++) {
                valuesCaptacion.push("")
            }
            valuesCaptacion.push(formData?.pipeline);
            valuesCaptacion.push(formData?.stage);

            const dataCaptacion = {
                id: context.person.id,
                mode: "partialUpdate",
                values: valuesCaptacion,
            };

            const put_appointment_captacion = await saveAppointment(dataCaptacion);

            if (put_appointment_captacion.success) {
                toast.success("Sheet Actualizada Captacion", {
                    position: "top-right",
                    autoClose: 2000,
                });
            }
        }

        if (put_appointment.success) {
            toast.success("Sheet Actualizada", {
                position: "top-right",
                autoClose: 2000,
            });
        } else {
            throw new Error("Save APPT DB FAIL");
        }
    };
    //PREPARA DATOS PARA LA SHEET
    const getRealtorLenderValues = () => {
        if (appointmentDb?.realtorLender === "REALTOR") {
            return ["", appointmentDb?.realtorLenderValue];
        }
        return [appointmentDb?.realtorLenderValue, ""];
    };
    //PREPARA DATOS PARA LA SHEET
    const getAttendanceCount = () => {
        if (formData?.cita === "Appt Attended") return 1;
        if (formData?.cita === "Waiting for Appt date") return "Pendiente";
        return 0;
    };
    //PREPARA DATOS PARA LA SHEET
    const getNotAttendanceCount = () => {
        if (formData?.cita === "Appt NOT Attended") return 1;
        if (formData?.cita === "Appt Canceled") return 1;
        if (formData?.cita === "Waiting for Appt date") return "Pendiente";
        return 0;
    };
    //PREPARA DATOS PARA LA SHEET
    const getAdditionalValuesBasedOnAttendance = () => {
        const additionalValues = [];
        const outcome = formData.typeOutcomeName || appointment.outcome || "";
        const meetingWith = appointmentDb?.realtorLender;

        switch (formData.cita) {
            case "Waiting for Appt date":
                additionalValues.push(
                    ...Array(6).fill(""),
                    outcome,
                    meetingWith,
                    ...Array(2).fill("")
                );
                break;

            case "Appt Attended":
                additionalValues.push(
                    "",
                    "",
                    formData.actions, // Appt Result
                    formData.pendiente,
                    formatearFecha(new Date()),
                    formatearFecha(new Date(formData.datePending + "T06:00:00")) + ` ${formData.dateTime}`,
                    outcome,
                    meetingWith,
                    ...getApptAttendedAdditionalValues()
                );
                break;

            case "Appt NOT Attended":
                additionalValues.push(
                    ...getProblemValues(),
                    formData?.pendiente,
                    formatearFecha(new Date()),
                    formatearFecha(new Date(formData?.datePending + "T06:00:00")),
                    outcome,
                    meetingWith,
                    ...Array(2).fill("")
                );
                break;
            case "Appt Canceled":
                additionalValues.push(
                    ...getProblemValues(),
                    formData?.pendiente,
                    formatearFecha(new Date()),
                    formatearFecha(new Date(formData?.datePending + "T06:00:00")),
                    outcome,
                    meetingWith,
                    ...Array(2).fill("")
                );
                break;
        }

        return additionalValues;
    };
    //PREPARA DATOS PARA LA SHEET
    const getApptAttendedAdditionalValues = () => {
        switch (formData.actions) {
            case "Client Pending Action":
                return ["", ""];
            case "Client Didn´t Qualify":
                return [formatearFecha(new Date()), ""];
            case "Client Didn´t Sign":
                return ["", formatearFecha(new Date())];
            default:
                return ["", ""];
        }
    };
    //PREPARA DATOS PARA LA SHEET
    const getProblemValues = () => {
        if (formData.whyNoCita === "External Problems") {
            return [formData.problem, "", ""];
        }
        if (formData.whyNoCita === "Internal Problems") {
            return ["", formData.problem, ""];
        }
        return ["", "", ""];
    };
    //ACTUALIZA FOLLOW UP BOSS DE SER NECESARIO
    const updateFollowUpBossIfNeeded = async () => {

        //if (!shouldUpdateFollowUpBoss()) return;

        let dataJson = {
            personId: context.person.id,
            customVAApptFollow: formData?.datePending || "",
            customVALastLeadSource: formData?.lastSource || "",
            customVACampaing: formData?.campaing || ""
        }
        if (lastCita?.id === appointment?.id) {
            dataJson.stage = formData?.stage,
                dataJson.customVALASTAPPTATTENDANCE = formData?.cita || "",
                dataJson.customVALASTAPPTRESULTS = formData?.actions || ""
        }

        if (formData?.pendiente?.trim() && needFollowUp) {
            const fechaFormated = formatearFecha(new Date());
            dataJson.background = `${context.user.name
                } -- ${fechaFormated}\n APPT PENDING ACTION DATE: ${formatearFecha(
                    new Date(formData?.datePending + "T16:00:00")
                )}\n Description: ${formData?.pendiente} \n\n ${person.background}`;
            await createPendingTask();
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
        if ((context.person.stage.name !== formData?.stage) && (lastCita?.id === appointment?.id)) {
            const text = `<b>${context.user.name}</b> changed the Stage from <b style="color: red">${context.person.stage.name}</b> to <b style="color: green">${formData?.stage}</b>`
            await createStageChangeNote('STAGE UPDATED', text);
        }
    };

    const shouldUpdateFollowUpBoss = () => {
        return (
            (formData?.stage !== context.person.stage.name && formData?.stage) ||
            formData?.pendiente?.trim() || (person.customVAApptFollow !== formData?.datePending && formData?.datePending)
        );
    };
    //CREA TASK AUTOMATICO
    const createPendingTask = async () => {

        const fechaAjustada = ajustarFecha(formData?.datePending, formData?.dateTime)

        const dataTask = {
            personId: Number(context.person.id),
            assignedUserId: Number(person.assignedUserId),
            name: formData?.pendiente,
            type: "Follow Up",
            dueDateTime: fechaAjustada,
        };

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
    //FILTRA LAS CAMPAñAS
    const buyers = dataCampaingSheet.FACEBOOK_ADS.map((buyer, i) => ({
        buyer,
        activo: dataCampaingSheet.ACTIVO[i] // SI o NO
    }));

    // Opcional: ordenamos primero los "SI" y luego los "NO"
    const sortedBuyers = buyers.sort((a, b) => {
        if (a.activo === "SI" && b.activo === "NO") return -1;
        if (a.activo === "NO" && b.activo === "SI") return 1;
        return 0;
    });

    const sortedBuyersClean = sortedBuyers.map(item => item.buyer)

    return (
        <div className='row w-100 m-auto'>
            <div className='d-flex justify-content-center align-items-center'>
                <button className='btn btn-success' onClick={handleBack}><i className='bi bi-arrow-left me-1'></i>Back</button>
            </div>
            {/* Appoitment Outcome */}
            <div className="col-12 fade-in">
                <b>Outcome (Appt Cycle)</b>
                <select
                    className={`form-select form-select-sm ${getClassEmpty(
                        "outcome"
                    )} `}
                    aria-label="Lead type select"
                    value={formData?.outcome || ""}
                    onChange={(e) => handleChange("outcome", e.target.value)}
                >
                    <option value="">EMPTY</option>
                    <option disabled>----------</option>
                    {outcomeFub.map((item, index) => (
                        <option key={index + 1} value={item.id}>
                            {item.name}
                        </option>
                    ))}
                </select>
            </div>
            {/* Pipelines */}
            {formData?.outcome && (
                <div className="col-12 fade-in">
                    <b>Pipelines</b>
                    <select
                        className={`form-select form-select-sm ${getClassEmpty(
                            "pipeline"
                        )} `}
                        aria-label="Pipelines select"
                        value={formData?.pipeline || ""}
                        onChange={(e) => handlePipeline(e.target.value)}
                    >
                        <option value="">EMPTY</option>
                        <option disabled>----------</option>
                        {choices[1].choices.map((option, index) => (
                            index !== 0 && (
                                <option key={index} value={option}>
                                    {option}
                                </option>
                            )
                        ))}
                    </select>
                </div>
            )}
            {/* Stages */}
            {formData?.pipeline && (
                <div className="col-12 fade-in">
                    <b>Stages</b>
                    <select
                        className={`form-select form-select-sm ${getClassEmpty(
                            "stage"
                        )} `}
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
            )}
            {/* Appt Attendance */}
            {formData?.stage && (
                <div className="col-12 fade-in">
                    <b>Appt Attendance</b>
                    <select
                        className={`form-select form-select-sm ${getClassEmpty("cita")} `}
                        aria-label="Lead type select"
                        value={formData?.cita || ""}
                        onChange={(e) => handleChange("cita", e.target.value)}
                    >
                        <option value="">EMPTY</option>
                        <option disabled>----------</option>
                        {citaChoices.map((item, index) => (
                            <option key={index + 1} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </div>
            )}
            {/*Cuando es si */}
            {formData?.cita && formData?.cita === "Appt Attended" && (
                <>
                    {/* Appt Result */}
                    <div className="col-12 fade-in">
                        <b>Appt Result</b>
                        <select
                            className={`form-select form-select-sm ${getClassEmpty(
                                "actions"
                            )} `}
                            aria-label="Lead type select"
                            value={formData?.actions}
                            onChange={(e) => handleChange("actions", e.target.value)}
                        >
                            <option value="">EMPTY</option>
                            <option disabled>----------</option>
                            {actionsChoices.map((item, index) => (
                                <option key={index + 1} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>

                    {formData?.actions === "Didn´t qualify// Didn´t sign" && (
                        <div className="col-12 ">
                            <b>Result Details?</b>
                            <select
                                className={`form-select form-select-sm ${getClassEmpty(
                                    "requisitos"
                                )} `}
                                aria-label="Lead type select"
                                value={formData?.requisitos}
                                onChange={(e) => handleChange("requisitos", e.target.value)}
                            >
                                <option value="">EMPTY</option>
                                <option disabled>----------</option>
                                <option value="Decided to Quit">Decided to Quit</option>
                                <option value="Didn´t qualify">Didn´t qualify</option>
                            </select>

                            {/*Cambios en los no continuar */}
                            {formData?.requisitos === "Decided to Quit" && (
                                <div className="input-group input-group-sm mt-2">
                                    <textarea
                                        type="text"
                                        className={`form-control ${getClassEmpty(
                                            "whyNoContinue"
                                        )} `}
                                        placeholder="Why?"
                                        value={formData?.whyNoContinue}
                                        onChange={(e) =>
                                            handleChange("whyNoContinue", e.target.value)
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/*Cosas Pendientes Por realtor ...*/}
            {formData?.cita && (
                <div className="col-12 fade-in border border-black border-2 my-1 rounded-2 fade-in">
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
                                onChange={(e) => handleChange("datePending", e.target.value)}
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
            )}
            {/* Attemps */}
            <div className="col-12 mb-1 fade-in">
                <b>Attemps</b>
                <select
                    className="form-select form-select-sm"
                    aria-label="Lead type select"
                    value={formData?.attemps || ""}
                    onChange={(e) => handleForm("attemps", e.target.value)}
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
            {/* Cuando es 4- DECIDED TO QUIT */}
            {formData?.stage?.toLowerCase().includes("4- decided to quit") && (
                <>
                    <div className="col-12">
                        <b>Decided to quit Note</b>
                        <div className="input-group input-group-sm mb-1">
                            <textarea
                                type="text"
                                className={`form-control ${getClassEmpty("note")} `}
                                placeholder="note"
                                value={formData?.note || ""}
                                onChange={(e) => handleChange("note", e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-12">
                        <b>Client Quit Moment</b>
                        <select
                            className={`form-select form-select-sm ${getClassEmpty(
                                "whyIsOut"
                            )} `}
                            aria-label="Lead type select"
                            value={formData?.whyIsOut || ""}
                            onChange={(e) => handleChange("whyIsOut", e.target.value)}
                        >
                            <option value="">EMPTY</option>
                            <option disabled>----------</option>
                            {quitChoices.map((option, index) => (
                                <option key={index} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-12">
                        <b>CLIENT QUIT REASONS</b>
                        <select
                            className={`form-select form-select-sm ${getClassEmpty(
                                "whyIsOutReason"
                            )} `}
                            aria-label="Lead type select"
                            value={formData?.whyIsOutReason || ""}
                            onChange={(e) => handleWhyIsOutReason(e.target.value)}
                        >
                            <option value="">EMPTY</option>
                            <option disabled>----------</option>
                            {quitReasonChoices.map((option, index) => (
                                <option key={index} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-12">
                        <b>CLIENT QUIT DATE</b>
                        <input
                            className={`form-control form-control-sm ${getClassEmpty(
                                "whenIsOut"
                            )} `}
                            type="date"
                            value={formData?.whenIsOut || ""}
                            onChange={(e) => handleChange("whenIsOut", e.target.value)}
                        >
                        </input>
                    </div>
                    <div className="col-12">
                        <b>CLIENT QUIT REASONS SPECIFIC</b>
                        {!formData?.whyIsOutReason?.includes("OTHER") && (
                            <select
                                className={`form-select form-select-sm ${getClassEmpty(
                                    "whyIsOutReasonSpecific"
                                )} `}
                                aria-label="Lead type select"
                                value={formData?.whyIsOutReasonSpecific || ""}
                                onChange={(e) =>
                                    handleChange("whyIsOutReasonSpecific", e.target.value)
                                }
                            >
                                <option value="">EMPTY</option>
                                <option disabled>----------</option>
                                {quitReasonSpecificFilter.map((option, index) => (
                                    <option key={index} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    {(formData?.whyIsOutReason?.toLowerCase().includes("other") ||
                        formData?.whyIsOutReasonSpecific
                            ?.toLowerCase()
                            .includes("other")) && (
                            <div className="input-group input-group-sm my-1">
                                <textarea
                                    type="text"
                                    className={`form-control ${getClassEmpty("reasonOther")} `}
                                    placeholder="other reason"
                                    value={formData?.reasonOther}
                                    onChange={(e) => handleChange("reasonOther", e.target.value)}
                                />
                            </div>
                        )}
                </>
            )}

            {/*LAST SOURCE */
                <div className="col-12" hidden>
                    <b>Last Lead Source</b>
                    <Autocomplete
                        value={formData?.lastSource || ""}
                        onChange={(event, newValue) => handleChange("lastSource", newValue)}
                        options={dataCampaingSheet.LAST_LEAD_SOURCE}
                        size="small" // tamaño del Autocomplete            
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Last Source"
                                size="small" // tamaño del input
                                name="Last Source"
                            />
                        )}
                        freeSolo={false} // si quieres permitir valores no listados pon true
                    />
                </div>
            }
            {/* Campaing */}
            {formData?.lastSource?.includes("Facebook Ads") && (
                <div className="col-12 fade-in">
                    <b>Campaing</b>
                    <Autocomplete
                        value={formData?.campaing || ""}
                        className="my-autocomplete"
                        onChange={(event, newValue) => handleChange("campaing", newValue)}
                        options={sortedBuyersClean}
                        getOptionLabel={(option) => option || ""} // cómo mostrar el texto
                        renderInput={(params) => (
                            <TextField {...params} placeholder="Campain" size="small" />
                        )}
                        renderOption={(props, option, { index }) => {
                            const fullData = sortedBuyers.find(item => item.buyer === option);
                            return (
                                <li
                                    {...props}
                                    key={option + '_' + index}
                                    style={{ color: fullData?.activo === "SI" ? "green" : "red" }}
                                >
                                    {option}
                                </li>
                            );
                        }}
                    />
                </div>
            )}
            {/*Cuando es no */}
            {formData?.cita && (formData?.cita?.trim() === "Appt NOT Attended" || formData?.cita === "Appt Canceled") && (
                <>
                    <div className="d-flex justify-content-center align-items-center border-top border-5 border-black mt-2">
                        <b className="fs-5">ONLY ADMIN</b>
                    </div>
                    {/* No show reason */}
                    <div className="col-12">
                        <b>No show reason</b>
                        <select
                            className={`form-select form-select-sm ${getClassEmpty(
                                "whyNoCita"
                            )} `}
                            aria-label="Lead type select"
                            value={formData?.whyNoCita}
                            onChange={(e) => handleChange("whyNoCita", e.target.value)}
                        >
                            <option value="">EMPTY</option>
                            <option disabled>----------</option>
                            {problemChoices.map((item, index) => (
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
                                    "problem"
                                )} `}
                                aria-label="Lead type select"
                                value={formData?.problem}
                                onChange={(e) => handleChange("problem", e.target.value)}
                            >
                                <option value="">EMPTY</option>
                                <option disabled>----------</option>
                                {internalProblemsChoices.map((item, index) => (
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
                                    "problem"
                                )} `}
                                aria-label="Lead type select"
                                value={formData?.problem}
                                onChange={(e) => handleChange("problem", e.target.value)}
                            >
                                <option value="">EMPTY</option>
                                <option disabled>----------</option>
                                {externalProblemsChoices.map((item, index) => (
                                    <option key={index + 1} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </>
            )}

            <div className='d-flex justify-content-center align-items-center my-1'>
                <button className='btn btn-success' onClick={handleSave}><i className='bi bi-floppy me-2'></i>Save</button>
            </div>
        </div>
    )
}
