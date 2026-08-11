import React, { useState, useEffect, useCallback } from 'react'
import { CustomPastClient } from "../../config/CustomFields";
import { useAppContext } from '../../context/AppContext';
import { getCustomFields } from '../../config/funciones';
import { ajustarFecha, formatearFecha } from '../../config/utils';
import { obtenerFechasVecinas } from '../../config/utils';
import { toast } from "react-toastify";


const FormPastClient = () => {

    const [formData, setFormData] = useState({})
    const [statusBtn, setStatusBtn] = useState(false)
    const { person, context } = useAppContext()
    const [loading, setLoading] = useState(false)
    const [customData, setCustomData] = useState([])

    const ids = (CustomPastClient ?? []).join(",");

    //cargar toda la data de los customfields pero sin asignar valores
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            try {
                const custom = await getCustomFields(ids)
                setCustomData(custom)

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (person) {
            

            const updated = {}

            updated.supervisor = person?.customPCEscalateToSupervisor || ""
            updated.noteSupervisor = person?.customPCEscalationNote || ""
            updated.clientAttend = person?.customPCWILLCLIENTATTEND || ""
            updated.manyGoing = person?.customPCHowManyAreGoing || ""
            updated.clientName1 = person?.customPC1stClientName || ""
            updated.clientPhone1 = person.customPC1stClientPhone || ""
            updated.clientName2 = person?.customPC2ndClientName || ""
            updated.clientPhone2 = person.customPC2ndClientPhone || ""
            updated.futureEvents = person?.customPCIsTheClientOpenToAttendFutureEvents || ""
            updated.notFutureEvents = person?.customPCWhyIsNotOpenToAttendNewEvents || ""
            updated.noteFutureEvents = person?.customPCNoteWhyIsNotOpenForFutureEvent || ""
            updated.bouthSold = person?.customPCDidClientBoughtSoldAHouseWithAnotherRealtor || ""
            updated.recomended = person?.customPCWillYouRecommendJuanCarlosCarreraTeam || ""
            updated.recomendedNote = person?.customPCNoteWhyNotRecommendJCTeam || ""
            updated.language = person?.customClientLanguage || ""
            updated.birthday = person?.customBirthdayPastClientTC || ""
            updated.spouseBirthday = person?.customSpouseBirthday || ""
            
            setFormData(updated)
        }
    }, [person])

    const byId = useCallback(
        (id) => customData.find((f) => f.id === id)?.choices ?? [],
        [customData]
    );

    const handleChange = (clave, valor) => {

        const updated = { ...formData, [clave]: valor };

        setFormData(updated); // actualiza el estado local del hijo

    };

    const handleSave = async () => {
        setStatusBtn(true);

        try {
            const url =
                "https://n8n.homelasvegasnevada.com/webhook/17f8019f-4f53-4cba-8dad-775c145f641b";

            const dataJson = { ...formData };
            dataJson.peopleId = person?.id;

            if (dataJson?.clientAttend === "Will Think About it") {
                dataJson.dueDatetime = ajustarFecha(
                    dataJson?.promiseCallDate,
                    dataJson?.promiseCallTime
                );
            }

            // ====== ADDRESSES (SIN CIRCULARES) ======
            const safeAddresses = (Array.isArray(person?.addresses) ? person.addresses : [])
                .map((a) => ({
                    // fuerza a strings (evita arrays/objetos adentro)
                    street: String(a?.street ?? a?.fullAddress ?? "").trim(),
                    city: String(a?.city ?? "").trim(),
                    state: String(a?.state ?? "").trim(),
                    code: String(a?.code ?? a?.zip ?? a?.postalCode ?? "").trim(),
                    country: String(a?.country ?? "").trim(),
                    type: a?.type ?? "home",
                    isPrimary: Boolean(a?.isPrimary ?? false),
                    fullAddress: String(a?.fullAddress ?? "").trim(),
                }))
                .filter((a) => a.street || a.city || a.fullAddress);

            const newStreet = String(dataJson?.address ?? "").trim();
            if (newStreet) {
                const exists = safeAddresses.some(
                    (a) => a.fullAddress === newStreet || a.street === newStreet
                );

                if (!exists) {
                    safeAddresses.push({
                        street: newStreet,
                        city: "",
                        state: "",
                        code: "",
                        country: "",
                        type: "work",
                        isPrimary: safeAddresses.length === 0,
                        fullAddress: newStreet,
                    });
                }
                dataJson.addresses = safeAddresses;
            }           
            
            // evita mandar "address" string si ya mandas addresses array (opcional pero recomendado)
            delete dataJson.address;

            // ====== EMAILS (también sanitizado) ======
            const safeEmails = (Array.isArray(person?.emails) ? person.emails : [])
                .map((e) => ({
                    value: String(e?.value ?? e?.email ?? "").trim(),
                    type: e?.type ?? "work",
                    isPrimary: Boolean(e?.isPrimary ?? false),
                }))
                .filter((e) => e.value);

            const formEmail = String(dataJson?.email ?? "").trim();
            if (formEmail) {
                const exists = safeEmails.some(
                    (e) => e.value.toLowerCase() === formEmail.toLowerCase()
                );
                if (!exists) {
                    safeEmails.push({
                        value: formEmail,
                        type: "work",
                        isPrimary: safeEmails.length === 0,
                    });
                }
                dataJson.emails = safeEmails;
            }           

            delete dataJson.email
            // ====== IMPORTANTE: mandar como formData para que n8n lo lea en body.formData ======
            const payload = { formData: dataJson };

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                console.error("Error saving data:", response.statusText);
                toast.error("No se proceso");
                return;
            }

            toast.success("Procesado correctamente");
            console.log("data guardada");
        } catch (err) {
            console.error(err);
            toast.error("Error inesperado");
        } finally {
            setStatusBtn(false);
        }
    };

    if (loading) {
        return (
            <p>Loading...</p>
        )
    }

    return (
        <form className="row w-100 m-auto bg-info p-0 was-validated"
            lang="en"
            onSubmit={(e) => {
                e.preventDefault(); // 👈 Evita la recarga
                handleSave(); // 👈 Tu función
            }}>
            {/*ESCALATE TO SUPERVISOR */}
            <div className="col-12">
                <b>ESCALATE TO SUPERVISOR </b>
                <select
                    className="form-select form-select-sm"
                    aria-label="Lead type select"
                    value={formData?.supervisor || ""}
                    onChange={(e) => handleChange("supervisor", e.target.value)}
                    required
                >
                    <option value="">EMPTY</option>
                    <option disabled>----------</option>
                    {byId(315).map((item, index) => (
                        <option key={index}>
                            {item}
                        </option>
                    ))}
                </select>
            </div>
            {formData?.supervisor === "Yes" && (
                <>
                    {/*Note */}
                    <div className="col-12">
                        <b>Note</b>
                        <div className="input-group input-group-sm mb-1">
                            <textarea
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="note"
                                value={formData?.noteSupervisor || ""}
                                onChange={(e) => handleChange("noteSupervisor", e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </>
            )}
            {formData?.supervisor && (
                <>
                    <h3 className='text-center border-black border-bottom border-2'>Lunch 28-FEB</h3>
                    {/*Will the Client Attend? */}
                    <div className="col-12">
                        <b>Will the Client Attend?</b>
                        <select
                            className="form-select form-select-sm"
                            aria-label="Lead type select"
                            value={formData?.clientAttend || ""}
                            onChange={(e) => handleChange("clientAttend", e.target.value)}
                            required
                        >
                            <option value="">EMPTY</option>
                            <option disabled>----------</option>
                            {byId(317).map((item, index) => (
                                <option key={index}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>
                </>
            )}
            {formData?.clientAttend == "Yes" && (
                <>
                    {/*How many are going? */}
                    <div className="col-12">
                        <b>How many are going?</b>
                        <select
                            className="form-select form-select-sm"
                            aria-label="Lead type select"
                            value={formData?.manyGoing || ""}
                            onChange={(e) => handleChange("manyGoing", e.target.value)}
                            required
                        >
                            <option value="">EMPTY</option>
                            <option disabled>----------</option>
                            {byId(318).map((item, index) => (
                                <option key={index}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>

                    {(formData?.manyGoing === "1" || formData?.manyGoing === "2") && (
                        <>
                            {/* 1st Client Name */}
                            <div className="col-12">
                                <b>1st Client Name</b>
                                <div className="input-group input-group-sm mb-1">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="client name"
                                        value={formData?.clientName1 || ""}
                                        onChange={(e) => handleChange("clientName1", e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* 1st Client Phone */}
                            <div className="col-12">
                                <b>1st Client Phone</b>
                                <div className="input-group input-group-sm mb-1">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="client phone"
                                        value={formData?.clientPhone1 || ""}
                                        onChange={(e) => handleChange("clientPhone1", e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}
                    {formData?.manyGoing === "2" && (
                        <>
                            {/* 2st Client Name */}
                            <div className="col-12">
                                <b>2st Client Name</b>
                                <div className="input-group input-group-sm mb-1">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="client name"
                                        value={formData?.clientName2 || ""}
                                        onChange={(e) => handleChange("clientName2", e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* 2st Client Phone */}
                            <div className="col-12">
                                <b>2st Client Phone</b>
                                <div className="input-group input-group-sm mb-1">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="client phone"
                                        value={formData?.clientPhone2 || ""}
                                        onChange={(e) => handleChange("clientPhone2", e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
            {formData?.clientAttend === "No" && (
                <>
                    {/* Is the client Open to attend future events? */}
                    <div className="col-12">
                        <b>Is the client Open to attend future events?</b>
                        <select
                            className="form-select form-select-sm"
                            aria-label="Lead type select"
                            value={formData?.futureEvents || ""}
                            onChange={(e) => handleChange("futureEvents", e.target.value)}
                            required
                        >
                            <option value="">EMPTY</option>
                            <option disabled>----------</option>
                            {byId(323).map((item, index) => (
                                <option key={index}>
                                    {item}
                                </option>
                            ))}

                        </select>
                    </div>

                    {formData?.futureEvents === "No" && (
                        <>
                            {/* Why is not open to attend new events? */}
                            <div className="col-12">
                                <b>Why is not open to attend new events?</b>
                                <select
                                    className="form-select form-select-sm"
                                    aria-label="Lead type select"
                                    value={formData?.notFutureEvents || ""}
                                    onChange={(e) => handleChange("notFutureEvents", e.target.value)}
                                    required
                                >
                                    <option value="">EMPTY</option>
                                    <option disabled>----------</option>
                                    {byId(324).map((item, index) => (
                                        <option key={index}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* Note */}
                            <div className="col-12">
                                <b>Note</b>
                                <div className="input-group input-group-sm mb-1">
                                    <textarea
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="note"
                                        value={formData?.noteFutureEvents || ""}
                                        onChange={(e) => handleChange("noteFutureEvents", e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
            {formData?.clientAttend === "Will Think About it" && (
                <>
                    <div className="col-12">
                        <b>Promise To Call (Note)</b>
                        <div className="input-group input-group-sm mb-1">
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="note"
                                value={formData?.promiseCallNote || ""}
                                onChange={(e) => handleChange("promiseCallNote", e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="col-12">
                        <b>Promise To Call (Date)</b>
                        <div className="input-group input-group-sm mb-1">
                            <input
                                type="date"
                                className="form-control form-control-sm"
                                placeholder="note"
                                value={formData?.promiseCallDate || ""}
                                onChange={(e) => handleChange("promiseCallDate", e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="col-12">
                        <b>Promise To Call Time</b>
                        <select
                            className="form-select form-select-sm"
                            aria-label="Lead type select"
                            value={formData?.promiseCallTime || ""}
                            onChange={(e) => handleChange("promiseCallTime", e.target.value)}
                            required
                        >
                            <option value="">EMPTY</option>
                            <option disabled>----------</option>
                            {byId(149).map((item, index) => (
                                <option key={index}>
                                    {item.split('-')[1]}
                                </option>
                            ))}
                        </select>
                    </div>
                </>
            )}

            {(formData?.clientAttend === "Yes" || (formData?.clientAttend === "No" && formData?.futureEvents === "Yes")) && (
                <>
                    <h4 className='text-center border-black border-bottom border-2'>GENERAL INFO REQUIRED FOR EVERY PAST CLIENT</h4>
                    <p className='text-center  p-1 rounded-1 bg-warning m-1 fw-bold'>For every Past Client is required to collect all this info</p>
                    {/* Language */}
                    <div className="col-12">
                        <b>Language</b>
                        <select
                            className="form-select form-select-sm"
                            aria-label="Lead type select"
                            value={formData?.language || ""}
                            onChange={(e) => handleChange("language", e.target.value)}
                        //required
                        >
                            <option value="">EMPTY</option>
                            <option disabled>----------</option>
                            <option value="Spanish">Spanish</option>
                            <option value="English">English</option>
                        </select>
                    </div>
                    {/* Home address */}
                    <div className="col-12">
                        <b>Home Address</b>
                        <div className="input-group input-group-sm mb-1">
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="home address"
                                value={formData?.address || ""}
                                onChange={(e) => handleChange("address", e.target.value)}
                            //required
                            />
                        </div>
                    </div>
                    {/* Did Client Bought /sold  a house with another Realtor?   */}
                    <div className="col-12">
                        <b>Did Client Bought /sold  a house with another Realtor? </b>
                        <select
                            className="form-select form-select-sm"
                            aria-label="Lead type select"
                            value={formData?.bouthSold || ""}
                            onChange={(e) => handleChange("bouthSold", e.target.value)}
                        //required
                        >
                            <option value="">EMPTY</option>
                            <option disabled>----------</option>
                            {byId(326).map((item, index) => (
                                <option key={index}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>
                    {/* Email */}
                    <div className="col-12">
                        <b>Email</b>
                        <div className="input-group input-group-sm mb-1">
                            <input
                                type="email"
                                className="form-control form-control-sm"
                                placeholder="email"
                                value={formData?.email || ""}
                                onChange={(e) => handleChange("email", e.target.value)}
                            //required
                            />
                        </div>
                    </div>
                    {/* Past Client Birthday */}
                    <div className="col-12">
                        <b>Past Client Birthday</b>
                        <div className="input-group input-group-sm mb-1">
                            <input
                                type="date"
                                className="form-control form-control-sm"
                                placeholder="date"
                                value={formData?.birthday || ""}
                                onChange={(e) => handleChange("birthday", e.target.value)}
                            //required
                            />
                        </div>
                    </div>
                    {/* Spouse Birthday */}
                    <div className="col-12">
                        <b>Spouse Birthday</b>
                        <div className="input-group input-group-sm mb-1">
                            <input
                                type="date"
                                className="form-control form-control-sm"
                                placeholder="date"
                                value={formData?.spouseBirthday || ""}
                                onChange={(e) => handleChange("spouseBirthday", e.target.value)}
                            //required
                            />
                        </div>
                    </div>
                    {/* Will you recommend Juan Carlos Carrera Team?  */}
                    <div className="col-12">
                        <b>Will you recommend Juan Carlos Carrera Team? </b>
                        <select
                            className="form-select form-select-sm"
                            aria-label="Lead type select"
                            value={formData?.recomended || ""}
                            onChange={(e) => handleChange("recomended", e.target.value)}
                        //required
                        >
                            <option value="">EMPTY</option>
                            <option disabled>----------</option>
                            {byId(327).map((item, index) => (
                                <option key={index}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>
                    {formData?.recomended === "No" && (
                        <>
                            {/* Note */}
                            <div className="col-12">
                                <b>Note</b>
                                <div className="input-group input-group-sm mb-1">
                                    <textarea
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="note"
                                        value={formData?.recomendedNote || ""}
                                        onChange={(e) => handleChange("recomendedNote", e.target.value)}
                                    //required
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
            <div className="d-flex justify-content-center align-items-center mt-1 mb-1">
                <button className="btn btn-success" type="onSubmit" disabled={statusBtn}>
                    <i className="bi bi-floppy me-1"></i> {statusBtn ? "Saving..." : "Save"}
                </button>
            </div>
        </form>
    )
}

export default FormPastClient