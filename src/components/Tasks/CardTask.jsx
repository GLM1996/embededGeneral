import React, { useEffect, useState } from 'react'
import { ajustarFechaUtcModify } from '../../config/utils'
import { completeTask, putStage } from '../../config/funciones'
import { toast } from 'react-toastify'
import { useAppContext } from '../../context/AppContext';

export default function CardTask({ item, onClick, onReload }) {
    const { person, context } = useAppContext();
    const [completed, setCompleted] = useState(false)

    useEffect(() => {
        setCompleted(item.isCompleted === 1)
    }, [item])

    const getIcon = () => {
        switch (item.type) {
            case "Follow Up":
                return <i className="bi bi-reply-fill me-2 icon-follow"></i>
            case "Call":
                return <i className="bi bi-telephone-fill text-success me-2"></i>
            case "Thank You":
                return <i className="bi bi-heart-fill text-danger me-2"></i>
            default:
                return null
        }
    }

    const handleItem = () => {
        onClick(item)
    }

    const handleComplete = async () => {
        try {
            let value = true
            if (item.isCompleted === 0) {
                value = true
            } else {
                value = false
            }
            const result = await completeTask(item.id, value);
            toast.success("Task completed successfully", { position: "top-right", autoClose: 3000 });
            let data = {
                personId: person.id,
            }
            if (item.type === "Thank You") {
                data.customVAPromiseToCallOrApptReminder = ""
            } else {
                if (item.type === "Call") {
                    data.customVANextContactDay3M = ""
                } else {
                    if (item.type === "Follow Up")
                        data.customVAApptFollow = ""
                }
            }

            const updatePerson = await putStage(data);
            if (updatePerson.success) {
                toast.success("People actualizada", {
                    position: "top-right",
                    autoClose: 2000,
                });
            }

            onReload()
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className="d-flex shadow m-1 rounded-2 align-items-start p-2" >
            {/* Checkbox */}
            <div className="me-2">
                <input
                    type="checkbox"
                    className="form-check-input"
                    style={{ width: "20px", height: "20px", marginTop: "0.25rem" }}
                    checked={completed}
                    onChange={handleComplete}
                />
            </div>

            {/* Contenido */}
            <div className="flex-grow-1 d-flex flex-column px-1 task-card" onClick={handleItem} >
                <b className='d-flex align-items-center'>{getIcon()}{item.name}</b>
                <b className="mt-1">
                    <i className="bi bi-clock me-2"></i>
                    {ajustarFechaUtcModify(item.dueDateTime)}
                </b>
                <b className="mt-1">
                    <i className="bi bi-person me-2"></i>
                    {item.AssignedTo}
                </b>
            </div>
        </div>
    )
}
