import React, { useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import FilasSummary from "./FilasSummary";
import { ajustarFechaUtcModify, formatearFecha } from "../config/utils";
import { deletePersonCitaMongo } from "../config/funciones";

export default function CardCita({ item, context }) {

  const [show, setShow] = useState(false);
  const [currentItem, setCurrentItem] = useState(item);

  const showData = (item) => {
    setShow(!show);
  };

  const handleDelete = async (apptId) => {
    const result = await Swal.fire({
      title: "¿Eliminar Cita?",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      backdrop: "rgba(0,0,0,0.4)",
      customClass: {
        popup: "custom-swal-popup", // Clase para el contenedor principal
        title: "custom-swal-title", // Clase para el título
        actions: "custom-swal-actions", // Clase para los botones
      },
    });
    if (result.isConfirmed) {
      try {
        await deletePersonCitaMongo(context.person.id, apptId);
        setCurrentItem(null);
        toast.success("Cita eliminada correctamente", {
          position: "top-right",
          autoClose: 2000,
        });
      } catch (error) {
        toast.error("Error al eliminar la cita", {
          position: "top-right",
        });
      } finally {
        // Método 1: Recarga simple (mantiene la caché)
        window.location.reload();
      }
    }
  };
  const handleEdit = async (item) => {
    console.log('Editando: ', item.apptId)
  }

  // Renderizado condicional (solo muestra el contenedor si hay item)

  return (
    <>
      {currentItem && (
        <div
          className="col-12 card small p-1 mb-1"
        >
          <div className="d-flex justify-content-between align-items-center border-bottom border-2 border-black position-relative pb-2">
            {/* Contenido principal */}
            <div className="d-flex justify-content-center align-items-center">
              <b className="ms-2 text-center text-uppercase">
                Appt name: {currentItem.appointmentName || "EMPTY"}
              </b>
              <b className="ms-2 text-center badge bg-primary">
                Agent: {currentItem.vaName || "EMPTY"}
              </b>
            </div>

            {/* Contenedor de iconos - posición corregida */}
            <div className="d-flex justify-content-center align-items-center gap-1 x-small position-absolute end-0 top-50 translate-middle-y">
              <i
                className="bi bi-eye-fill itemBtn bg-success rounded-1 px-1"
                onClick={() => showData(currentItem)}
              ></i>

              {<i
                className="bi bi-trash-fill itemBtn bg-danger rounded-1 px-1"
                onClick={() => handleDelete(currentItem.appointmentId)}
              ></i>}
            </div>
          </div>

          {show && (
            <>
              <FilasSummary label={"Appt Name"} valor={item.appointmentName} />
              <FilasSummary label={"Appt Date"} valor={ajustarFechaUtcModify(item.created)} />
              <FilasSummary label={"Appt Classifications"} valor={item.typeAppt} />
              <FilasSummary label={"Appt Type"} valor={item.appointmentType} />
              <FilasSummary label={"Appt Outcome"} valor={item.appointmentOutcome} />
              <FilasSummary label={"Meeting with"} valor={item.realtorOrLenderName} />
              <FilasSummary label={"Appt Attendance"} valor={item.attendance} />
              {/* APPT Not Attended */}
              {item?.attendance === "Appt NOT Attended" && (
                <>
                  <FilasSummary label={"No Show Reason"} valor={item?.typeProblems} />
                  <FilasSummary label={item?.typeProblems} valor={item?.problem} />
                </>
              )}
              {/* APPT Attended */}
              {item?.attendance === "Appt Attended" && (
                <>
                  <FilasSummary label={"Appt Result"} valor={item?.results} />
                  {item?.results === "Client Pending Action" && (
                    <>
                      <FilasSummary label={"Last Pending Action"} valor={item?.pending} />
                      <FilasSummary label={"Pending Action Date Created"} valor={formatearFecha(new Date(item?.created.slice(0, 10)))} />
                      <FilasSummary label={"Pending Action Date"} valor={formatearFecha(new Date(item?.datePending.slice(0, 10)))} />
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div >
      )
      }
    </>
  );
}
