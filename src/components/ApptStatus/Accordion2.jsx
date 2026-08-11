import React, { useState, useEffect } from 'react'
import { getChoicesCustomFields, obtainHomes } from '../../config/funciones'
import { CustomFieldsAccordion2 } from '../../config/CustomFields'
import { formatUsd } from '../../config/utils'
import ListProblems from './ListProblems'
import { useAppContext } from '../../context/AppContext';

export default function Accordion2({ handleFormData, personFilter, typeProblems, cleanProblems, cleanSelectProblems, problem }) {

    const [loading, setLoading] = useState(false)
    const { person, context, isLoading, error } = useAppContext();
    const [formData, setFormData] = useState()
    const [filterProblems, setFilterProblems] = useState([])

    const [selectedOptions, setSelectedOptions] = useState({});
    const [textValue, setTextValue] = useState(""); //Para el problema Other
    const [showText, setShowText] = useState(false); //Mostrar o ocultar el Text Area
   
    useEffect(() => {
        if (person && problem) {
            const initialData = {
                textValue: person?.customNEWProblemOther ?? ""
            };

            const problemsData = {};
            const optionsData = {};

            
            if (problem?.length > 0) {
                for (let i = 0; i < problem.length; i++) {
                    let customName = problem[i].name
                    let customLabel = problem[i].label

                    if (person?.[customName] === "Yes") {
                        problemsData[customName] = "Yes"
                        optionsData[customLabel?.split('- ')?.[1]] = true;
                    }
                 
                    if (customLabel.includes("Other") && person?.[customName] !== "No") {
                        problemsData["customNEWProblemOther"] = "Yes"
                        optionsData[" Other"] = true;

                        setShowText(true);

                        if (person?.customNEWProblemOther) {
                            onChangeText(person?.customNEWProblemOther)
                        }
                    }
                }
            }

            const updated = { ...initialData, ...problemsData, textValue: person?.customNEWProblemOther };
            setFormData(updated);
            setSelectedOptions(optionsData);
            handleFormData(2, updated);
        }
    }, [personFilter, problem]);

    useEffect(() => {
        if (typeProblems !== "" && !loading && problem) {
            let filteredProblem = []
            switch (typeProblems) {
                case 'Buyer':
                    filteredProblem = problem.filter((item) => item.label.toLowerCase().includes('buyer') || item.label.toLowerCase().includes(': other'))
                    setFilterProblems(filteredProblem)
                    break;
                case 'Seller':
                    filteredProblem = problem.filter((item) => item.label.toLowerCase().includes('seller') || item.label.toLowerCase().includes(': other'))
                    setFilterProblems(filteredProblem)
                    break;
                case 'Buyer & Seller':
                    filteredProblem = problem.filter((item) => item.label.toLowerCase().includes('buyer') || item.label.toLowerCase().includes('seller') || item.label.toLowerCase().includes(': other'))
                    setFilterProblems(filteredProblem)
                    break;
                case 'Personal Rent':
                    filteredProblem = problem.filter((item) => item.label.toLowerCase().includes('insufficient income') || item.label.toLowerCase().includes('money savings low') || item.label.toLowerCase().includes('high debts') || item.label.toLowerCase().includes('rent contract for more') || item.label.toLowerCase().includes('buyer has no') || item.label.toLowerCase().includes('client insecure'))
                    setFilterProblems(filteredProblem)
                    break;

                default:
                    filteredProblem = problem.filter((item) => item.label.toLowerCase().includes('buyer') || item.label.toLowerCase().includes('seller'))
                    setFilterProblems(filteredProblem)
                    break;
            }
        }
    }, [typeProblems, loading, problem])

    useEffect(() => {
        if (cleanProblems) {
            setSelectedOptions({})
            cleanSelectProblems(false)
            setShowText(false);

            if (formData) {
                // Eliminar propiedades con valor "Yes"
                const filteredData = Object.fromEntries(
                    Object.entries(formData).filter(([key, value]) => value !== "Yes")
                );
                setFormData(filteredData);
                handleFormData(2, filteredData);
            }
        }
    }, [cleanProblems])

    const onChangeText = (text) => {
        const updated = { ...formData, textValue: text }
        handleFormData(2, updated);
        setTextValue(text)
        setFormData(prev => ({ ...prev, textValue: text }));
        //formData.textValue = text
    }

    const handleCheckboxChange = (name, clave, status) => {
        setSelectedOptions(prev => ({ ...prev, [name]: status }));

        if (clave !== "customNEWProblemOther") {
            const updated = { ...formData, [clave]: status ? 'Yes' : 'No' };
            setFormData(updated);
            handleFormData(2, updated);
            console.log(updated)
        }

        if (name.includes("Other")) {
            const updated = { ...formData, [clave]: status ? 'Yes' : 'No' };
            setFormData(updated);
            handleFormData(2, updated);
            setShowText(status);
            if (!status) setTextValue("");
            formData.textValue = ""
            //const updated = { ...formData, textValue: status ? 'Yes' : '' };
            //setFormData(updated);
            //handleFormData(2, updated);
        }
    };

    if (loading) {
        return (
            <div className='d-flex justify-content-center align-items-center py-5'>
                <b>Loading...</b>
            </div>
        )
    }

    return (
        <div className="row w-100 m-auto bg-info">
            {problem && (
                <ListProblems
                    list={filterProblems}
                    selectedOptions={selectedOptions}
                    textValue={textValue}
                    showText={showText}
                    onCheckboxChange={handleCheckboxChange}
                    onTextChange={onChangeText}
                />
            )}
        </div>
    )
}