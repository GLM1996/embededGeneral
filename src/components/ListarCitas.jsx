
import CardCita from './CardCita';

export default function ListarCitas({ citas,context }) {

    if (citas.length === 0) {
        return (
            <div className='d-flex justify-content-center align-items-center'>
                <b>🔔 NO APPT YET 🔔</b>
            </div>
        )
    }

    return (
        <div className='row w-100 m-auto p-0'>
            <b className='text-center fs-5'>All Appts Outcome Details</b>
            {citas.length > 0 && (
                <div className="d-flex justify-content-between flex-wrap my-1 p-0 mx-0">
                    {citas.slice().reverse().map((item, index) => (
                        <CardCita context={context} key={index} item={item} />
                    ))}
                </div>
            )}
        </div>
    )
}
