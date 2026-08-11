import React, { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../../context/AppContext";
import {
    searchAppointmentOutcomeFUB,
    getCustomFields,
    searchAppointmentTypeOutcomeFUB,
} from "../../config/funciones";
import moment from "moment-timezone";
import { servidor_n8n, convertTo24Hour } from "../../config/utils";

const DEFAULT_AVAILABLE_TIME = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
];

export const Form = () => {
    const { person, context } = useAppContext();

    const [formData, setFormData] = useState({
        language: "",
        leadType: "",
        clientQualify: "",
        typeCita: "",
        whereCita: "",
        address: "",
        realtorLender: "",
        searchMode: "",
        realtorLenderValue: "",
        startDate: "",
        startTime: "",
        typeOutcome: "",
        title: "",
    });

    const [outcomeFub, setOutcomeFUB] = useState([]);
    const [typeOutcomeFUB, setTypeOutcomeFUB] = useState([]);
    const [statusSearchSlots, setStatusSearchSlots] = useState(false);
    const [verifyFreeSlots, setVerifyFreeSlots] = useState(false);
    const [availableTime, setAvailableTime] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [dataRealtorLender, setDataRealtorLender] = useState([]);

    const [selectOptions, setSelectOptions] = useState({
        leadType: [],
        legalStatus: [],
        apptPhase: [],
        apptLocation: [],
    });

    const realtorsFilteredBK = useMemo(
        () => context?.realtorsFilteredBK || [],
        [context?.realtorsFilteredBK]
    );

    const dataRealtorLenderCopy = useMemo(
        () => context?.dataRealtorLenderCopy || [],
        [context?.dataRealtorLenderCopy]
    );

    const FIELD_MAP = {
        216: "leadType",
        219: "legalStatus",
        277: "apptPhase",
        278: "apptLocation",
    };

    useEffect(() => {
        const loadFubData = async () => {
            try {
                const [outcomes, typeOutcome, dataAppt] = await Promise.all([
                    searchAppointmentOutcomeFUB(),
                    searchAppointmentTypeOutcomeFUB(),
                    getCustomFields("216,219,277,278"),
                ]);

                if (outcomes.success) {
                    setOutcomeFUB(outcomes.data.filter((item) => !/\d/.test(item.name)));
                }

                if (typeOutcome.success) {
                    setTypeOutcomeFUB(typeOutcome.data);
                }

                if (dataAppt) {
                    const options = {
                        leadType: [],
                        legalStatus: [],
                        apptPhase: [],
                        apptLocation: [],
                    };

                    dataAppt.forEach((field) => {
                        const key = FIELD_MAP[field.id];

                        if (key) {
                            options[key] = field.choices || [];
                        }
                    });

                    setSelectOptions(options);
                }
            } catch (error) {
                console.error("Error fetching FUB data:", error);
            }
        };

        loadFubData();
    }, []);

    const resetCalendarData = (next) => {
        next.searchMode = "";
        next.realtorLenderValue = "";
        next.startDate = "";
        next.startTime = "";
        next.typeOutcome = "";
        next.title = "";
    };
    const loadRealtors = async () => {
        console.log("SDOHJFOSD")
        try {
            //const data = await searchRealtors();

            setDataRealtorLender("data");
        } catch (e) {
            console.error(e);
        }
    };

    const loadLenders = async () => {
        try {
            //const data = await searchLenders();

            setDataRealtorLender("data");
        } catch (e) {
            console.error(e);
        }
    };

    const onFormChange = (key, value) => {
        setFormData((prev) => {
            const next = {
                ...prev,
                [key]: value,
            };

            if (key === "language") {
                next.leadType = "";
                next.clientQualify = "";
                next.typeCita = "";
                next.whereCita = "";
                next.address = "";
                next.realtorLender = "";
                resetCalendarData(next);
            }

            if (key === "leadType") {
                next.clientQualify = "";
                next.typeCita = "";
                next.whereCita = "";
                next.address = "";
                next.realtorLender = "";
                resetCalendarData(next);
            }

            if (key === "clientQualify") {
                next.typeCita = "";
                next.whereCita = "";
                next.realtorLender = "";
                resetCalendarData(next);
            }

            if (key === "typeCita") {
                next.whereCita = "";
                next.realtorLender = "";
                resetCalendarData(next);
            }

            if (key === "whereCita") {
                next.realtorLender = "";
                resetCalendarData(next);
            }

            if (key === "realtorLender") {
                resetCalendarData(next);

                setDataRealtorLender([]);

                if (value === "REALTOR") {
                    loadRealtors(); // tu función
                }

                if (value === "LENDER") {
                    loadLenders(); // tu función
                }
            }

            if (key === "searchMode") {
                next.realtorLenderValue = "";
                next.startDate = "";
                next.startTime = "";
                next.typeOutcome = "";
                next.title = "";
            }

            if (key === "realtorLenderValue") {
                next.startDate = "";
                next.startTime = "";
                next.typeOutcome = "";
                next.title = "";
            }

            if (key === "startDate") {
                next.startTime = "";
                next.typeOutcome = "";
                next.title = "";
            }

            if (key === "startTime") {
                next.typeOutcome = "";
                next.title = "";
            }

            if (key === "typeOutcome") {
                next.title = "";
            }

            return next;
        });
    };

    const isSeller = formData.leadType?.includes("Seller");
    const isPersonalRent = formData.leadType === "Personal Rent";

    const showLegalStatus = formData.leadType && !isSeller;

    const showApptFields =
        formData.leadType &&
        !isPersonalRent &&
        (isSeller || formData.clientQualify);

    const showAddress = isSeller && formData.whereCita;

    const showMeetingWith =
        formData.leadType && (isPersonalRent || formData.whereCita);

    const filteredTypeOutcomeFUB = typeOutcomeFUB.filter((item) => {
        const name = item.name || "";

        if (isPersonalRent) {
            return name.includes("10");
        }

        if (formData.realtorLender === "REALTOR") {
            return (
                name.includes("REALTOR") ||
                name.includes("FOLLOW") ||
                name.includes("PERSONAL")
            );
        }

        if (formData.realtorLender === "LENDER") {
            return (
                (name.includes("LENDER") || name.includes("FOLLOW")) &&
                !name.includes("REALTOR")
            );
        }

        return true;
    });

    const getCalendarLocationFilter = (whereCita) => {
        switch (whereCita) {
            case "Office Appt":
                return "office";
            case "Phone Appt":
                return "phone";
            case "Meeting Address Appt":
                return "address";
            default:
                return "office";
        }
    };

    const getShortName = (fullName) => {
        const parts = fullName.trim().split(" ");
        return `${parts[0]}-${parts[1]}`;
    };

    const buildCalendarName = ({ name, whereCita, leadType }) => {
        if (leadType === "Personal Rent") {
            return "RENTA JUAN CARLOS";
        }

        return `${getShortName(name)}-${getCalendarLocationFilter(whereCita)}`;
    };

    const buildCalendarNameList = ({
        realtorLender,
        whereCita,
        realtorsFilteredBK,
        dataRealtorLenderCopy,
    }) => {
        const sourceList =
            realtorLender === "LENDER" ? dataRealtorLenderCopy : realtorsFilteredBK;

        return sourceList.map((item) => {
            return `${getShortName(item)}-${getCalendarLocationFilter(whereCita)}`;
        });
    };

    const convertHoursTo12 = (horas24 = []) => {
        return horas24.map((hora) => {
            const [hhStr, mm] = hora.split(":");
            let hh = parseInt(hhStr, 10);
            const ampm = hh >= 12 ? "PM" : "AM";

            hh = hh % 12;
            if (hh === 0) hh = 12;

            return `${hh.toString().padStart(2, "0")}:${mm} ${ampm}`;
        });
    };


    useEffect(() => {
        if (formData.searchMode !== "specificDate") return;

        if (!formData.startDate) {
            setAvailableTime([]);
            return;
        }

        setAvailableTime(DEFAULT_AVAILABLE_TIME);
    }, [formData.searchMode, formData.startDate]);

    const verifyCalendarFreeSlots = async () => {
        const {
            startDate,
            whereCita,
            realtorLenderValue,
            startTime,
            realtorLender,
            leadType,
            searchMode,
        } = formData;

        if (!searchMode || !startDate) return;

        if (searchMode === "person" && (!realtorLenderValue || !whereCita)) return;

        if (
            searchMode === "specificDate" &&
            (!realtorLender || !whereCita || !startTime)
        ) {
            return;
        }

        const startDateTime = moment
            .tz(`${startDate}T00:00:00`, "America/Los_Angeles")
            .valueOf();

        const endDateTime = moment
            .tz(`${startDate}T23:59:59.999`, "America/Los_Angeles")
            .valueOf();

        setStatusSearchSlots(true);
        setVerifyFreeSlots(true);

        try {
            if (searchMode === "person") {
                const calendarName = buildCalendarName({
                    name: realtorLenderValue,
                    whereCita,
                    leadType,
                });

                const response = await fetch(
                    `${servidor_n8n}/webhook/5fd00b45-df51-49a7-8a0c-c1bfc13a1237`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            calendarName,
                            startDate: startDateTime,
                            endDate: endDateTime,
                            start: startDate,
                        }),
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error(errorData.message || `HTTP error: ${response.status}`);
                    setAvailableSlots([]);
                    setAvailableTime([]);
                    return;
                }

                const result = await response.json().catch(() => []);
                const horas24 = result?.[0]?.horas || [];
                const horas12 = convertHoursTo12(horas24);

                setAvailableTime(horas12);
                setAvailableSlots(horas12);

                return;
            }
            if (searchMode === "specificDate") {
                const calendarNameList = buildCalendarNameList({
                    realtorLender,
                    whereCita,
                    realtorsFilteredBK,
                    dataRealtorLenderCopy,
                });

                const timetoCompare = convertTo24Hour(startTime);

                const response = await fetch(
                    `${servidor_n8n}/webhook/aed81a3d-e329-4ff4-9945-72681b9267f6`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            calendarNameList,
                            startDate: startDateTime,
                            endDate: endDateTime,
                            start: startDate,
                        }),
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error(errorData.message || `HTTP error: ${response.status}`);
                    setAvailableSlots([]);
                    setDataRealtorLender([]);
                    return;
                }

                const result = await response.json().catch(() => []);

                const filtered = result.filter((cal) =>
                    cal.horas?.includes(timetoCompare)
                );

                const nombres = filtered.map((cal) => {
                    const partes = cal.calendarName.split("-");
                    const nombreApellido = partes.slice(0, 2).join(" ");

                    if (realtorLender === "LENDER") {
                        return `${nombreApellido} (Lender)`;
                    }

                    return `${nombreApellido} (Realtor)`;
                });

                setAvailableSlots(nombres);
                setDataRealtorLender(nombres);

                return;
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setAvailableSlots([]);
        } finally {
            setVerifyFreeSlots(false);
            setStatusSearchSlots(false);
        }
    };

    useEffect(() => {
        if (!formData.searchMode) return;

        if (formData.searchMode === "person") {
            if (!formData.realtorLenderValue || !formData.startDate) return;
        }

        if (formData.searchMode === "specificDate") {
            if (!formData.startDate || !formData.startTime) return;
        }

        verifyCalendarFreeSlots();
    }, [
        formData.searchMode,
        formData.realtorLender,
        formData.realtorLenderValue,
        formData.whereCita,
        formData.startDate,
        formData.startTime,
    ]);

    const handleSave = () => {
        console.log("Salvando Data", formData);
    };

    return (
        <form
            className="row w-100 m-auto bg-info p-0 was-validated"
            lang="en"
            onSubmit={(e) => {
                e.preventDefault();
                handleSave();
            }}
        >
            <div className="col-12">
                <b>Language</b>
                <select
                    className="form-select form-select-sm"
                    value={formData.language}
                    onChange={(e) => onFormChange("language", e.target.value)}
                    required
                >
                    <option value="">EMPTY</option>
                    <option disabled>----------</option>
                    <option value="Spanish">Spanish</option>
                    <option value="English">English</option>
                </select>
            </div>

            {formData.language && (
                <div className="col-12">
                    <b>Lead Type</b>
                    <select
                        className="form-select form-select-sm"
                        value={formData.leadType}
                        onChange={(e) => onFormChange("leadType", e.target.value)}
                        required
                    >
                        <option value="">EMPTY</option>
                        <option disabled>----------</option>
                        {selectOptions.leadType.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {showLegalStatus && (
                <div className="col-12">
                    <b>Legal Status</b>
                    <select
                        className="form-select form-select-sm"
                        value={formData.clientQualify}
                        onChange={(e) => onFormChange("clientQualify", e.target.value)}
                        required
                    >
                        <option value="">EMPTY</option>
                        <option disabled>----------</option>
                        {selectOptions.legalStatus.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {showApptFields && (
                <>
                    <div className="col-12">
                        <b>Appt Phase</b>
                        <select
                            className="form-select form-select-sm"
                            value={formData.typeCita}
                            onChange={(e) => onFormChange("typeCita", e.target.value)}
                            required
                        >
                            <option value="">EMPTY</option>
                            <option disabled>----------</option>
                            {selectOptions.apptPhase.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    {formData.typeCita && (
                        <div className="col-12">
                            <b>Appt Location</b>
                            <select
                                className="form-select form-select-sm"
                                value={formData.whereCita}
                                onChange={(e) => onFormChange("whereCita", e.target.value)}
                                required
                            >
                                <option value="">EMPTY</option>
                                <option disabled>----------</option>
                                {selectOptions.apptLocation.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </>
            )}

            {isPersonalRent && (
                <div className="col-12">
                    <b>Appt Location</b>
                    <select
                        className="form-select form-select-sm"
                        value={formData.whereCita}
                        onChange={(e) => onFormChange("whereCita", e.target.value)}
                        required
                    >
                        <option value="">EMPTY</option>
                        <option disabled>----------</option>
                        {selectOptions.apptLocation.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {showAddress && (
                <div className="col-12">
                    <b>Seller address</b>
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="address"
                        value={formData.address}
                        onChange={(e) => onFormChange("address", e.target.value)}
                    />
                </div>
            )}

            {showMeetingWith && (
                <div className="col-12">
                    <b>Meeting with</b>
                    <select
                        className="form-select form-select-sm"
                        value={formData.realtorLender}
                        onChange={(e) => onFormChange("realtorLender", e.target.value)}
                        required
                    >
                        <option value="">EMPTY</option>
                        <option disabled>----------</option>
                        <option value="REALTOR">REALTOR</option>
                        {!isPersonalRent && <option value="LENDER">LENDER</option>}
                    </select>
                </div>
            )}

            {formData.realtorLender && (
                <>
                    <div className="col-12 border border-bottom border-2 border-black my-2"></div>

                    <div className="row w-100 m-auto">
                        <div className="col-12 text-center mb-2">
                            <strong>Search By</strong>
                        </div>

                        <div className="col-6">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="searchMode"
                                    id="specificDate"
                                    value="specificDate"
                                    checked={formData.searchMode === "specificDate"}
                                    onChange={(e) => onFormChange("searchMode", e.target.value)}
                                />
                                <label className="form-check-label" htmlFor="specificDate">
                                    Specific Date
                                </label>
                            </div>
                        </div>

                        <div className="col-6">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="searchMode"
                                    id="person"
                                    value="person"
                                    checked={formData.searchMode === "person"}
                                    onChange={(e) => onFormChange("searchMode", e.target.value)}
                                />
                                <label className="form-check-label" htmlFor="person">
                                    Lender / Realtor
                                </label>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {formData.searchMode === "person" && (
                <>
                    <div className="col-12">
                        <b>Name of Realtor/Lender</b>
                        <select
                            className="form-select form-select-sm"
                            value={formData.realtorLenderValue}
                            onChange={(e) =>
                                onFormChange("realtorLenderValue", e.target.value)
                            }
                            required
                            disabled={statusSearchSlots}
                        >
                            <option value="">EMPTY</option>
                            <option disabled>----------</option>
                            {dataRealtorLender.map((item) => {
                                if (isPersonalRent && !item.includes("Juan Carlos Carrera")) {
                                    return null;
                                }

                                return (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {formData.realtorLenderValue && (
                        <div className="col-6">
                            <b>Date</b>
                            <input
                                type="date"
                                className="form-control form-control-sm"
                                value={formData.startDate}
                                onChange={(e) => onFormChange("startDate", e.target.value)}
                                required
                                disabled={statusSearchSlots}
                            />
                        </div>
                    )}

                    {formData.startDate && (
                        <div className="col-6">
                            <b>Time</b>
                            <select
                                className="form-select form-select-sm"
                                value={formData.startTime}
                                onChange={(e) => onFormChange("startTime", e.target.value)}
                                required
                                disabled={statusSearchSlots}
                            >
                                <option value="">EMPTY</option>
                                <option disabled>----------</option>
                                {availableTime.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </>
            )}

            {formData.searchMode === "specificDate" && (
                <>
                    <div className="col-6">
                        <b>Date</b>
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            value={formData.startDate}
                            onChange={(e) => onFormChange("startDate", e.target.value)}
                            required
                            disabled={statusSearchSlots}
                        />
                    </div>

                    {formData.startDate && (
                        <div className="col-6">
                            <b>Time</b>
                            <select
                                className="form-select form-select-sm"
                                value={formData.startTime}
                                onChange={(e) => onFormChange("startTime", e.target.value)}
                                required
                                disabled={statusSearchSlots}
                            >
                                <option value="">EMPTY</option>
                                <option disabled>----------</option>
                                {availableTime.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {formData.startDate && formData.startTime && (
                        <div className="col-12">
                            <b>Name of Realtor/Lender</b>
                            <select
                                className="form-select form-select-sm"
                                value={formData.realtorLenderValue}
                                onChange={(e) =>
                                    onFormChange("realtorLenderValue", e.target.value)
                                }
                                required
                                disabled={statusSearchSlots}
                            >
                                <option value="">EMPTY</option>
                                <option disabled>----------</option>
                                {dataRealtorLender.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </>
            )}

            {verifyFreeSlots && (
                <div className="col-12 m-1">
                    <div className="bg-warning text-center p-1 rounded-1">
                        <b>Verifying Slots Wait</b>
                    </div>
                </div>
            )}

            {!verifyFreeSlots &&
                availableSlots.length === 0 &&
                formData.searchMode === "specificDate" &&
                formData.startDate &&
                formData.startTime && (
                    <div className="col-12 bg-danger text-center p-1 rounded-1 text-white fw-bold m-1">
                        No Available Slots
                    </div>
                )}

            {!verifyFreeSlots &&
                availableSlots.length === 0 &&
                formData.searchMode === "person" &&
                formData.realtorLenderValue &&
                formData.startDate && (
                    <div className="col-12 bg-danger text-center p-1 rounded-1 text-white fw-bold m-1">
                        No Available Slots
                    </div>
                )}

            {!verifyFreeSlots && availableSlots.length > 0 && (
                <div className="col-12 mb-1">
                    <div className="border rounded-3 p-2 bg-light">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="fw-semibold text-primary small">
                                Available Slots Calendar
                            </span>
                            <span className="badge bg-primary rounded-pill">
                                {availableSlots.length}
                            </span>
                        </div>

                        <div className="d-flex flex-wrap gap-1">
                            {availableSlots.map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary py-0 px-2 rounded-pill"
                                    style={{ fontSize: "11px", lineHeight: "20px" }}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {formData.startDate &&
                formData.startTime &&
                formData.realtorLenderValue && (
                    <div className="col-12">
                        <b>Appt With/Where</b>
                        <select
                            className="form-select form-select-sm"
                            value={formData.typeOutcome}
                            onChange={(e) => onFormChange("typeOutcome", e.target.value)}
                            required
                        >
                            <option value="">No Type</option>
                            <option disabled>----------</option>
                            {filteredTypeOutcomeFUB.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

            {formData.typeOutcome && (
                <div className="col-12 mt-3">
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Title"
                        value={formData.title}
                        onChange={(e) => onFormChange("title", e.target.value)}
                        required
                    />
                </div>
            )}

            <button type="submit" className="btn btn-primary btn-sm mt-2">
                Save
            </button>
        </form>
    );
};