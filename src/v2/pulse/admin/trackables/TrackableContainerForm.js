import {
  useEffect,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
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

function TrackableContainerForm(
  {
    mode = "create",
    initialValues,
    clients = [],
    config = {},
    onSubmit,
    onQuickAddClient,
    onChange,
  },
  ref
) {
  const requireClient = Boolean(config?.requiresClient);
  const suppressChangesRef = useRef(false);

  const schema = useMemo(
    () =>
      yup.object({
        name: yup.string().trim().required("Name is required"),
        clientId: requireClient
          ? yup.string().required("Client is required")
          : yup.string().nullable(),
        startDate: yup.string().required("Start date is required"),
        endDate: yup.string().required("End date is required"),
      }),
    [requireClient]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    control,
    getValues,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      clientId: requireClient ? "" : null,
      startDate: "",
      endDate: "",
      ...(initialValues || {}),
    },
    mode: "onChange",
    criteriaMode: "all",
  });

  useImperativeHandle(ref, () => ({ getValues }));

  const didMountRef = useRef(false);
  useEffect(() => {
    const sub = watch((values) => {
      if (suppressChangesRef.current) return; // ignore resets
      if (!didMountRef.current) {
        didMountRef.current = true; // don’t mark dirty on first paint
        return;
      }
      onChange?.(values); // real user edits
    });
    return () => sub?.unsubscribe?.();
  }, [watch, onChange]);

  useEffect(() => {
    // Suppress onChange while we programmatically populate defaults
    suppressChangesRef.current = true;
    reset({
      name: "",
      clientId: requireClient ? "" : null,
      startDate: "",
      endDate: "",
      ...(initialValues || {}),
    });
    // Re-enable after RHF applies values on the next tick
    const t = setTimeout(() => {
      suppressChangesRef.current = false;
    }, 0);
    return () => clearTimeout(t);
  }, [initialValues, reset, requireClient]);

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
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
                    value={field.value ? String(field.value) : ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
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
              Add client
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
      </Stack>
    </Box>
  );
}

export default forwardRef(TrackableContainerForm);
