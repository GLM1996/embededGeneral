import React, { useState, useEffect } from "react";
import ProcessCita from "./ProcessCita";
import { useAppContext } from "../../context/AppContext";
import Card from "./Card";
import { searchAppointmentFUB, getCaptacionPeopleMongo } from "../../config/funciones";

export default function ListarApptStatus({ personFilter }) {

    const [appointmentFUB, setAppointmentFUB] = useState([]);
    const [showCita, setShowCita] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState("")
    const [loading, setLoading] = useState(true)
    const { person } = useAppContext()
    const [captacionMongo, setCaptacionMongo] = useState(null)
    const [lastCita, setLastCita] = useState(null)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 2; // Cambia a 10 o lo que prefieras

    const handleSelectAppt = (appt) => {
        setSelectedAppointment(appt)
        setShowCita(true)
    }

    const handleBack = () => {
        setSelectedAppointment("")
        setShowCita(false)
    }

    const fetchData = async () => {
        if (person) {
            try {
                const appointments = await (searchAppointmentFUB(person.id));
                if (appointments.success) {
                    setAppointmentFUB(appointments.data);
                } else {
                    setAppointmentFUB([]);
                }
                //setCaptacionMongo(captacionMongo)
                setCaptacionMongo(personFilter)
                const last = appointments.data[0]
                setLastCita(last ? last : null)
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false)
            }
        }
    };

    useEffect(() => {
        fetchData();
    }, [person]); // Dependencia más específica

    if (loading) {
        return (
            <div className="d-flex justify-content-center">
                <b className="fs-5">Cargando...</b>
            </div>
        );
    }

    if (appointmentFUB.length === 0 && !loading) {
        return (
            <div className="d-flex justify-content-center">
                <b className="fs-5">No hay Appt</b>
            </div>
        );
    }

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = appointmentFUB.slice(indexOfFirstItem, indexOfLastItem);

    const totalPages = Math.ceil(appointmentFUB.length / itemsPerPage);

    return (
        <div className="row w-100 m-auto p-0">
            <div className='d-flex justify-content-center mb-1'>
                <b className='fs-5 border-bottom border-2 border-black'>APPT FOLLOW UP STATUS</b>
            </div>
            {!showCita ? (
                <>
                    {currentItems.map((item, index) => (
                        <Card key={index} item={item} handleSelectAppt={handleSelectAppt} />
                    ))}

                    {/* Paginación */}
                    {appointmentFUB.length > itemsPerPage && (
                        <div className="d-flex justify-content-center mt-3">
                            <nav>
                                <ul className="pagination">
                                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                        <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
                                            Anterior
                                        </button>
                                    </li>

                                    {[...Array(totalPages)].map((_, index) => (
                                        <li
                                            key={index}
                                            className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
                                        >
                                            <button className="page-link" onClick={() => handlePageChange(index + 1)}>
                                                {index + 1}
                                            </button>
                                        </li>
                                    ))}

                                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                                        <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
                                            Siguiente
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    )}
                </>
            ) : (
                <ProcessCita appointment={selectedAppointment} handleBack={handleBack} lastCita={lastCita} personFilter={captacionMongo} />
            )}

        </div>
    );
}
