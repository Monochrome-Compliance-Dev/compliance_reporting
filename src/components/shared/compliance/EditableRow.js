import {
  TableRow,
  TableCell,
  TextField,
  Checkbox,
  Button,
} from "@mui/material";
import { useState } from "react";

export const EditableRow = ({ columns, row, onChange, onSaveComplete }) => {
  const [formData, setFormData] = useState(() => ({ ...row }));
  if (!row) {
    console.error("EditableRow received undefined row");
    return null;
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    console.log("Saving form data:", formData);
    if (onChange) {
      const result = await onChange(formData); // Await and capture result
      console.log("Save result:", result);
    }
    if (onSaveComplete) {
      onSaveComplete();
    }
  };

  return (
    <TableRow>
      {columns.map((col) => {
        const value = formData[col.key];
        const inputType = col.inputType || "text";

        return (
          <TableCell key={col.key}>
            {inputType === "checkbox" ? (
              <Checkbox
                checked={!!value}
                onChange={(e) => handleChange(col.key, e.target.checked)}
              />
            ) : (
              <TextField
                type={inputType}
                value={
                  inputType === "date"
                    ? value?.substring(0, 10) || ""
                    : value || ""
                }
                onChange={(e) => handleChange(col.key, e.target.value)}
                fullWidth
              />
            )}
          </TableCell>
        );
      })}
      <TableCell>
        <Button variant="contained" size="small" onClick={handleSave}>
          Save
        </Button>
      </TableCell>
    </TableRow>
  );
};
