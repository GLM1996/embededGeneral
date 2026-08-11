import React, { useState, useEffect, useRef } from "react";
import { searchAppointmentFUB, deleteAppointment } from "../config/funciones";
import NewAppontment from "./NewAppontment";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import CardAppt from "./CardAppt";
import ProcessCita from "./ProcessCita";

export default function ListarApptStatus({ context, handleFormData, person, personFilter }) {

    const [appointmentFUB, setAppointmentFUB] = useState([]);
    const [showCita, setShowCita] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState("")
    const [lastCita,setLastCita] = useState("")

    const handleSelectAppt = (appt) => {
        setSelectedAppointment(appt)
        setShowCita(true)
    }
    
    const handleBack = () => {
        setSelectedAppointment("")
        setShowCita(false)
    }   

    const contextRef = useRef(context);

    const contexto = contextRef.current;

    const fetchData = async () => {
        if (contexto?.person?.id) {
            try {
                const appointments = await searchAppointmentFUB(contexto.person.id);

                if (appointments.success) {
                    setAppointmentFUB(appointments.data);
                    setLastCita(appointments.data[0])
                    // Resetear la selección cuando se actualiza la lista             

                } else {
                    setAppointmentFUB([]);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }
    };

    useEffect(() => {
        fetchData();
    }, [contexto]); // Dependencia más específica

    if (appointmentFUB.length === 0) {
        return (
            <div className="d-flex justify-content-center">
                <b className="fs-5">No hay Appt</b>
            </div>
        );
    }
    
    return (
        <div className="row w-100 m-auto p-0">
            <div className='d-flex justify-content-center mb-1'>
                <b className='fs-5 border-bottom border-2 border-black'>APPT FOLLOW UP STATUS</b>
            </div>
            {!showCita ? (
                <>
                    {
                        appointmentFUB.map((item, index) => (
                            <CardAppt key={index} item={item} handleSelectAppt={handleSelectAppt} />
                        ))
                    }
                </>
            ) : (
                <ProcessCita context={context} appointment={selectedAppointment} handleBack={handleBack} handleForm={handleFormData} person={person} personFilter={personFilter} lastCita={lastCita}/>
            )}
        </div>
    );
}
