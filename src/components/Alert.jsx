import React, { useState, useEffect } from 'react';

export default function Alert({ message, type = 'success', onClose, duration = 3000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  if (!visible) return null;

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ zIndex: 11}}>
      <div className={`alert alert-${type} alert-dismissible fade show`} role="alert">
        <strong>{type === 'success' ? 'Éxito!' : type === 'danger' ? 'Error!' : 'Aviso!'}</strong>{message ? message : ' SE ESTA SALVANDO !!!ESPERE!!!'}
        <button 
          type="button" 
          className="btn-close" 
          onClick={handleClose}
          aria-label="Close"
        ></button>
      </div>
    </div>
  );
}