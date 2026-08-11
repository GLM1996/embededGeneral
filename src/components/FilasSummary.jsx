import React from 'react'

export default function FilasSummary({ label, valor }) {
  
    if (!valor) return;
    return (
        <div className="d-flex align-items-stretch px-1 rounded-1 fs-5 mb-1 bg-white w-100 p-1 shadow border border-black">
            <div className='d-flex align-items-center border-end border-1 border-black bg-info rounded-start px-1 text-uppercase' style={{ width: '33%' }}>
                <b>{label}</b>
            </div>
            <div className={`d-flex  align-items-center bg-gray-suave rounded-end px-1`} style={{ width: '67%' }}>
                <b className='me-0'>{valor}</b>
            </div>
        </div>
    )
}
