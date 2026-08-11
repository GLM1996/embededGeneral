import React from 'react'

export default function Loading({ text }) {
    return (
        <div className='d-flex justify-content-center align-items-center w-100'>
            <div className="spinner-border my-5 mx-1" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
            <b className='fs-5'>{text}</b>
        </div>
    )
}
