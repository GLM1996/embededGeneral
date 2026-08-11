import React from 'react';

function ErrorModal({ title, content, onClose, children }) {
  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{
        background: "rgba(0,0,0,0.4)",
        zIndex: 1050,
      }}
    >
      <div
        className="card shadow-lg border-danger"
        style={{
          width: "90%",
          maxWidth: "700px",
        }}
      >
        <div className="card-header bg-danger text-white fw-bold">
          {title}
        </div>

        <div className="card-body">
          <p className="mb-3">{content}</p>

          {children}

          <div className="text-end mt-3">
            <button
              className="btn btn-danger"
              onClick={onClose}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorModal;