import React, { useEffect, useState } from "react";
import FormCheck from "./FormCheck";

export default function ListProblems({
  list,
  selectedOptions,
  textValue,
  showText,
  onCheckboxChange,
  onTextChange,
}) {
  const [localText, setLocalText] = useState(textValue || "");

  // Sync desde el padre SOLO si es distinto
  useEffect(() => {
    const next = textValue || "";
    if (next !== localText) setLocalText(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textValue]); // intencional: no depende de localText para evitar loop

  // Debounce hacia el padre SOLO si cambió vs textValue
  useEffect(() => {
    if (!showText) return;

    const id = setTimeout(() => {
      if ((textValue || "") !== localText) {
        onTextChange(localText);
      }
    }, 400);

    return () => clearTimeout(id);
  }, [localText, textValue, onTextChange, showText]);

  return (
    <div className="row w-100 m-auto p-1 overflow-y-auto">
      <div className="col-12">
        {list.map((item, index) => {
          const labelKey =
            item.label.split("- ")?.[1] || item.label.split(":")?.[1] || item.label;

          return (
            <div key={item.id}>
              <FormCheck
                index={index}
                name={labelKey}
                checked={!!selectedOptions[labelKey]}
                onChange={onCheckboxChange}
                clave={item.name}
              />
            </div>
          );
        })}

        {showText && (
          <div className="input-group input-group-sm mb-1">
            <textarea
              className="form-control"
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
