import React, { useEffect, useState } from "react";

export default function ProgressBar({ value, total }) {
    
    function getColor() {        
        if (value <= 5) {
            return "text-bg-danger"; // rojo
        } else if (value > 5 && value <= 9) {
            return "text-bg-primary"; // amarillo
        } else {
            return "text-bg-success"; // verde
        }
    }

    return (
        <div
            className="progress px-0 my-2"
            role="progressbar"
            style={{ height: "1.5rem" }}
            aria-label="Success example"
            aria-valuenow={value}
            aria-valuemin="0"
            aria-valuemax={total}
        >
            <div
                className={`progress-bar progress-bar-striped progress-bar-animated ${getColor()}`}
                style={{ width: `${(value / total) * 100}%`, fontSize: value / total * 100 < 8 ? "0.8rem" : "1rem" }}

            >
                {value ? value + "/" + total : ""}

            </div>
        </div>
    );
}
