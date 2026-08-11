import React, { useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import FilasSummary from "../FilasSummary";
import { ajustarFechaUtcModify, formatearFecha } from "../../config/utils";
import { useAppContext } from '../../context/AppContext';

export default function CardAppt({ item, handleSelectAppt }) {

    const [show, setShow] = useState(false);
    const [currentItem, setCurrentItem] = useState(item);
    const { person, context, isLoading, error } = useAppContext();


    const showData = (item) => {
        setShow(!show);
    };
  

    // Renderizado condicional (solo muestra el contenedor si hay item)

    return (
        <div className="row w-100 m-auto">
            {currentItem && (
                <div className="col-12 card small p-1 mb-1 border border-3 border-black rounded-1 mb-2">
                    <div className="d-flex justify-content-between align-items-center border-bottom border-2 border-black bg-info flex-wrap gap-2">
                        <div className="d-flex flex-wrap align-items-center">
                            <b className="fs-6 text-center">
                                {item.title || "EMPTY"}
                            </b>
                        </div>
                        <div className="d-flex justify-content-center align-items-center gap-1 x-small mb-1">
                            <i
                                className="bi bi-pencil-fill itemBtn bg-success rounded-1 px-1"
                                onClick={() => handleSelectAppt(item)}
                            ></i>                            
                        </div>
                    </div>
                    <b className="fs-6">Appt Type: {item.type || ""}</b>
                    <b className="fs-6">Appt Outcome: {item.outcome || ""}</b>
                    <b className="fs-6">Appt Date: {ajustarFechaUtcModify(new Date(item.start))}</b>
                    <b className="fs-6">Agent: {person?.assignedTo}</b>
                </div>
            )
            }
        </div>
    );
}
