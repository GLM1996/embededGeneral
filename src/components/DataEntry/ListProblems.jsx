import React from 'react'
import FormCheck from "./FormCheck";

export default function ListProblems({
    list,
    selectedOptions,
    textValue,
    showText,
    onCheckboxChange,
    onTextChange
}) {
   
    return (
        <div className='row w-100 m-auto p-1 overflow-y-auto'>
            <div className="col-12">
                {list.map((item, index) => (
                    <div key={item.id}>
                        <FormCheck
                            index={index}
                            name={item.label.split('- ')?.[1] || item.label.split(':')?.[1]}
                            checked={!!selectedOptions[item.label.split('- ')?.[1] || item.label.split(':')?.[1]]} // Convertir a booleano
                            onChange={onCheckboxChange}
                            clave={item.name}
                        />
                    </div>
                ))}

                {showText && (
                    <div className="input-group input-group-sm mb-1">                        
                        <textarea
                            type="text"
                            className="form-control"
                            value={textValue}
                            onChange={(e) => onTextChange(e.target.value)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
