import React, { useState, useEffect } from 'react'
import Loading from './Loading'
import { CustomFieldsDecidedToQuit } from '../config/CustomFields';
import { getChoicesCustomFields } from '../config/funciones';

export default function AccordionDecidedToQuit({ handleFormData }) {
    const [loading, setLoading] = useState(false)
    const [choices, setShoices] = useState([])
    const [formData, setFormData] = useState({})

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            //const data = await getChoicesCustomFields(CustomFieldsAccordion1);
            const data = await getChoicesCustomFields(CustomFieldsDecidedToQuit);
            setShoices(data.data);
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading || choices.length === 0) {
        return (
            <Loading text="Loading Choices" />
        )
    }
    const handleChange = (clave, valor) => {
        const updated = { ...formData, [clave]: valor };
        setFormData(updated);            // actualiza el estado local del hijo
        handleFormData(3, updated);      // notifica al padre con los datos actualizados

    };
    return (
        <div className="row w-100 m-auto bg-info">
            <div className="col-12">
                <b>Cuando se Sale</b>
                <select
                    className="form-select form-select-sm"
                    aria-label="Lead type select"
                    value={formData?.whyIsOut || ""}
                    onChange={(e) => handleChange('whyIsOut', e.target.value)}
                >
                    <option value="">EMPTY</option>
                    <option disabled>----------</option>
                    {choices[0].choices.map((option, index) => (
                        <option key={index} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </div>
            <div className="col-12">
                <b>Porque se Sale</b>
                <div className="input-group input-group-sm mb-1">
                    <textarea
                        type="text"
                        className="form-control"    
                        value={formData?.whyIsOutReason || ""}
                        onChange={(e) => handleChange('whyIsOutReason', e.target.value)}                   
                    />
                </div>
            </div>

        </div>
    )
}
