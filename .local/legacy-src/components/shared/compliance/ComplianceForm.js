import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Box,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
} from "@mui/material";
import { useEffect } from "react";

export function ComplianceForm({
  formKey,
  row,
  defaultValues,
  onSubmit,
  onCancel,
  fields,
  validationSchema,
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues,
    resolver: yupResolver(validationSchema),
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <Box key={formKey} display="flex" flexDirection="column" gap={2}>
      {fields?.map((field) => {
        const {
          name,
          label,
          type = "text",
          component = "TextField",
          options = {},
        } = field;

        if (component === "Checkbox") {
          return (
            <Controller
              key={name}
              name={name}
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label={label}
                />
              )}
            />
          );
        }

        return (
          <Controller
            key={name}
            name={name}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type={type}
                label={label}
                value={field.value ?? ""}
                InputLabelProps={type === "date" ? { shrink: true } : undefined}
                error={!!errors[name]}
                helperText={errors[name]?.message}
                fullWidth
                {...options}
              />
            )}
          />
        );
      })}
      <Box display="flex" justifyContent="flex-end" gap={2}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)}>
          Save
        </Button>
      </Box>
    </Box>
  );
}
