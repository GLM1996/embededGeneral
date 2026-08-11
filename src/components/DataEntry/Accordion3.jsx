import React, { useState, useEffect } from 'react'
import { searchAppointmentFUB, searchAppointmentOutcomeFUB, searchAppointmentTypeOutcomeFUB, getChoicesCustomFields } from '../../config/funciones'
import Loading from '../Loading'

export default function Accordion3({ handleFormData, context, appointments, handleSelectAppt, person }) {

    const [loading, setLoading] = useState(false)
    const [finishChoices, setFinishChoices] = useState(true)
    const [formData, setFormData] = useState({})
    const [apptFub, setApptFub] = useState(appointments)
    const [typeOutcomeFUB, setTypeOutcomeFUB] = useState([])
    const [outcomeFUB, setOutcomeFUB] = useState([])

    const [dataRealtorLender, setDataRealtorLender] = useState([]);

    useEffect(() => {
        if (context?.user?.id) {
            const fetchAppointmentData = async () => {
                setLoading(true)
                setFinishChoices(false)
                if (!context?.person) return;

                try {
                    const [outcomes, typeOutcome] = await Promise.all([
                        //searchAppointmentFUB(context.person.id),
                        searchAppointmentOutcomeFUB(),
                        searchAppointmentTypeOutcomeFUB(),
                    ]);


                    if (outcomes?.success) {
                        const filterOutcomes = outcomes.data.filter((item) => item.name.includes('BETA'))
                        setOutcomeFUB(filterOutcomes);
                    }
                    if (typeOutcome?.success) setTypeOutcomeFUB(typeOutcome.data);
                } catch (err) {
                    console.log(err)
                } finally {
                    setLoading(false)
                    setFinishChoices(true)
                }
            };
            fetchAppointmentData();
        }
    }, [context?.user?.id, context?.person]);

    useEffect(() => {
        if (person && apptFub.length > 0 && finishChoices) {

            const lastCita = person.citas[person.citas.length - 1]
            const apptId = apptFub.find(
                (item) => item.id === Number(lastCita?.appointmentId)
            )
            if (apptId) {
                handleSelectAppt(apptId)
                const updated = {
                    appointment: lastCita?.appointmentId ?? "",
                    apptName: lastCita?.appointmentName,
                    typeOutcome: lastCita?.appointmentTypeId ?? "",
                    outcome: lastCita?.appointmentOutcomeId ?? "",
                    realtorLender: lastCita?.realtorOrLender ?? "",
                    realtorLenderValue: lastCita?.realtorOrLenderName ?? ""
                }
                setFormData(updated)
                handleFormData(1, updated)
            }
        }
    }, [person, apptFub, finishChoices])

    useEffect(() => {
        if (formData?.typeOutcome && formData?.typeOutcome !== "") {
            const findItem = typeOutcomeFUB.find((item) => item.id === Number(formData?.typeOutcome))

            const fetchData = async () => {
                if (findItem?.name.includes('REALTOR')) {
                    handleChange('realtorLender', 'REALTOR')
                    try {
                        const dataRealtor = await getChoicesCustomFields([{ id: 162, clave: "", choices: [] }]);

                        if (dataRealtor?.data?.[0]?.choices) {
                            setDataRealtorLender(dataRealtor.data[0].choices);
                        } else {
                            setDataRealtorLender([]);
                        }
                    } catch (error) {
                        console.error("Error fetching Realtor data:", error);
                        setDataRealtorLender([]);
                    }
                } else {
                    if (findItem?.name.includes('LENDER')) {
                        handleChange('realtorLender', 'LENDER')
                        try {
                            const dataLender = await getChoicesCustomFields([{ id: 165, clave: "", choices: [] }]);
                            console.log(dataLender);
                            if (dataLender?.data?.[0]?.choices) {
                                setDataRealtorLender(dataLender.data[0].choices);
                            } else {
                                setDataRealtorLender([]);
                            }
                        } catch (error) {
                            console.error("Error fetching Lender data:", error);
                            setDataRealtorLender([]);
                        }
                    } else {
                        setDataRealtorLender([]);
                    }
                }
            }
            fetchData()
        }
    }, [formData?.typeOutcome, finishChoices])

    const handleChange = (clave, valor) => {
        const updated = { ...formData, [clave]: valor };

        if (clave === "typeOutcome") {
            const findItem = typeOutcomeFUB.find((item) => item.id === Number(valor))
            updated.typeOutcomeName = findItem.name || ""
        }
        if (clave === "outcome") {
            const findItem = outcomeFUB.find((item) => item.id === Number(valor))
            updated.outcomeName = findItem.name || ""
        }
        setFormData(updated);            // actualiza el estado local del hijo
        handleFormData(1, updated);      // notifica al padre con los datos actualizados
    };

    const onChangeAppointment = (e) => {
        const value = e.target.value;

        const selectedAppointment = apptFub.find(
            (item) => item.id === Number(value)
        );

        handleSelectAppt(selectedAppointment)
        const updated = { ...formData, appointment: value, apptName: selectedAppointment?.title, typeOutcome: selectedAppointment?.typeId ?? null, outcome: selectedAppointment?.outcomeId ?? null };
        setFormData(updated);            // actualiza el estado local del hijo
        handleFormData(1, updated);
    };

    /*const onChangeRealtorLender = async (e) => {
        const value = e.target.value;
        const updated = { ...formData, realtorLender: value };
        setFormData(updated);            // actualiza el estado local del hijo
        handleFormData(1, updated);      // notifica al padre con los datos actualizados

    };*/

    if (loading || !finishChoices) {
        return (
            <Loading text="Loading Choices" />
        )
    }
    
    return (
        <div className="row w-100 m-auto bg-info">
            
            {formData?.appointment !== "" && (
                <>                   
                    {/* Appoitment Outcome */}
                    <div className="col-6">
                        <b>Appt Outcome</b>
                        <select
                            className="form-select form-select-sm"
                            aria-label="Lead type select"
                            value={formData?.outcome || ""}
                            onChange={(e) => handleChange('outcome', e.target.value)}
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

                    {/* Nombre del Lender o del Realtor */}
                    <div className="col-12 ">
                        <b>Meeting with</b>
                        <select
                            className="form-select form-select-sm"
                            aria-label="Lead type select"
                            value={formData?.realtorLenderValue || ""}
                            onChange={(e) => handleChange('realtorLenderValue', e.target.value)}
                        >
                            <option value="">EMPTY</option>
                            <option disabled>----------</option>
                            {/* You might want to populate this dynamically */}
                            {dataRealtorLender.map((item, index) => (
                                <option key={index + 1} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>
                </>
            )}
        </div>
    )
}

{/* Lender Realtor 
                    <div className="col-12 ">
                        <b>Realtor or Lender?</b>
                        <select
                            className="form-select form-select-sm"
                            aria-label="Lead type select"
                            value={formData?.realtorLender || ""}
                            onChange={(e) => onChangeRealtorLender(e)}
                        >
                            <option value="">EMPTY</option>
                            <option disabled>----------</option>
                            <option value="Realtor">Realtor</option>
                            <option value="Lender">Lender</option>
                        </select>
                    </div>
*/}