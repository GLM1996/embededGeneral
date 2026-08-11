import React, { useState, useEffect } from 'react'
import {  postTask, putStage } from '../../config/funciones'
import { useAppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'
import { ajustarFecha } from '../../config/utils'

export default function Form({choices}) {
    const [formData, setFormData] = useState({})
    const { person, context } = useAppContext()
    const [statusBtn, setStatusBtn] = useState(true)


    //ACTUALIZA EL FORM CON VALORES DE PEOPLE
    useEffect(() => {

        const updated = {
            cita: person?.customVADidTheClientHadAnAppointmentBefore || "",
            isPromise: person?.customVADidYouPromiseToCallTheCustomer || "",
        }
        setFormData(updated)
    }, [])

    //CONTROLA LOS CAMBOS DEL FORMULARIO
    const handleForm = (clave, valor) => {
        setFormData(prev => ({
            ...prev,
            [clave]: valor,  // 👈 usar corchetes para clave dinámica
        }));
    };

    //SE ENCARGA DE CREAR LAS TASK AUTOMATICAS EN FOLLOW
    const createPendingTask = async () => {
        if (!formData?.taskNote || !formData?.taskDay || !formData?.taskTime) {
            toast.error("Data requerida", {
                position: "top-right",
                autoClose: 2000,
            });
            return
        }
        let fechaAjustada = ""
        fechaAjustada = ajustarFecha(formData?.taskDay, formData?.taskTime?.split('-')[1])

        const dataTask = {
            personId: Number(context.person.id),
            assignedUserId: Number(person.assignedUserId),
            name: formData?.taskNote || person.name,
            type: formData?.cita === 'Yes' ? 'Follow Up' : formData?.isPromise === 'Yes' ? 'Thank You' : 'Call',
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
    //SE ENCARGA DE VALIDAR LA DATA
    function validateData() {
        let isValidate = true
        if (!formData?.cita || !formData?.taskNote || !formData?.taskDay || !formData?.taskTime) {
            isValidate = false
        }
        return isValidate
    }

    const onSave = async () => {
        if (validateData()) {
            setStatusBtn(false)
            console.log('Salvando data...', formData)
            try {
                const data = {
                    personId: person.id,
                    customVADidTheClientHadAnAppointmentBefore: formData?.cita || "",
                    customVADidYouPromiseToCallTheCustomer: formData?.isPromise || "",
                    //customVANOANSWERATTEMPTS: formData?.attemps || ""
                }
                const people = await putStage(data)
                if (people) {
                    toast.success("People Updated")
                }
                await createPendingTask()
            } catch (error) {
                console.log(error)
            } finally {
                setStatusBtn(true)
            }
        } else {
            toast.error("Data Requerida", {
                position: "top-right",
                autoClose: 2000,
            });
        }
    }

    return (
        <div className='row w-100 m-auto'>
            {/* Tiene Cita */}
            <div className="col-12 mb-1">
                <b>Client had an appt before?</b>
                <select
                    className="form-select form-select-sm"
                    aria-label="Lead type select"
                    value={formData?.cita || ""}
                    onChange={(e) => handleForm('cita', e.target.value)}
                >
                    <option value="">EMPTY</option>
                    <option disabled>----------</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                </select>
            </div>
            {formData?.cita === 'No' && (
                <>
                    {(formData?.cita && formData?.cita !== '' && formData?.cita === 'No') && (
                        <>
                            {/* Promiss Call */}
                            <div className="col-12 mb-1 fade-in">
                                <b>Did you promise to call the customers?</b>
                                <select
                                    className="form-select form-select-sm"
                                    aria-label="Lead type select"
                                    value={formData?.isPromise || ""}
                                    onChange={(e) => handleForm('isPromise', e.target.value)}
                                >
                                    <option value="">EMPTY</option>
                                    <option disabled>----------</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                            {formData?.isPromise && (
                                <div className='fade-in shadow my-1 py-1 rounded-1'>
                                    <div className="col-12">
                                        {formData?.isPromise === 'No' ?
                                            <b>Next Contact Day (Note)</b> : <b>Promise To Call (Note)</b>
                                        }
                                        <div className="input-group input-group-sm mb-1">
                                            <input
                                                className="form-control"
                                                type="text"
                                                value={formData?.taskNote || ""}
                                                onChange={(e) =>
                                                    handleForm("taskNote", e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>
                                    {/* Next Contact Date */}
                                    <div className="d-flex flex-column">
                                        {formData?.isPromise === 'No' ?
                                            <b>(VA) Next Contact Day (Date)</b> : <b>(VA) Promise To Call (Date)</b>
                                        }
                                        <div className="input-group input-group-sm mb-1">
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={formData?.taskDay || ""}
                                                onChange={(e) => handleForm("taskDay", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    {/* Best Time To Call Next Contact Day */}
                                    <div className="col-12 mb-1">
                                        {formData?.isPromise === 'No' ?
                                            <b>Next Contact Day Time</b> : <b>Promise To Call Time</b>
                                        }
                                        <select
                                            className="form-select form-select-sm"
                                            aria-label="Lead type select"
                                            value={formData?.taskTime || ""}
                                            onChange={(e) => handleForm("taskTime", e.target.value)}
                                        >
                                            <option value="">EMPTY</option>
                                            <option disabled>----------</option>
                                            {choices[0].choices.map((option, index) => (
                                                <option key={index} value={option}>
                                                    {option.split("-")[1]}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {formData?.cita === 'Yes' && (
                <>
                    <div className='fade-in shadow my-1 py-1 rounded-1'>
                        <div className="col-12">
                            <b>Follow Up (Note)</b>
                            <div className="input-group input-group-sm mb-1">
                                <input
                                    className="form-control"
                                    type="text"
                                    value={formData?.taskNote || ""}
                                    onChange={(e) =>
                                        handleForm("taskNote", e.target.value)
                                    }
                                />
                            </div>
                        </div>
                        {/* Next Contact Date */}
                        <div className="d-flex flex-column">
                            <b>Follow Up (Date)</b>
                            <div className="input-group input-group-sm mb-1">
                                <input
                                    type="date"
                                    className="form-control"
                                    value={formData?.taskDay || ""}
                                    onChange={(e) => handleForm("taskDay", e.target.value)}
                                />
                            </div>
                        </div>
                        {/* Best Time To Call Next Contact Day */}
                        <div className="col-12 mb-1">
                            <b>Follow Up Time</b>
                            <select
                                className="form-select form-select-sm"
                                aria-label="Lead type select"
                                value={formData?.taskTime || ""}
                                onChange={(e) => handleForm("taskTime", e.target.value)}
                            >
                                <option value="">EMPTY</option>
                                <option disabled>----------</option>
                                {choices[0].choices.map((option, index) => (
                                    <option key={index} value={option}>
                                        {option.split("-")[1]}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </>
            )}


            <div className='d-flex justify-content-center align-items-center my-1'>
                <button className='btn btn-success' disabled={!statusBtn} onClick={onSave}>
                    <i className='bi bi-floppy me-2'></i>{statusBtn ? 'Save' : 'Saving...'}
                </button>
            </div>
        </div>
    )
}
