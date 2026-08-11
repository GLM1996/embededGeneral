import React, { useEffect, useState } from "react";
import { servidorNew } from "../../config/utils";
import { ajustarFechaUtcModify } from "../../config/utils";

export const ViewAppt = ({ onclose, item }) => {
    const [apptMongoDB, setApptMongoDB] = useState(null);
    const [loading, setLoading] = useState(false);

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    const formatValue = (value) => {
        if (value === null || value === undefined || value === "") return "-";

        if (typeof value === "boolean") {
            return value ? "Yes" : "No";
        }

        if (Array.isArray(value)) {
            return value.length;
        }

        return String(value);
    };

    async function fetchApptMongo() {
        try {
            setLoading(true);

            const url = `${servidorNew}/api/appts/${item.id}`;

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-type": "application/json",
                },
            });

            const result = await response.json();

            setApptMongoDB(result);
        } catch (error) {
            console.error("Error fetching appointment:", error);
            // toast.error("Error loading appointment data");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (item?.id) {
            fetchApptMongo();
        }
    }, [item?.id]);
   
    const rows = [
        ["Title", item?.title],
        ["Type", item?.type],
        ["Outcome", item?.outcome],
        ["Start", ajustarFechaUtcModify(item?.start)],
        //["Invitees", item?.invitees?.length],
        // Mongo
        ["Locations", apptMongoDB?.whereAppt],
        ["Classifications", apptMongoDB?.typeAppt],
        ["Meeting With", apptMongoDB?.realtorLender],
        ["Meeting With Name", apptMongoDB?.realtorLenderValue],
    ];

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center p-3"
            style={{
                background: "rgba(0,0,0,.5)",
                zIndex: 1050,
            }}
        >
            <div
                className="bg-white rounded-4 shadow-lg"
                style={{
                    width: "100%",
                    maxWidth: "850px",
                    maxHeight: "90vh",
                }}
            >
                {/* Header */}
                <div className="border-bottom p-3 d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="mb-0 fw-bold">
                            Appointment Details
                        </h5>
                        <small className="text-muted">
                            #{item?.id}
                        </small>
                    </div>

                    <button
                        type="button"
                        className="btn-close"
                        onClick={onclose}
                    />
                </div>

                {/* Body */}
                <div
                    className="p-3"
                    style={{
                        overflowY: "auto",
                        maxHeight: "70vh",
                    }}
                >
                    {loading && (
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <div
                                className="spinner-border spinner-border-sm"
                                role="status"
                            />
                            <span>Loading additional information...</span>
                        </div>
                    )}

                    <div className="table-responsive">
                        <table className="table table-striped table-hover align-middle mb-0">
                            <tbody>
                                {rows
                                    .filter(
                                        ([_, value]) =>
                                            value !== null &&
                                            value !== undefined &&
                                            value !== ""
                                    )
                                    .map(([label, value]) => (
                                        <tr key={label}>
                                            <td
                                                className="fw-semibold bg-light"
                                                style={{ width: "35%" }}
                                            >
                                                {label}
                                            </td>

                                            <td>
                                                {formatValue(value)}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-top p-3 text-end">
                    <button
                        className="btn btn-secondary"
                        onClick={onclose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};