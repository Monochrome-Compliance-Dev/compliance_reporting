import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import Box from "@mui/material/Box";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect } from "react";
import { useTheme } from "@mui/material/styles";

/**
 * Generic dialog for creating a new entity.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether dialog is open
 * @param {function} props.onClose - Called when dialog is closed
 * @param {function} props.onCreated - Called after successful creation
 * @param {string} props.title - Dialog title
 * @param {object} props.schema - Yup validation schema
 * @param {object} props.defaultValues - Default form values
 * @param {Array} props.fields - Field configs: [{ name, label, type, options }]
 * @param {function} props.onSubmit - Submission handler, called with form data
 */
const NewEntityDialog = ({
  open,
  onClose,
  onCreated,
  title,
  schema,
  defaultValues,
  fields,
  onSubmit,
}) => {
  const theme = useTheme();
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, defaultValues, reset]);

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
      onClose();
      if (onCreated) onCreated();
    } catch (err) {
      // TODO: Replace with user-friendly error display
      console.error("Failed to create entity", err);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      sx={{ p: theme.spacing(2) }}
    >
      <DialogTitle variant="h6" color={theme.palette.text.primary}>
        {title}
      </DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <DialogContent sx={{ pt: theme.spacing(1), pb: theme.spacing(2) }}>
          {fields.map((field) => {
            if (field.type === "select") {
              return (
                <Box key={field.name} sx={{ mb: theme.spacing(2) }}>
                  <FormControl
                    margin="normal"
                    fullWidth
                    error={!!errors[field.name]}
                  >
                    <InputLabel>{field.label}</InputLabel>
                    <Controller
                      name={field.name}
                      control={control}
                      render={({ field: ctrlField }) => (
                        <Select
                          label={field.label}
                          {...ctrlField}
                          value={ctrlField.value ?? ""}
                        >
                          {field.options &&
                            field.options.map((option) => (
                              <MenuItem
                                key={
                                  typeof option === "object"
                                    ? option.value
                                    : option
                                }
                                value={
                                  typeof option === "object"
                                    ? option.value
                                    : option
                                }
                              >
                                {typeof option === "object"
                                  ? option.label
                                  : option}
                              </MenuItem>
                            ))}
                        </Select>
                      )}
                    />
                    <FormHelperText
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {errors[field.name]?.message}
                    </FormHelperText>
                  </FormControl>
                </Box>
              );
            }
            // Default: text field
            return (
              <Box key={field.name} sx={{ mb: theme.spacing(2) }}>
                <Controller
                  name={field.name}
                  control={control}
                  render={({ field: ctrlField }) => (
                    <TextField
                      label={field.label}
                      margin="normal"
                      fullWidth
                      error={!!errors[field.name]}
                      helperText={errors[field.name]?.message}
                      type={field.type || "text"}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      {...ctrlField}
                    />
                  )}
                />
              </Box>
            );
          })}
        </DialogContent>
        <DialogActions sx={{ px: theme.spacing(3), pb: theme.spacing(2) }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{
              ml: theme.spacing(1),
              backgroundColor: theme.palette.primary.main,
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default NewEntityDialog;
