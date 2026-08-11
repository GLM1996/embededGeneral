import React, { useEffect, useState } from 'react'
import { getChoicesCustomFields } from '../../config/funciones'
import { CustomFieldsCita } from '../../config/CustomFields'
import Loading from '../Loading'

export default function Accordion4({ handleFormData, person }) {

    const [loading, setLoading] = useState(false)
    const [finishChoices, setFinishChoices] = useState(false)
    //Custom Fields
    const [citaChoices, setCitaChoices] = useState([])
    const [actionsChoices, setActionsChoices] = useState([])
    const [qualifyOrSignChoices, setQualifyOrSignChoices] = useState([])
    const [problemChoices, setProblemChoices] = useState([])
    const [externalProblemsChoices, setExternalProblemsChoices] = useState([])
    const [internalProblemsChoices, setInternalProblemsChoices] = useState([])

    const [formData, setFormData] = useState({ datePending: "" })

    useEffect(() => {
        const fetchData = async () => {
            setFinishChoices(false)
            setLoading(true)
            const data = await getChoicesCustomFields(CustomFieldsCita)
            data.data.forEach(item => {
                switch (item.clave) {
                    case "cita":
                        setCitaChoices(item.choices)
                        break;
                    case "actions":
                        setActionsChoices(item.choices)
                        break;
                    case "problem":
                        setProblemChoices(item.choices)
                        break;
                    case "externalProblems":
                        setExternalProblemsChoices(item.choices)
                        break;
                    case "internalProblems":
                        setInternalProblemsChoices(item.choices)
                        break;
                    case "qualifySign":
                        setQualifyOrSignChoices(item.choices)
                        break;

                    default:
                        break;
                }
            });

            setFinishChoices(true)
            setLoading(false)
        }
        fetchData()
    }, [])

    useEffect(() => {        
        if (person && finishChoices && person?.citas.length > 0) {
            const lastCita = person.citas[person.citas.length - 1]
            
            const updated = {
                cita: lastCita?.attendance || "",
                actions: lastCita?.results || "",
                whyNoCita: lastCita?.whyNoCita || "",
                problem: lastCita?.problem || "",
                pendiente: lastCita?.pending || "",
                datePending: lastCita?.datePending?.slice(0, 10) || "",
            }
            setFormData(updated)
            handleFormData(2, updated)
        }
    }, [person, finishChoices])

    const handleChange = (clave, valor) => {
        const updated = { ...formData, [clave]: valor };
        setFormData(updated);            // actualiza el estado local del hijo
        handleFormData(2, updated);      // notifica al padre con los datos actualizados
    };

    if (loading || !finishChoices) {
        return (
            <Loading text="Loading Choices" />
        )
    }
    
    return (
        <>
            <div className="row w-100 m-auto">
                <div className="col-12 ">
                    <b>Appt Attendance</b>
                    <select
                        className="form-select form-select-sm"
                        aria-label="Lead type select"
                        value={formData?.cita || ""}
                        onChange={(e) => handleChange('cita', e.target.value)}
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
            </div>
            {/*Cuando es no */}
            {formData?.cita && citaChoices.indexOf(formData?.cita) === 2 && (
                <div className="row w-100 m-auto">
                    <div className="col-12">
                        <b>No show reason</b>
                        <select
                            className="form-select form-select-sm"
                            aria-label="Lead type select"
                            value={formData?.whyNoCita}
                            onChange={(e) => handleChange('whyNoCita', e.target.value)}
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
                                className="form-select form-select-sm"
                                aria-label="Lead type select"
                                value={formData?.problem}
                                onChange={(e) => handleChange('problem', e.target.value)}
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
                                className="form-select form-select-sm"
                                aria-label="Lead type select"
                                value={formData?.problem}
                                onChange={(e) => handleChange('problem', e.target.value)}
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

                </div>
            )}

            {/*Cuando es si */}
            {formData?.cita && citaChoices.indexOf(formData?.cita) === 1 && (
                <div className="row w-100 m-auto d-flex flex-column gap-1 mt-2">
                    <div className="col-12">
                        <b>Appt Result</b>
                        <select
                            className="form-select form-select-sm"
                            aria-label="Lead type select"
                            value={formData?.actions}
                            onChange={(e) => handleChange('actions', e.target.value)}
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
                    {/*Cuando es califica y firma */}
                    {formData?.actions === "Qualify//Sign" && (
                        <div className="col-12 ">
                            <b>Qualify or Sing?</b>
                            <select
                                className="form-select form-select-sm"
                                aria-label="Lead type select"
                                value={formData?.calificaFirma}
                                onChange={(e) => handleChange('calificaFirma', e.target.value)}
                            >
                                <option value="">EMPTY</option>
                                <option disabled>----------</option>
                                {qualifyOrSignChoices.map((item, index) => (
                                    <option key={index + 1} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {/*Cosas Pendientes Por realtor ...*/}
                    {formData?.actions === "Client Pending Action" && (
                        <div className="col-12">
                            <div className="input-group input-group-sm mb-1">
                                <textarea
                                    type="text"
                                    className="form-control"
                                    placeholder='pending actions'
                                    value={formData?.pendiente}
                                    onChange={(e) => handleChange('pendiente', e.target.value)}
                                />
                            </div>
                            <div className='d-flex flex-column'>
                                <b>Appt Follow Up</b>
                                <div className='input-group input-group-sm mb-1'>
                                    <input type="date" className='form-control' value={formData?.datePending}
                                        onChange={(e) => handleChange('datePending', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}
                    {formData?.actions === "Didn´t qualify// Didn´t sign" && (
                        <div className="col-12 ">
                            <b>Result Details?</b>
                            <select
                                className="form-select form-select-sm"
                                aria-label="Lead type select"
                                value={formData?.requisitos}
                                onChange={(e) => handleChange('requisitos', e.target.value)}
                            >
                                <option value="">EMPTY</option>
                                <option disabled>----------</option>
                                <option value="Decided to Quit">Decided to Quit</option>
                                <option value="Didn´t qualify">Didn´t qualify</option>
                            </select>

                            {/*Cambios en los no continuar */}
                            {formData?.requisitos === 'Decided to Quit' && (
                                <div className="input-group input-group-sm mt-2">
                                    <textarea
                                        type="text"
                                        className="form-control"
                                        placeholder='Why?'
                                        value={formData?.whyNoContinue}
                                        onChange={(e) => handleChange('whyNoContinue', e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </>
    )
}
