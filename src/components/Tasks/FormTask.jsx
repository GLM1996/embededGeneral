import React, { useState, useEffect } from 'react'
import { createTask, deleteTask, editTask, getUsers, putStage } from '../../config/funciones';
import { useAppContext } from '../../context/AppContext';
import { toLosAngelesOffset } from '../../config/utils';
import { toast } from 'react-toastify';
import Swal from "sweetalert2";

export default function FormTask({ item }) {

  const [formData, setFormData] = useState({});
  const [user, setUser] = useState([])
  const { person, context } = useAppContext();
  const [statusbtn, setStatusbtn] = useState(false)

  const fetchUser = async () => {
    const data = await getUsers();
    console.log(data)
    setUser(data);
  }

  useEffect(() => {
    fetchUser();
    setFormData({ ...formData, type: "Follow Up", assignetTo: context.user.name });
  }, [])

  useEffect(() => {
    if (item) {
      const date = new Date(item.dueDateTime);
      // Fecha en zona horaria de Los Ángeles
      const optionsDate = {
        timeZone: "America/Los_Angeles",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      };
      const optionsTime = {
        timeZone: "America/Los_Angeles",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      };
      // Usamos Intl.DateTimeFormat para obtener la fecha
      const laDate = new Intl.DateTimeFormat("en-CA", optionsDate).format(date);
      // en-CA da formato YYYY-MM-DD (ejemplo: "2025-09-02")

      const laTime = new Intl.DateTimeFormat("en-GB", optionsTime).format(date);

      setFormData({
        ...formData,
        taskName: item.name,
        type: item.type,
        assignetTo: item.AssignedTo,
        dueDate: laDate,
        time: laTime
      })
    }
  }, [item])

  const handleSave = async () => {
    setStatusbtn(true)
    if (!item) {
      const dueDateTime = toLosAngelesOffset(formData.dueDate, formData.time);
      const data = {
        name: formData.taskName,
        type: formData.type,
        dueDateTime: dueDateTime,
        assignedTo: formData.assignetTo,
        personId: person.id,
      }
      try {
        const task = await createTask(data);
        console.log(task);
        toast.success("Task saved successfully", { position: "top-right", autoClose: 3000 });
      } catch (error) {
        console.log(error)
      }
    } else {
      const dueDateTime = toLosAngelesOffset(formData.dueDate, formData.time);
      const data = {
        name: formData.taskName,
        type: formData.type,
        dueDateTime: dueDateTime,
        assignedTo: formData.assignetTo,
        personId: person.id,
      }
      try {
        const task = await editTask(data, item.id);
        console.log(task);
        toast.success("Task update successfully", { position: "top-right", autoClose: 3000 });
      } catch (error) {
        console.log(error)
      }
    }
    let data = {
      personId: person.id,
    }
    if (formData.type === "Thank You") {
      data.customVAPromiseToCallOrApptReminder = formData.dueDate
    } else {
      if (formData.type === "Call") {
        data.customVANextContactDay3M = formData.dueDate
      } else {
        if (formData.type === "Follow Up")
          data.customVAApptFollow = formData.dueDate
      }
    }
    try {
      const updatePerson = await putStage(data);
      if (updatePerson.success) {
        toast.success("People actualizada", {
          position: "top-right",
          autoClose: 2000,
        });
      }
    }
    catch (error) {
      console.log(error);
    }
    setStatusbtn(false)
  }

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "¿Eliminar task?",
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
        // Aquí iría la lógica para eliminar la tarea usando item.id
        const result = await deleteTask(item.id);
        console.log(result);
        toast.success("Task deleted successfully", { position: "top-right", autoClose: 3000 });
      } catch (error) {
        console.log(error);
      }
    }
  }

  if (user.length === 0) return <div className='d-flex justify-content-center align-items-center p-4 bg-info'>Loading...</div>

  return (
    <form
      className="row w-100 m-auto bg-info p-0 was-validated"
      lang="en"
      onSubmit={(e) => {
        e.preventDefault(); // 👈 Evita la recarga
        handleSave(); // 👈 Tu función
      }}
    >
      <b className="text-center fs-5 mb-1">
        {!item ? "Create Task" : "Edit Task"}
      </b>
      {/* Task Name */}
      <div className="col-12 mt-3">
        <div className="input-group input-group-sm mb-1">
          <input
            type="text"
            className="form-control"
            placeholder="Task Name"
            value={formData?.taskName || ""}
            onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
            required
          />
        </div>
      </div>
      {/* Type Task */}
      <div className="col-12 mb-1">
        <select
          className="form-select form-select-sm"
          aria-label="Lead type select"
          name='taskName'
          value={formData?.type || ""}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        >
          <option value="Follow Up">Follow Up</option>
          <option value="Call">Call</option>
          <option value="Email">Email</option>
          <option value="Text">Text</option>
          <option value="Showing">Showing</option>
          <option value="Closing">Closing</option>
          <option value="Open House">Open House</option>
          <option value="Thank You">Thank You</option>
        </select>
      </div>
      {/* Assigned To */}
      <div className="col-12 mb-1">
        <select
          className="form-select form-select-sm"
          aria-label="Lead type select"
          name='assignedTo'
          value={formData?.assignetTo || ""}
          onChange={(e) => setFormData({ ...formData, assignetTo: e.target.value })}
        >
          {user.map((usr) => (
            <option key={usr.id} value={usr.name}>{usr.name}</option>
          ))}
        </select>
      </div>
      {/* Date Time */}
      <div className="col-12 d-flex mb-1">
        <div className='col-6'>
          <div className="input-group input-group-sm mb-1">
            <input
              type="date"
              className="form-control"
              placeholder="Date"
              value={formData?.dueDate || ""}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="col-6">
          <div className="input-group input-group-sm mb-1">
            <input
              type="time"
              className="form-control"
              placeholder="Task Name"
              value={formData?.time || ""}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            />
          </div>
        </div>
      </div>
      <div className='d-flex justify-content-around align-items-center my-1 '>
        {item && (
          <button
            type="button" // ❌ muy importante, sino disparará el submit
            className='btn btn-danger'
            onClick={() => handleDelete()}
          >Delete
          </button>
        )}
        <button
          type="submit" // el submit real sigue siendo este
          className='btn btn-success'
          disabled={statusbtn}
        >
          {(item && !statusbtn) ? "Edit" : (!item && !statusbtn) ? "Save" : (item && statusbtn) ? "Editing..." : "Saving..."}

        </button>
      </div>
    </form>
  )
}
