import React, { useState, useEffect } from 'react'
import { getChoicesCustomFields, obtainHomes } from '../../config/funciones'
import { CustomFieldsAccordion2 } from '../../config/CustomFields'
import { formatUsd } from '../../config/utils'
import ListProblems from './ListProblems'
import { useAppContext } from '../../context/AppContext';

export default function Accordion2({ handleFormData, personFilter, typeProblems, cleanProblems, cleanSelectProblems, problem }) {

    const [loading, setLoading] = useState(false)
    const { person, context, isLoading, error } = useAppContext();
    const [choices, setShoices] = useState([])
    const [formData, setFormData] = useState()
    const [dataDebt, setDataDebt] = useState()
    const [filterProblems, setFilterProblems] = useState([])

    const [selectedOptions, setSelectedOptions] = useState({});
    const [textValue, setTextValue] = useState(""); //Para el problema Other
    const [showText, setShowText] = useState(false); //Mostrar o ocultar el Text Area

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await getChoicesCustomFields(CustomFieldsAccordion2);
            const dataDb = await obtainHomes(Number(context.person.id));

            if (dataDb.success) {
                setDataDebt(dataDb.data);
                const updated = { ...formData };
                updated.debs = dataDb.data
                setFormData(updated);
                handleFormData(2, updated);
                console.log(updated, "PRIMERO")
            }
            setShoices(data.data);
            setLoading(false);
        };
        fetchData();
    }, [context?.person?.id]);

    // useEffect(() => {
    //     if (personFilter && choices.length > 0 && problem) {

    //         const initialData = {
    //             debtProblem: personFilter?.debtProblem ?? "",
    //             textValue: personFilter?.textValue ?? ""
    //         };

    //         const problemsData = {};
    //         const optionsData = {};

    //         if (personFilter?.problems?.length > 0) {
    //             personFilter.problems.forEach((element) => {
    //                 // 1. Buscar si el problema existe en Problems.BuyerSeller
    //                 const problemItem = problem.find(item => item.label === element);

    //                 // 2. Si existe, marcarlo como "Yes" en problemsData
    //                 if (problemItem) {
    //                     problemsData[problemItem.name] = "Yes";
    //                     optionsData[element.split('- ')?.[1]] = true;
    //                 }

    //                 // 3. Manejar casos con "Other"
    //                 if (element.includes("Other")) {
    //                     problemsData["customNEWProblemOther"] = "Yes"
    //                     optionsData[" Other"] = true;

    //                     setShowText(true);

    //                     if (person?.customNEWProblemOther) {
    //                         onChangeText(person?.customNEWProblemOther)
    //                     }

    //                     //setTextValue(person?.customNEWProblemOther || "");
    //                 }

    //             });
    //         }

    //         const updated = { ...initialData, ...problemsData, debs: formData?.debs, textValue: formData?.textValue };
    //         setFormData(updated);
    //         setSelectedOptions(optionsData);
    //         handleFormData(2, updated);
    //     }
    // }, [personFilter, choices, problem]);

    useEffect(() => {
        if (person && choices.length > 0 && problem) {

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

            const updated = { ...initialData, ...problemsData, textValue: formData?.textValue };
            setFormData(updated);
            setSelectedOptions(optionsData);
            handleFormData(2, updated);
        }
    }, [personFilter, choices, problem,typeProblems]);

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
            const updated = { ...formData, [clave]: status ? 'Yes' : '' };
            setFormData(updated);
            handleFormData(2, updated);
            console.log(updated)
        }

        if (name.includes("Other")) {
            const updated = { ...formData, [clave]: status ? 'Yes' : '' };
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

    const handleChange = (clave, valor) => {
        const updated = { ...formData, [clave]: valor };
        setFormData(updated);            // actualiza el estado local del hijo
        handleFormData(2, updated);      // notifica al padre con los datos actualizados
    };

    if (loading || choices.length === 0) {
        return (
            <div className='d-flex justify-content-center align-items-center py-5'>
                <b>Loading...</b>
            </div>
        )
    }

    return (
        <div className="row w-100 m-auto bg-info">
            {/* SI EXISTE LA DEUDA */}
            {dataDebt && (formData?.customNEWProblemHighDebts === "Yes" || formData?.customNEWProblemInsufficientIncome === "Yes") && (
                <>
                    <div className="col-6 d-flex flex-column justify-content-center align-items-center px-1">
                        <b>With Debt</b>
                        <b className="badge bg-secondary">
                            {dataDebt ? formatUsd(dataDebt.withDebt) : ""}
                        </b>
                    </div>
                    <div className="col-6 d-flex flex-column justify-content-center align-items-center px-1">
                        <b>Without Debt</b>
                        <b className="badge bg-secondary">
                            {dataDebt ? formatUsd(dataDebt.withoutDebt) : ""}
                        </b>
                    </div>
                    <div className="col-6 d-flex flex-column justify-content-center align-items-center px-1">
                        <b>Client Total Debt </b>
                        <b className="badge bg-secondary mt-1">
                            {dataDebt ? formatUsd(dataDebt.debtPerson) : ""}
                        </b>
                    </div>
                    <div className="col-6 d-flex flex-column justify-content-center align-items-center px-1">
                        <b>Max Debt Allowed</b>
                        <b className="badge bg-secondary mt-1">
                            {dataDebt ? formatUsd(dataDebt.debtAllowed) : ""}
                        </b>
                    </div>
                </>
            )}
            {/* SI SON DIFERENTES */}
            {dataDebt?.withDebt !== dataDebt?.withoutDebt && (
                <div className="col-12">
                    <b>Debt Problem</b>
                    <select
                        className="form-select form-select-sm"
                        aria-label="Pipelines select"
                        value={formData?.debtProblem || ""}
                        onChange={(e) => handleChange('debtProblem', e.target.value)}
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
            )}
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