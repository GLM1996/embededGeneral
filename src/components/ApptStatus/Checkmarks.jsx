import * as React from "react";
import {
    FormControl,
    Select,
    MenuItem,
    ListItemText,
    OutlinedInput,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";


const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;

const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 5 + ITEM_PADDING_TOP,
            width: 320,
        },
    },
    disablePortal: false,
};

export default function MuiMultiSelect({
    options = [],
    value = [],
    onChange,
    placeholder = "EMPTY",
}) {
    const handleChange = (event) => {
        const v = event.target.value;
        onChange(typeof v === "string" ? v.split(",") : v);
    };

    return (
        <FormControl fullWidth size="small" variant="outlined">
            <Select
                multiple
                displayEmpty
                value={value}
                onChange={handleChange}
                input={<OutlinedInput notched={false} />}

                // ✅ flecha bonita (▼), NO ▲▼
                // IconComponent={KeyboardArrowDownIcon}

                MenuProps={MenuProps}
                renderValue={(selected) => {
                    if (!selected || selected.length === 0) {
                        return <span style={{ color: "#6c757d" }}>{placeholder}</span>;
                    }
                    return (
                        <span
                            style={{
                                display: "block",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                            title={selected.join(", ")}
                        >
                            {selected.join(", ")}
                        </span>
                    );
                }}
                sx={{
                    backgroundColor: "#fff",
                    borderRadius: "0.375rem",
                    padding: "0.35rem",
                    // ✅ evita UI nativa del navegador (spinners)
                    "& .MuiSelect-select": {
                        padding: "0.25rem 2rem 0.25rem 0.75rem", // dejamos espacio para la flecha
                        fontSize: "0.55rem",
                        minHeight: "auto",
                        WebkitAppearance: "none",
                        MozAppearance: "none",
                        appearance: "none",
                    },

                    "& input": {
                        WebkitAppearance: "none",
                        MozAppearance: "none",
                        appearance: "none",
                    },

                    // ✅ estilo y tamaño de la flecha
                    "& .MuiSelect-icon": {
                        right: 8,
                        color: "rgba(0,0,0,.55)",
                    },

                    "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(0,0,0,.175)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(0,0,0,.35)",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#86b7fe",
                    },
                    "&.Mui-focused": {
                        boxShadow: "0 0 0 .25rem rgba(13,110,253,.25)",
                    },
                }}
            >
                {options.map((opt) => {
                    const selected = value.includes(opt);
                    return (
                        <MenuItem
                            key={opt}
                            value={opt}
                            dense
                            sx={{
                                py: 0.75,
                                px: 1.25,
                                borderRadius: 1,
                                "&:hover": { backgroundColor: "rgba(13,110,253,.08)" },
                                ...(selected && {
                                    backgroundColor: "rgba(25,135,84,.12)",
                                    "&:hover": { backgroundColor: "rgba(25,135,84,.18)" },
                                }),
                            }}
                        >
                            <ListItemText
                                primary={opt}
                                primaryTypographyProps={{
                                    sx: {
                                        fontSize: "0.85rem",
                                        fontWeight: selected ? 700 : 400,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    },
                                }}
                            />
                            {selected ? (
                                <CheckIcon sx={{ fontSize: 18, opacity: 0.8, ml: 1 }} />
                            ) : (
                                <span style={{ width: 18, marginLeft: 8 }} />
                            )}

                        </MenuItem>
                    );
                })}
            </Select>
        </FormControl>
    );
}
