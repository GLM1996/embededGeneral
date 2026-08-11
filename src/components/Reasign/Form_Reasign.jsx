import React, { useState, useEffect } from 'react'
import { CustomFieldsReasigned } from '../../config/CustomFields';
import { actualDate, servidor_n8n } from '../../config/utils';
import { createNote, getChoicesCustomFields } from '../../config/funciones';
import { toast } from 'react-toastify';
import { useAppContext } from '../../context/AppContext';

export default function Form_Reasign() {

    const [choices, setChoices] = useState([]);
    const [reasignedDate, setReasignedDate] = useState(actualDate())
    const [reasignedFrom, setReasignedFrom] = useState("")
    const [reasignedTo, setReasignedTo] = useState("")
    const [statusBtn, setStatusBtn] = useState(false);
    const [loading, setLoading] = useState(true);
    const { person, context } = useAppContext()
    const [statusClient, setStatusClient] = useState("")

    //SE ENCARGA DE CARGAR LAS OPCIONES PARA LOS CUSTOM FIELDS
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getChoicesCustomFields(CustomFieldsReasigned)
                if (response.success) {
                    setChoices(response.data);
                }
            } catch (error) {
                console.log(error)
            } finally { setLoading(false) }
        }
        fetchData()
    }, []);

    //SE ENCARGA DE ACTUALIZAR CON LOS VALORES QUE ESTAN EN FOLLOW BOSS
    useEffect(() => {
        if (choices.length !== 0 && person) {
            setReasignedDate(actualDate())
            setReasignedFrom(person.assignedTo || person?.customAdminClientReasignedRemovedFrom || "")
            setReasignedTo("")
        }
    }, [choices, person])

    //SE ENCARGA DE SALVAR LA INFORMACION
    async function handleSave() {
        setStatusBtn(true)
        const data = {}

        data.id = person.id
        data.leadType = person.custtomLea
        data.people = {
            assignedTo: reasignedTo,
            customAdminClientReasignedDate: reasignedDate,
            customAdminClientReasignedRemovedFrom: reasignedFrom,
            customAdminClientReasignedAssignedTo: reasignedTo,
        }
        const url = `${servidor_n8n}/webhook/42f2ec18-6744-44f8-a491-09ac93e31d1b`
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ data }),
        };
        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage =
                    errorData.message || `HTTP error! status: ${response.status}`;
                console.error(errorMessage);
                toast.error(errorMessage)
                return [];
            } else {
                const noteText = `<b>${context.user.name}</b> reassignation made: <br>Agent From: <b style="color: red">${person?.assignedTo}</b> <br>Agent To: <b style="color: green">${reasignedTo}</b> <br>Date: <b style="color: green">${actualDate()}</b>`


                const noteData = {
                    personId: Number(person.id),
                    subject: `Reassignation Made >> ${reasignedTo}`,
                    text: noteText,
                };
                const noteResponse = await (createNote(noteData))
                if (noteResponse.success) {
                    toast.success("Nota de cambio creada", { position: "top-right", autoClose: 2000 });
                } else {
                    throw new Error("Error al crear la Nota");
                }
                toast.success('Reasignacion Complete')
            }

        } catch (error) {
            console.log(error)
        } finally { setStatusBtn(false) }
    }
    //VERIFICA SI EL USUARIO TIENE PERMISOS
    if (context.user.role !== "Broker") {
        return (
            <div className="d-flex justify-content-center bg-warning">
                <h4 className="p-4">Necesita privilegios de Administrador</h4>
            </div>
        );
    }
    //VERIFICA SI YA SE CARGARON LOS DATOS
    if (loading || choices.length === 0) {
        return (
            <div className="d-flex justify-content-center align-items-center p-4">
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                <span>Loading...</span>
            </div>
        );
    }

    const leadType = person?.customRRealtorSOILeadRefferalLeadCompanyLead

    /* FUNCIONES QUE RENDERIZAN PARA REUTILIZAR CODIGO */
    const getBannerText = () => {
        if (leadType === "SOI Lead") {
            return "By making this referral, I acknowledge that in order to claim the 25% referral fee, both Realtors must complete the Broker Referral Agreement through our TC.";
        }

        const bannerTexts = {
            "1": "By reassigning this lead to another Realtor, I understand that they may pay a 5% fee for the reassignment of a company lead only if the transaction closes and both Realtors remain with the company.",
            "2": "By reassigning this lead to another Realtor, I understand that I may receive $150 for the collaboration on the initial appointment attended, reflected in my next payment, in addition to the 5% for the reassignment of the company lead, only if the transaction closes and both Realtors remain with the company.",
            "3": "By reassigning this lead to another Realtor, I understand that they may pay 5% for the reassignment of a company lead plus 5% for collaboration on the signed initial appointment, for a total of 10% of the Realtor’s commission. This is only possible if the transaction closes and both Realtors remain with the company."
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
                onInvalid={(e) =>
                    e.target.setCustomValidity("This field is required")
                }
                onInput={(e) => e.target.setCustomValidity("")}
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
                onInvalid={(e) =>
                    e.target.setCustomValidity("This field is required")
                }
                onInput={(e) => e.target.setCustomValidity("")}
            >
                <option value="">Select an agent</option>
                <option disabled>----------</option>
                {choices[0]?.choices                    
                    .map((option, index) => (
                        <option key={index} value={option}>
                            {option}
                        </option>
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
                onInvalid={(e) =>
                    e.target.setCustomValidity("This field is required")
                }
                onInput={(e) => e.target.setCustomValidity("")}
            >
                <option value="">Select an agent</option>
                <option disabled>----------</option>
                {choices[1]?.choices.map((option, index) => (
                        <option key={index} value={option}>
                            {option}
                        </option>
                    ))}
            </select>
        </div>
    );
    const renderStatusClientField = () => (
        <div className="col-12">
            <label className="form-label fw-semibold mb-1">
                <i className="bi bi-flag me-1"></i>Client Assignment Types
            </label>
            <select
                className="form-select form-select-sm"
                value={statusClient}
                onChange={(e) => {
                    setStatusClient(e.target.value);
                }}
                required
                onInvalid={(e) =>
                    e.target.setCustomValidity("This field is required")
                }
                onInput={(e) => e.target.setCustomValidity("")}
            >
                <option value="">Select client assignment</option>
                <option disabled>----------</option>
                {/* <option value="1">El cliente no ha tenido cita de Buyer o Listing Presentation</option>
                <option value="2">El cliente tuvo cita de Buyer o Listing Presentation pero no firmó</option>
                <option value="3">El cliente tiene firmado un BBA o LBA</option> */}
                <option value="1">No Buyer/Listing Meeting (5% for Reasign)</option>
                <option value="2">Meeting Held, No Signature (5% for Reasign + $150 for Collaboration)</option>
                <option value="3">Signed BBA/LBA (5% for Reasign + 5% for Collaboration)</option>
            </select>
        </div>
    );
    const renderSubmitButton = () => (
        <div className="col-12 d-flex justify-content-center my-3">
            <button
                className="btn btn-success px-4"
                type="submit"
                disabled={statusBtn}
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
            <div className='d-flex justify-content-center border border-1 border-black rounded-1 bg-info p-1'>
                <strong>Client Type:  {person?.customRRealtorSOILeadRefferalLeadCompanyLead}</strong>
            </div>
            {renderDateField()}
            {renderSelectFrom()}
            {renderSelectTo()}
            {renderSubmitButton()}
        </form>
    );

    return (
        <div className='container px-2 py-3'>
            <div className='card shadow border-0 rounded-4 mx-auto overflow-hidden'>
                <div className="card-body p-3">
                    {renderForm()}
                </div>
            </div>
        </div>
    )
}
