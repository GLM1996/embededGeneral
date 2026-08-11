import React, { useEffect, useState } from 'react'
import { ajustarFechaUtcModify } from '../../config/utils'
import { useAppContext } from '../../context/AppContext'
import { servidorNew } from '../../config/utils'
import { toast } from 'react-toastify'
import moment from 'moment-timezone'

export default function Card({ item, handleSelectAppt }) {
    const { person, context } = useAppContext()

    const [status, setStatus] = useState(true)
    const [realtorLenderValue, setRealtorLenderValue] = useState('')
    const [userNameMet, setUserNameMet] = useState('')
    const [userNameSet, setUserNameSet] = useState('')
    const [dateSet, setDateSet] = useState('')
    const [dateMet, setDateMet] = useState('')

    const isBroker = context.user.role === "Broker"

    async function fetchApptMongo() {
        try {
            const url = `${servidorNew}/api/appts/${item.id}`
            const options = {
                method: 'GET',
                headers: {
                    'Content-type': 'application/json',
                },
            }

            const response = await fetch(url, options)
            const result = await response.json()

            console.log(result)

            if (result?.apptId && result?.isValid === false) {
                setStatus(false)
            } else {
                setStatus(true)
            }

            setUserNameMet(result?.userNameMet || '')
            setUserNameSet(result?.userNameSet || '')
            setDateSet(result?.dateSet || '')
            setRealtorLenderValue(result?.realtorLenderValue || '')
        } catch (error) {
            console.error('Error fetching appointment:', error)
            toast.error('Error loading appointment data')
        }
    }

    useEffect(() => {
        if (item?.id) {
            fetchApptMongo()
        }
    }, [item])

    async function invalidarAppt() {
        try {
            const nuevoStatus = !status
            setStatus(nuevoStatus)

            const url_n8n =
                'https://n8n.homelasvegasnevada.com/webhook/f4434002-dacc-45ee-be25-4c217f531b20'

            const options_n8n = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apptId: Number(item.id),
                    status: nuevoStatus,
                }),
            }

            const response = await fetch(url_n8n, options_n8n)

            if (!response.ok) {
                setStatus(!nuevoStatus)
                console.log('Error')
                toast.error('Error updating appointment status')
                return
            }

            console.log('Success')
            toast.success(nuevoStatus ? 'Appointment marked valid' : 'Appointment marked invalid')
        } catch (error) {
            console.error(error)
            toast.error('Error updating appointment status')
        }
    }

    async function marcarApptMet() {
        setUserNameMet(context?.user?.name || 'Audited')
        try {
            const fecha = new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/Los_Angeles',
                year: 'numeric',
                month: 'long',
                day: '2-digit',
            }).format(new Date())

            setDateMet(fecha)

            const url_n8n =
                'https://n8n.homelasvegasnevada.com/webhook/825c18c3-e3ff-4134-ad3a-4aa868d3968e'

            const options_n8n = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apptId: Number(item.id),
                    status: 'Met',
                    userName: context?.user?.name || '',
                    date: fecha,
                }),
            }

            const response = await fetch(url_n8n, options_n8n)

            if (!response.ok) {
                console.log('Error')
                toast.error('Error auditing appointment met')
                return false
            }


            console.log('Success')
            toast.success('Appointment Met audited')
            return true
        } catch (error) {
            console.error(error)
            toast.error('Error auditing appointment met')
            return false
        }
    }

    async function marcarApptSet() {
        setUserNameSet(context?.user?.name || 'Audited')
        try {
            const fecha = new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/Los_Angeles',
                year: 'numeric',
                month: 'long',
                day: '2-digit',
            }).format(new Date())

            setDateSet(fecha)

            const url_n8n =
                'https://n8n.homelasvegasnevada.com/webhook/2c15a84c-6d80-45f9-ab0d-42f9865a774c'

            const options_n8n = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apptId: Number(item.id),
                    status: 'Set',
                    userName: context?.user?.name || '',
                    date: fecha,
                }),
            }

            const response = await fetch(url_n8n, options_n8n)

            if (!response.ok) {
                console.log('Error')
                toast.error('Error auditing appointment set')
                return false
            }


            toast.success('Appointment Set audited')
            return true
        } catch (error) {
            console.error(error)
            toast.error('Error auditing appointment set')
            return false
        }
    }

    const openAuditForm = () => {
        if (!person?.id || !person?.name) return

        const formatted = moment().tz('America/Los_Angeles').format('YYYY-MM-DD')

        window.open(
            `https://docs.google.com/forms/d/e/1FAIpQLSfyGwhIBhv-ZxFhFefnx7rgHIycIg8HbKSqe3GAJePmZ_FOrA/viewform?usp=pp_url&entry.1798184213=https://homelasvegasnevada.followupboss.com/2/people/view/${person.id}&entry.1119040204=${person.name}&entry.622775083=${formatted}`,
            '_blank'
        )

    }

    return (
        <div className="row w-100 m-auto">
            {item && (
                <div className="col-12 px-1 mb-1">
                    <div className="card border border-2 border-dark rounded-2 shadow-sm">
                        <div
                            className={`d-flex justify-content-between align-items-center px-2 py-1 border-bottom border-dark ${status === false ? 'bg-danger text-white' : 'bg-info text-dark'
                                }`}
                        >
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="fw-bold small m-0">{item.title || 'EMPTY'}</span>

                                {status === false && (
                                    <span className="badge bg-light text-danger border border-danger">
                                        Invalid
                                    </span>
                                )}
                            </div>

                            <div className="d-flex align-items-center gap-1">
                                <i
                                    className="bi bi-pencil-fill itemBtn bg-success text-white rounded-1 px-1"
                                    onClick={() => handleSelectAppt(item)}
                                    title="Edit"
                                ></i>

                                {context?.user?.role === 'Broker' && (
                                    <i
                                        className={`bi bi-exclamation-triangle-fill itemBtn rounded-1 px-1 ${status ? 'bg-warning text-dark' : 'bg-success text-white'
                                            }`}
                                        onClick={invalidarAppt}
                                        title={status ? 'Mark Invalid' : 'Mark Valid'}
                                    ></i>
                                )}
                            </div>
                        </div>

                        <div className="px-2 py-1 small">
                            <div className="d-flex flex-column">
                                <span>
                                    <b>Type:</b> {item.type || '-'}
                                </span>
                                <span>
                                    <b>Appt With :</b> {realtorLenderValue || '-'}
                                </span>
                                <span>
                                    <b>Appt Date:</b> {ajustarFechaUtcModify(new Date(item.start))}
                                </span>
                                <span>
                                    <b>Outcome:</b> {item.outcome || '-'}
                                </span>
                                <span>
                                    <b>Agent:</b> {person?.assignedTo || '-'}
                                </span>

                                {userNameSet && (
                                    <>
                                        <span>
                                            <b>Appt Set Audit By:</b> {userNameSet}
                                        </span>
                                        <span>
                                            <b>Appt Set Audit Date:</b> {dateSet || '-'}
                                        </span>
                                    </>
                                )}

                                {userNameMet && (
                                    <><span>
                                        <b>Appt Met Audit By:</b> {userNameMet}
                                    </span>
                                        <span>
                                            <b>Appt Met Audit Date:</b> {dateMet || '-'}
                                        </span>
                                    </>
                                )}
                            </div>

                            {isBroker && (
                                <div className="d-flex justify-content-around gap-1 mt-1 flex-wrap border-top border-dark pt-1">
                                    <div className="form-check d-flex align-items-center gap-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id={`checkSet-${item.id}`}
                                            checked={!!userNameSet}
                                            disabled={!!userNameSet}
                                            onChange={async () => {
                                                const yaAuditado = !!userNameSet
                                                if (!yaAuditado) {
                                                    openAuditForm()
                                                }
                                                const ok = await marcarApptSet()


                                            }}
                                        />

                                        <label
                                            className="form-check-label"
                                            htmlFor={`checkSet-${item.id}`}
                                        >
                                            <i className="bi bi-link-45deg me-1"></i>
                                            {userNameSet ? 'Audited' : 'Audit Appt Set'}
                                        </label>
                                    </div>

                                    <div className="form-check d-flex align-items-center gap-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id={`checkMet-${item.id}`}
                                            checked={!!userNameMet}
                                            disabled={!!userNameMet}
                                            onChange={async () => {
                                                const yaAuditado = !!userNameMet
                                                if (!yaAuditado) {
                                                    openAuditForm()
                                                }
                                                const ok = await marcarApptMet()


                                            }}
                                        />

                                        <label
                                            className="form-check-label"
                                            htmlFor={`checkMet-${item.id}`}
                                        >
                                            <i className="bi bi-link-45deg me-1"></i>
                                            {userNameMet ? 'Audited' : 'Audit Appt Met'}
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}