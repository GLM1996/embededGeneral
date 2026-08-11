import React, { useState, useEffect } from 'react';
import ListarApptStatus from '../ApptStatus/ListarApptStatus';
import { useAppContext } from '../../context/AppContext';
import ListTask from '../Tasks/ListTask'
import Form from './Form';
import { toast } from 'react-toastify';
import { putStage, getChoicesCustomFields } from '../../config/funciones';
import { CustomFieldsFollowUp } from '../../config/CustomFields'
import { actualDate } from '../../config/utils';

export default function Follow({ personFilter }) {
    const { person, context } = useAppContext()
    const [create, setCreate] = useState(false)
    const [clientInterest, setClientInterested] = useState()
    const [attemps, setAttemps] = useState(person?.customVAAttempts || "")
    const [noContesto, setNoContesto] = useState()
    const [loading, setLoading] = useState(true)
    const [choices, setChoices] = useState([])

    //BUSCA LOS CUSTOM FIELDS DE FOLLOW UP BOSS PARA LAS OPCIONES
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            //const data = await getChoicesCustomFields(CustomFieldsAccordion1);
            const data = await getChoicesCustomFields(CustomFieldsFollowUp)
            setChoices(data.data);
            setLoading(false);
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (choices.length > 0 && person) {
            setClientInterested(person?.customVAClientInterestedOrNotInterested || "")
            setAttemps(person?.customVANOANSWERATTEMPTS || "")
        }

    }, [choices, person])

    const handleCreate = () => {
        setCreate(!create)
    }

    const handleSave = async (clave, value) => {
        if (clave === "attemps") setAttemps(value)
        if (clave === "interest") setClientInterested(value)

        if (clave === "interest" && !value) { return; }

        try {
            const data = {
                personId: person.id,
                customVAClientInterestedOrNotInterested: clave === "interest" ? value : clientInterest,
                customVANOANSWERATTEMPTS: clave === "attemps" ? value : attemps
            }
            let today = new Date(); // get current date
            let next = new Date(today); // make a copy
            next.setDate(today.getDate() + 15); // add 15 days

            if (value === '1 DAY ATTEMPT' && !person?.customVAFirstAttemptDate) {
                data.customVAFirstAttemptDate = today.toISOString().split('T')[0]; // e.g. "2025-10-15"   
                data.customVALastAttemptDate = next.toISOString().split('T')[0]; // e.g. "2025-10-30"             
            }
            if (!value && clave === 'attemps') {
                data.customVAFirstAttemptDate = ""; // e.g. "2025-10-15"   
                data.customVALastAttemptDate = ""; // e.g. "2025-10-30"             
            }

            const people = await putStage(data)
            console.log(people)
        } catch (error) {
            console.log(error)
        }
        toast.success("Salvando Data", {
            position: "top-right",
            autoClose: 2000,
        });
    }

    if (loading) {
        return (
            <div className="d-flex justify-content-center">
                <b className="fs-5">Cargando...</b>
            </div>
        )
    }

    return (
        <div className="row w-100 m-auto">
            {/* Client Interested */}
            <div className="col-12 mb-1 fade-in">
                <b>Cliente interesado</b>
                <select
                    className="form-select form-select-sm"
                    aria-label="Lead type select"
                    value={clientInterest || ""}
                    onChange={(e) => handleSave('interest', e.target.value)}
                >
                    <option value="">EMPTY</option>
                    <option disabled>----------</option>
                    <option value="Interested">Yes</option>
                    <option value="Not Interested">No</option>
                </select>
            </div>
            {/* Attemps */}
            <div className="col-12 mb-1 fade-in">
                <b>Attemps</b>
                <select
                    className="form-select form-select-sm"
                    aria-label="Lead type select"
                    value={attemps || ""}
                    onChange={(e) => handleSave('attemps', e.target.value)}
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
            {/* Si esta interesado y tiene attemps */}
            {clientInterest === "Interested" && attemps && (
                <>
                    {/* Client Interested */}
                    <div className="col-12 mb-1 fade-in">
                        <b>Cliente no respondio a...</b>
                        <select
                            className="form-select form-select-sm"
                            aria-label="Lead type select"
                            value={noContesto || ""}
                            onChange={(e) => setNoContesto(e.target.value)}
                        >
                            <option value="">EMPTY</option>
                            <option disabled>----------</option>
                            <option value="No contesto un task">No contesto un task</option>
                            <option value="No contesto una llamada perdida">No contesto una llamada perdida</option>
                            <option value="No contesto despues de registrarse">No contesto despues de registrarse</option>
                            <option value="No contesto seguimiento de stage">No contesto seguimiento de stage</option>
                        </select>
                    </div>
                    {(noContesto === 'No contesto una llamada perdida' || noContesto === 'No contesto despues de registrarse' || (clientInterest === 'Interested' && noContesto === 'No contesto un task')) && (
                        <div className='fade-in shadow my-1 py-1 rounded-1'>
                            <div className="col-12">
                                <b>Next Contact Day (Note)</b>
                                <div className="input-group input-group-sm mb-1">
                                    <input
                                        className="form-control"
                                        type="text"
                                    // value={formData?.taskNote || ""}
                                    // onChange={(e) =>
                                    //     handleForm("taskNote", e.target.value)
                                    // }
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
                                    // value={formData?.taskDay || ""}
                                    // onChange={(e) => handleForm("taskDay", e.target.value)}
                                    />
                                </div>
                            </div>
                            {/* Best Time To Call Next Contact Day */}
                            <div className="col-12 mb-1">
                                <b>Next Contact Day Time</b>
                                <select
                                    className="form-select form-select-sm"
                                    aria-label="Lead type select"
                                // value={formData?.taskTime || ""}
                                // onChange={(e) => handleForm("taskTime", e.target.value)}
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

                    <div className='d-flex justify-content-center border-black border-bottom border-2 mb-2'>
                        <button className='btn btn-success my-1'><i className='bi bi-floppy'></i> Save</button>
                    </div>
                </>
            )}

            {!create ? (
                <button className='btn btn-success my-1' onClick={handleCreate}><i className='bi bi-plus'></i> Create Tasks</button>
            ) : (
                <button className='btn btn-success my-1' onClick={handleCreate}><i className='bi bi-arrow-left'></i> Back</button>
            )}

            {!create ? (
                <>
                    <ListarApptStatus personFilter={personFilter}/>
                    <div className='border border-2 border-black my-2'></div>
                    <ListTask />
                </>
            ) : <Form choices={choices} />}
        </div >
    );
}
