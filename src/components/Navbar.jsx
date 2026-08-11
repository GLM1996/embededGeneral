import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function Navbar({ changeMenu, personFilter }) {
    const [activeButton, setActiveButton] = useState("Summary");
    const { context } = useAppContext()

    const isBroker = context.user.role === "Broker"

    const handleButton = (value) => {
        changeMenu(value);
        setActiveButton(value);
    }

    // Función para determinar la clase del botón
    const getButtonClass = (value, baseClass) => {
        return `${baseClass} ${activeButton === value ? 'active-button' : ''}`;
    }

    return (
        <div className="custom-navbar bg-info">
            <div className="d-flex flex-wrap gap-1 menu-btn">

                <button className={getButtonClass('Summary', 'nav-btn')} onClick={() => handleButton('Summary')}>
                    SUMMARY
                </button>

                <button className={getButtonClass('Captacion', 'nav-btn')} onClick={() => handleButton('Captacion')}>
                    DATA ENTRY
                </button>

                <button className={getButtonClass('Add Appt', 'nav-btn')} onClick={() => handleButton('Add Appt')}>
                    APPT
                </button>

                <button className={getButtonClass('Listar Appt', 'nav-btn')} onClick={() => handleButton('Listar Appt')}>
                    EDIT APPTS
                </button>

                <button className={getButtonClass('Data Cliente', 'nav-btn')} onClick={() => handleButton('Data Cliente')}>
                    APPT STATUS                    
                </button>
                <button className={getButtonClass('SPLITS', 'nav-btn')} onClick={() => handleButton('SPLITS')}>
                    SPLITS 
                </button>
                <button className={getButtonClass('REASIGN', 'nav-btn')} onClick={() => handleButton('REASIGN')}>
                    REASIGN 
                </button>

                {isBroker && (
                    <>


                        {/* <button className={getButtonClass('TASKS', 'nav-btn')} onClick={() => handleButton('TASKS')}>
                            TASKS <i className="bi bi-pencil"></i>
                        </button> */}


                    </>
                )}

                {/* <button className={getButtonClass('PAST CLIENT', 'nav-btn')} onClick={() => handleButton('PAST CLIENT')}>
                    PAST CLIENT <i className="ms-1 bi bi-person-circle"></i>
                </button> */}

                <button className={getButtonClass('VA ASIGN', 'nav-btn')} onClick={() => handleButton('VA ASIGN')}>
                    Realtor Asign to VA
                </button>
                

            </div>
        </div>
    )
}