import React from "react";

export default function Loading({ msg, error }) {
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 15, 15, 0.55)",
                backdropFilter: "blur(6px)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
                textAlign: "center",
            }}
        >
            {!error ? (
                <div className="spinner-border text-success" role="status"></div>
            ) : (
                <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: "2.6rem" }}></i>
            )}

            <div
                style={{
                    marginTop: "18px",
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    color: !error ? "#E8E8E8" : "#632121ff",
                }}
            >
                {!error ? "Processing Appointment..." : "ERROR"}
            </div>

            <div
                style={{
                    marginTop: "8px",
                    fontSize: "1.2rem",
                    color: !error ? "#d1d1d1" : "#632121ff",
                    maxWidth: "360px",
                    lineHeight: "1.4",
                }}
            >
                {msg}
            </div>
            {error && (
                <p className="mt-4 p-4 bg-warning border-2 border-danger border rounded-2">ERROR: {error}</p>
            )}
        </div>
    );
}
