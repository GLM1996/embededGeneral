import React from "react";

export default function FormCheck({
  index,
  name,
  checked,  // Recibimos el estado directamente del padre
  onChange,
  clave,
}) {
  const handleChange = (e) => {
    const newStatus = e.target.checked;
    if (onChange) {
      onChange(name, clave, newStatus);
    }
    // Eliminamos el estado local completamente
  };

  return (
    <div className="form-check">
      <input
        className="form-check-input"
        type="checkbox"
        checked={checked}  // Usamos el prop directamente
        onChange={handleChange}
        id={`${clave}`}
        name={name}
      />
      <label className="form-check-label" htmlFor={`${clave}`}>
        <b>{name}</b>
      </label>
    </div>
  );
}