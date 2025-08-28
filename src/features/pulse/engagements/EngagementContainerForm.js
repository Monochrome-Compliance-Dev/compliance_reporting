import { useEffect } from "react";
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

const schema = yup
  .object({
    name: yup.string().trim().required("Name is required"),
    clientId: yup.string().required("Client is required"),
    startDate: yup.string().required("Start date is required"),
    endDate: yup.string().required("End date is required"),
  })
  .required();

export default function EngagementContainerForm({
  mode = "create",
  initialValues,
  clients = [],
  onSubmit,
  onQuickAddClient,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    control,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: initialValues,
  });

  // keep defaults fresh if parent updates initialValues
  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const canCreate = !!watch("name") && !!watch("clientId");

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        <Typography variant="h6">
          {mode === "create" ? "Create Engagement" : "Edit Engagement"}
        </Typography>

        <TextField
          label="Name"
          InputLabelProps={{ shrink: !!watch("name") }}
          {...register("name")}
          error={!!errors.name}
          helperText={errors.name?.message}
          fullWidth
        />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="flex-start"
        >
          <Controller
            name="clientId"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth size="small" error={!!errors.clientId}>
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

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Start date"
            type="date"
            InputLabelProps={{ shrink: true }}
            {...register("startDate")}
            error={!!errors.startDate}
            helperText={errors.startDate?.message}
            fullWidth
          />
          <TextField
            label="End date"
            type="date"
            InputLabelProps={{ shrink: true }}
            {...register("endDate")}
            error={!!errors.endDate}
            helperText={errors.endDate?.message}
            fullWidth
          />
        </Stack>

        <Stack direction="row" spacing={2}>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || (mode === "create" && !canCreate)}
          >
            {mode === "create" ? "Create engagement" : "Save changes"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
