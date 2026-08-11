import React, { useState, useEffect, useRef } from "react";
import { searchAppointmentFUB, deleteAppointment } from "../../config/funciones";
import NewAppontment from "./NewAppontment";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { ajustarFechaUtcModify, servidor_n8n } from "../../config/utils";
import { useAppContext } from '../../context/AppContext';
import { ViewAppt } from "./ViewAppt";
import { Form } from "./Form";

export default function ListarAppt({ lastCita }) {

  const [appointmentFUB, setAppointmentFUB] = useState([]);
  const [appointmentMongo, setAppointmentMongo] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAppt, setShowAppt] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const { person, context, isLoading, error } = useAppContext();
  const [lastAppt, setLastAppt] = useState()
  const [showViewAppt, setShowViewAppt] = useState(false)

  const contextRef = useRef(context);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const contexto = contextRef.current;

  const fetchData = async () => {
    try {
      const appointments = await searchAppointmentFUB(contexto.person.id);
      //const apptMongo = await getAppointmentMongo(contexto.person.id)
      console.log(appointments)

      if (appointments.success) {
        setAppointmentFUB(appointments.data);
        // Resetear la selección cuando se actualiza la lista
        setSelectedAppt("");
        setLastAppt(appointments.data[0])
        setRefreshKey((prev) => prev + 1);
      } else {
        setAppointmentFUB([]);
      }

      /*if (apptMongo) {
        setAppointmentMongo(apptMongo);
      } else {
        setAppointmentMongo([]);
      }*/
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [contexto, reloadKey]); // Dependencia más específica

  const handleSelectAppt = (appt) => {
    setShowAppt(false);
    setSelectedAppt(appt);
    setRefreshKey((prev) => prev + 1); // Forzar actualización del hijo
  };

  const handleBack = () => {
    setShowAppt(true);
    setSelectedAppt("");
    setRefreshKey((prev) => prev + 1); // Forzar actualización del hijo
    fetchData(); // Llamar nuevamente a la función de carga
  };

  const handleDelete = async (apptId) => {
    const result = await Swal.fire({
      title: "Delete appt?",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      backdrop: "rgba(0,0,0,0.4)",
      customClass: {
        popup: "custom-swal-popup", // Clase para el contenedor principal
        title: "custom-swal-title", // Clase para el título
        actions: "custom-swal-actions", // Clase para los botones
      },
    });

    if (result.isConfirmed) {
      setAppointmentFUB(appointmentFUB.filter(item => item.id !== apptId))
      try {
        const urlNew = `${servidor_n8n}/webhook/5d822c56-1a7c-4ba5-bc6e-c5029cf0097b` //Nombre en N8N --> Appt Canceled
        const dataN8n = {
          apptId: apptId
        }
        const options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // "Authorization": `Bearer ${token}`, // Descomenta si necesitas autenticación
          },
          //Eddie-Morales-Phone
          body: JSON.stringify(dataN8n),
        };
        await fetch(urlNew, options)
        toast.success("Appt canceled correctamente");

        await delay(2000);
        await deleteAppointment(apptId);

        setReloadKey((prev) => prev + 1);
        toast.success("Appt eliminado correctamente");
      } catch (error) {
        toast.error("Error al eliminar la cita");
      }
    }
  };

  if (appointmentFUB.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <b className="fs-5">No hay Appt</b>
      </div>
    );
  }

// return(
//   <Form/>
// )
  return (
    <>
      <div className="w-100 m-auto p-2" style={{ height: 500 }}>
        {showAppt ? (
          <div className="d-flex flex-column h-100">
            <div className="text-center border-bottom pb-2 mb-2">
              <b className="fs-5">Past Appointments</b>
            </div>

            <div
              className="d-flex flex-column gap-2 overflow-auto pe-1"
              style={{ flex: 1 }}
            >
              {appointmentFUB.length > 0 ? (
                appointmentFUB.map((item, index) => (
                  <div
                    className="card shadow-sm border border-2 border-dark rounded-2"
                    key={item.id || index}
                  >
                    <div className="card-header bg-info d-flex justify-content-between align-items-center gap-2">
                      <b className="fs-6 text-truncate">
                        {item.title || "EMPTY"}
                      </b>

                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-primary btn-sm py-0 px-2"
                          onClick={() => {
                            setSelectedAppt(item);
                            setShowViewAppt(true);
                          }}
                        >
                          <i className="bi bi-eye-fill"></i>
                        </button>
                        <button
                          className="btn btn-success btn-sm py-0 px-2"
                          onClick={() => {
                            setSelectedAppt(item)
                            setShowAppt(false)
                          }}
                        >
                          <i className="bi bi-pencil-fill"></i>
                        </button>

                        <button
                          className="btn btn-danger btn-sm py-0 px-2"
                          onClick={() => handleDelete(item.id)}
                        >
                          <i className="bi bi-trash-fill"></i>
                        </button>
                      </div>
                    </div>

                    <div className="card-body p-2 small">
                      <div><b>Type:</b> {item.type || "—"}</div>
                      <div><b>Outcome:</b> {item.outcome || "—"}</div>
                      <div>
                        <b>Date:</b>{" "}
                        {item.start
                          ? ajustarFechaUtcModify(new Date(item.start))
                          : "—"}
                      </div>
                      <div><b>Agent:</b> {person?.assignedTo || "—"}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted mt-4">
                  No past appointments found.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="d-flex flex-column h-100">
            <button
              className="btn btn-primary my-1 align-self-start"
              onClick={handleBack}
            >
              <i className="bi bi-arrow-left"></i> Back
            </button>

            <div className="overflow-auto" style={{ flex: 1 }}>
              <NewAppontment
                key={`new-appt-${refreshKey}`}
                context={context}
                data={selectedAppt}
                lastAppt={lastAppt}
              />
            </div>
          </div>
        )}
      </div>

      {showViewAppt && (
        <ViewAppt
          item={selectedAppt}
          onclose={() => setShowViewAppt(false)}
        />
      )}
    </>
  );
}
