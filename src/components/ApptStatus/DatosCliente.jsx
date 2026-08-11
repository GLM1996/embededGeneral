import React, { useEffect, useState } from 'react'
import { searchAppointmentFUB, putStage, postTask, updateAppointment, saveAppointment, searchPersonById, saveAppointmentMongoDatosCliente } from '../../config/funciones'
import { toast } from 'react-toastify'
import { ajustarFechaUtc, formatearFecha } from '../../config/utils'
import Loading from '../Loading'
import Alert from '../Alert'
import ListarApptStatus from './ListarApptStatus'
import { useAppContext } from '../../context/AppContext'

export default function DatosCliente({ personFilter }) {

    const [formDataAccordion1, setFormDataAccordion1] = useState({})
    const [formDataAccordion2, setFormDataAccordion2] = useState({})
    const [selectedAppointment, setSelectedAppointment] = useState()
    const [apptFub, setApptFub] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAlert, setShowAlert] = useState(false)
    const { person, context } = useAppContext()

    useEffect(() => {
        if (person.id) {
            const fetchData = async () => {

                try {
                    setLoading(true)
                    const appts = await searchAppointmentFUB(person.id)
                    if (appts?.success) setApptFub(appts.data);

                } catch (error) {
                    console.log(error)
                } finally {
                    setLoading(false)
                }
            }
            fetchData()
        }
    }, [person])

    const handleFormData = (accordion, data) => {
        switch (accordion) {
            case 1:
                setFormDataAccordion1(data)
                break;
            case 2:
                setFormDataAccordion2(data)
                break;

            default:
                break;
        }
    }
    const handleSelectAppt = (appt) => {
        setSelectedAppointment(appt)
    }

    const handleSave = async () => {
        setShowAlert(true)
        const dataSaved = { ...formDataAccordion1, ...formDataAccordion2 }

        console.log(formDataAccordion1)
        console.log(formDataAccordion2)
        console.log(selectedAppointment)
        //Actualiza El Appointment si se Cambia El Type o el Outcome
        // if (Number(selectedAppointment?.typeId) !== Number(formDataAccordion1.typeOutcome) || Number(selectedAppointment.outcomeId) !== Number(formDataAccordion1.outcome)) {
        //     //Actualiza el appointment dentro de Follow Up Boss
        //     try {
        //         selectedAppointment.newType = formDataAccordion1.typeOutcome !== null ? Number(formDataAccordion1.typeOutcome) : null
        //         selectedAppointment.newOutcome = formDataAccordion1.outcome !== null ? Number(formDataAccordion1.outcome) : null

        //         const put_appointment = await updateAppointment(selectedAppointment);
        //         if (put_appointment.success) {
        //             console.log(put_appointment);
        //             toast.success("Appt actualizado", {
        //                 position: "top-right",
        //                 autoClose: 2000,
        //             });
        //         }
        //     } catch (error) {
        //         console.log(error);
        //     }
        // }

        // //Actualiza Cliente en Google Sheet
        // try {
        //     console.log(formDataAccordion1)
        //     const values = []
        //     const data = {}

        //     values.push(person.name)
        //     values.push(`https://homelasvegasnevada.followupboss.com/2/people/view/${person.id}`)
        //     values.push(context.user.name)
        //     values.push(person.stage)
        //     values.push(formDataAccordion1.typeOutcome)
        //     values.push(formDataAccordion1.typeOutcomeName || selectedAppointment.type || "" || "")

        //     if (formDataAccordion1.realtorLender === "Realtor") {
        //         values.push("")
        //         values.push(formDataAccordion1.realtorLenderValue)
        //     } else {
        //         values.push(formDataAccordion1.realtorLenderValue)
        //         values.push("")
        //     }
        //     values.push(ajustarFechaUtc(selectedAppointment.created))

        //     //Contadores
        //     values.push("")
        //     values.push("")

        //     values.push(ajustarFechaUtc(selectedAppointment.start))

        //     //Contadores
        //     values.push("")
        //     values.push("")

        //     values.push(formDataAccordion2.cita)

        //     switch (formDataAccordion2.cita) {
        //         case "Waiting for Appt date":
        //             for (let i = 0; i < 6; i++) {
        //                 values.push("")
        //             }
        //             values.push(formDataAccordion1.outcomeName || selectedAppointment.outcome || "")
        //             values.push(formDataAccordion1.realtorLender)
        //             values.push("")
        //             values.push("")
        //             break;
        //         case "Appt Attended":
        //             values.push("")
        //             values.push("")
        //             values.push(formDataAccordion2.actions)

        //             if (formDataAccordion2.actions === "Client Pending Action") {
        //                 values.push(formDataAccordion2.pendiente)
        //                 values.push(formDataAccordion2.datePending)
        //                 values.push(new Date().toISOString().slice(0, 10))
        //                 values.push(formDataAccordion1.outcomeName || selectedAppointment.outcome || "")
        //                 values.push(formDataAccordion1.realtorLender)
        //                 values.push("")
        //                 values.push("")
        //             }
        //             else {
        //                 for (let i = 0; i < 3; i++) {
        //                     values.push("")
        //                 }
        //                 values.push(formDataAccordion1.outcomeName || selectedAppointment.outcome || "")
        //                 values.push(formDataAccordion1.realtorLender)
        //                 values.push("")
        //                 values.push("")
        //             }


        //             break;

        //         default:
        //             break;
        //     }

        //     /*if (formDataAccordion2.cita === 'Appt Attended') {
        //         values.push(formDataAccordion2.actions)
        //         switch (formDataAccordion2?.actions) {
        //             case "Qualify//Sign":
        //                 values.push(formDataAccordion2?.calificaFirma)
        //                 break;
        //             case "Pending actions":
        //                 values.push("")
        //                 values.push(formDataAccordion2?.pendiente)
        //                 values.push(formDataAccordion2?.datePending)
        //                 break;
        //             case "Didn´t qualify// Didn´t sign":
        //                 values.push("")
        //                 values.push("")
        //                 values.push("")
        //                 values.push(formDataAccordion2?.requisitos)
        //                 if (formDataAccordion2?.requisitos === "Decided to Quit") {
        //                     values.push(formDataAccordion2?.whyNoContinue)
        //                     values.push(new Date().toISOString().split('T')[0])
        //                 } else {
        //                     values.push("")
        //                     values.push("")
        //                 }

        //                 break;

        //             default:
        //                 break;
        //         }
        //     } else {
        //         if (formDataAccordion2.cita === 'Appt NOT Attended') {
        //             for (let i = 0; i < 7; i++)
        //                 values.push("")
        //             values.push(formDataAccordion2.whyNoCita)
        //             values.push(formDataAccordion2.problem)
        //         }
        //     }*/

        //     data.id1 = context.person.id
        //     data.id2 = selectedAppointment?.id
        //     data.mode = '2IDs'
        //     data.values = values

        //     const put_appointment = await saveAppointment(data);

        //     if (put_appointment.success) {
        //         toast.success("Sheet Actualizada", {
        //             position: "top-right",
        //             autoClose: 2000,
        //         });
        //     }
        // } catch (error) {
        //     console.log(error);
        // }
        // //Actualiza Cliente en Mongo DB
        // try {
        //     const response = await saveAppointmentMongoDatosCliente(dataSaved, context, selectedAppointment)
        //     if (response.success) {
        //         toast.success(`BD ${response.operation}`, {
        //             position: "top-right",
        //             autoClose: 2000,
        //         });
        //     }
        //     console.log(response)
        // } catch (error) {
        //     console.log(error);
        // }

        // //Si hay action pendiente
        // const fechaFormated = formatearFecha(new Date())
        // //Tue May 13 2025 14:45:21 GMT-0400 (hora de verano de Cuba)
        // if (dataSaved?.pendiente && dataSaved.pendiente !== "" && dataSaved.actions === "Client Pending Action") {
        //     const dataJson = {
        //         personId: context.person.id,
        //         background: `${context.user.name} -- ${fechaFormated}\n APPT PENDING ACTION FOLLOW UP: ${dataSaved.datePending}\n Description: ${dataSaved.pendiente} \n\n ${person.background}`,
        //     }
        //     //Actualiza Lista de Task
        //     const dataTask = {
        //         personId: Number(context.person.id),
        //         assignedUserId: Number(context.user.id),
        //         name: dataSaved.pendiente,
        //         type: "Follow Up",
        //         dueDateTime: dataSaved.datePending + 'T16:00:00'

        //     }
        //     try {
        //         const put_stage = await postTask(dataTask);
        //         if (put_stage.success) {
        //             toast.success("Task Creada actualizada", {
        //                 position: "top-right",
        //                 autoClose: 2000,
        //             });
        //         }
        //     } catch (error) {
        //         console.log(error);
        //     }
        //     //Actualiza Cliente en Follow Up Boss  
        //     try {
        //         const put_stage = await putStage(dataJson);
        //         if (put_stage.success) {
        //             toast.success("People actualizada", {
        //                 position: "top-right",
        //                 autoClose: 2000,
        //             });
        //         }
        //     } catch (error) {
        //         console.log(error);
        //     }

        // }
        // Método 1: Recarga simple (mantiene la caché)
       // window.location.reload();

        // Método 2: Recarga forzada (ignora la caché)
        //window.location.reload(true);
    }

    if (loading) {
        return (
            <Loading text={'Loading data'} />
        )
    }
    if (!personFilter && !loading) {
        return (
            <div className='d-flex justify-content-center bg-warning'>
                <h6 className='my-5'>⛔ FILL DATA ENTRY FIRST ⛔</h6>
            </div>
        )
    }

    if (apptFub.length === 0 && !loading) {
        return (
            <div className='d-flex justify-content-center bg-warning'>
                <h6 className='my-5'>⛔ FILL APPT FIRST ⛔</h6>
            </div>
        )
    }
    return (
        <div className='px-1 py-0'>

            <ListarApptStatus context={context} handleFormData={handleFormData} person={person} personFilter={personFilter} />
            {/* Alerta que sale despues de salvar */}
            {showAlert && (
                <Alert
                    type="warning"
                    onClose={() => setShowAlert(false)}
                    duration={3000}
                />
            )}
        </div>
    )
}
