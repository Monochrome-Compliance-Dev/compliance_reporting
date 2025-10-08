import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  Typography,
} from "@mui/material";

export default function TrackableContainerForm({
  mode = "create",
  initialValues,
  clients = [],
  config = {},
  onSubmit,
  onQuickAddClient,
}) {
  const requireClient = config?.requiresClient !== false; // default true

  const schema = useMemo(
    () =>
      yup
        .object({
          name: yup.string().trim().required("Name is required"),
          clientId: requireClient
            ? yup.string().required("Client is required")
            : yup.string().nullable(),
          startDate: yup.string().required("Start date is required"),
          endDate: yup.string().required("End date is required"),
        })
        .required(),
    [requireClient]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
    watch,
    control,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      clientId: "",
      startDate: "",
      endDate: "",
      ...(initialValues || {}),
    },
    mode: "onChange",
    criteriaMode: "all",
  });

  // keep defaults fresh if parent updates initialValues
  useEffect(() => {
    reset({
      name: "",
      clientId: "",
      startDate: "",
      endDate: "",
      ...(initialValues || {}),
    });
  }, [initialValues, reset]);

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        <Typography variant="h6">
          {mode === "create" ? "Create Trackable" : "Edit Trackable"}
        </Typography>

        <TextField
          label="Name"
          InputLabelProps={{ shrink: !!watch("name") }}
          {...register("name")}
          error={!!errors.name}
          helperText={errors.name?.message}
          fullWidth
          required
        />

        {requireClient && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="flex-start"
          >
            <Controller
              name="clientId"
              control={control}
              render={({ field }) => (
                <FormControl
                  fullWidth
                  size="small"
                  error={!!errors.clientId}
                  required={requireClient}
                >
                  <InputLabel id="clientId-label">Client</InputLabel>
                  <Select
                    labelId="clientId-label"
                    label="Client"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputProps={{ name: field.name }}
                  >
                    {clients.map((c) => (
                      <MenuItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.clientId && (
                    <FormHelperText>{errors.clientId.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
            <Button
              size="small"
              variant="text"
              onClick={onQuickAddClient}
              sx={{ whiteSpace: "nowrap" }}
            >
              + Add client
            </Button>
          </Stack>
        )}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Start date"
            type="date"
            InputLabelProps={{ shrink: true }}
            {...register("startDate")}
            error={!!errors.startDate}
            helperText={errors.startDate?.message}
            fullWidth
            required
          />
          <TextField
            label="End date"
            type="date"
            InputLabelProps={{ shrink: true }}
            {...register("endDate")}
            error={!!errors.endDate}
            helperText={errors.endDate?.message}
            fullWidth
            required
          />
        </Stack>

        <Stack direction="row" spacing={2}>
          <Button
            type="submit"
            variant="contained"
            disabled={!isValid || isSubmitting}
          >
            {mode === "create" ? "Create trackable" : "Save changes"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
