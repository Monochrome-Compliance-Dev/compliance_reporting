import { useMemo, useState } from "react";
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  MenuItem,
  Stack,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { useAlert } from "context";
import { usePtrsContext } from "../context/PtrsContext";
import { usePtrsNavigation } from "../hooks/usePtrsNavigation";
import { createPtrs } from "../services/ptrsApi";
import { isValidABN, payloadSanitiser } from "shared/utils";

// Fixed half-yearly reporting periods
const PERIODS = [
  {
    label: "1 January 2024 - 30 June 2024",
    start: "2024-01-01",
    end: "2024-06-30",
  },
  {
    label: "1 July 2024 - 31 December 2024",
    start: "2024-07-01",
    end: "2024-12-31",
  },
  {
    label: "1 January 2025 - 30 June 2025",
    start: "2025-01-01",
    end: "2025-06-30",
  },
  {
    label: "1 July 2025 - 31 December 2025",
    start: "2025-07-01",
    end: "2025-12-31",
  },
  {
    label: "1 January 2026 - 30 June 2026",
    start: "2026-01-01",
    end: "2026-06-30",
  },
  {
    label: "1 July 2026 - 31 December 2026",
    start: "2026-07-01",
    end: "2026-12-31",
  },
  {
    label: "1 January 2027 - 30 June 2027",
    start: "2027-01-01",
    end: "2027-06-30",
  },
];

const schema = yup.object({
  label: yup.string().nullable(),
  periodIdx: yup
    .number()
    .min(0)
    .max(PERIODS.length - 1)
    .required(),
  reportingEntityName: yup
    .string()
    .trim()
    .max(200, "Keep it short")
    .required("Reporting entity name is required"),
  abn: yup
    .string()
    .transform((v) => String(v || "").replace(/\s+/g, ""))
    .required("ABN is required")
    .matches(/^\d{11}$/, "ABN must be 11 digits")
    .test("abn-checksum", "ABN checksum failed", (v) =>
      v ? isValidABN(v) : false,
    ),
  acn: yup
    .string()
    .transform((v) => {
      const digits = String(v || "").replace(/\s+/g, "");
      return digits || "";
    })
    .test("acn-len", "ACN must be 9 digits", (v) => !v || /^\d{9}$/.test(v)),
  arbn: yup
    .string()
    .transform((v) => {
      const digits = String(v || "").replace(/\s+/g, "");
      return digits || "";
    })
    .test("arbn-len", "ARBN must be 9 digits", (v) => !v || /^\d{9}$/.test(v)),
  // This is only used so the file error can be shown inline.
  file: yup.mixed().nullable(),
});

export default function CreatePtrsCard({ onSuccess }) {
  const theme = useTheme();
  const { showAlert } = useAlert();

  const { profiles, profileId, setProfileId } = usePtrsContext();
  const { goTo } = usePtrsNavigation();

  const safeProfileId = profiles.some((p) => p.id === profileId)
    ? profileId
    : "";

  const [fileObj, setFileObj] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    watch,
    formState: { errors, isValid },
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      label: "",
      periodIdx: 3,
      reportingEntityName: "Veolia Holdings Australia Pty Ltd",
      abn: "82663593093",
      acn: "",
      arbn: "",
    },
    mode: "onChange",
  });

  const periodIdx = watch("periodIdx");

  const canSubmit = Boolean(profileId && isValid && !submitting);

  const onSubmit = async (values) => {
    const p = PERIODS[values.periodIdx];

    if (!profileId) {
      // Keep this as an alert for now because profile is outside RHF
      showAlert("Choose a PTRS profile before creating a PTRS report.", "info");
      return;
    }

    // Sanitise payload (and strip spaces from identifiers)
    const sanitised = payloadSanitiser(
      {
        reportingEntityName: values.reportingEntityName,
        abn: values.abn,
        acn: values.acn,
        arbn: values.arbn,
      },
      [
        { key: "reportingEntityName", inputType: "text" },
        {
          key: "abn",
          inputType: "text",
          formatOverride: (v) => {
            const digits = String(v || "").replace(/\s+/g, "");
            return digits || null;
          },
        },
        {
          key: "acn",
          inputType: "text",
          formatOverride: (v) => {
            const digits = String(v || "").replace(/\s+/g, "");
            return digits || null;
          },
        },
        {
          key: "arbn",
          inputType: "text",
          formatOverride: (v) => {
            const digits = String(v || "").replace(/\s+/g, "");
            return digits || null;
          },
        },
      ],
    );

    setSubmitting(true);

    try {
      const payload = {
        label: values.label || null,
        reportingPeriodStartDate: p.start,
        reportingPeriodEndDate: p.end,
        periodStart: p.start,
        periodEnd: p.end,
        reportingEntityName: sanitised.reportingEntityName,
        profileId,
        meta: {
          abn: sanitised.abn,
          acn: sanitised.acn,
          arbn: sanitised.arbn,
        },
      };

      const res = await createPtrs(payload);

      const ptrsId = res?.data?.id || res?.id || res?.ptrsId;
      if (!ptrsId) {
        showAlert(
          "PTRS created but no id returned — refresh the list.",
          "info",
        );
        if (onSuccess) onSuccess(res);
        return;
      }

      showAlert("PTRS created. You can now upload datasets.", "success");
      if (onSuccess) onSuccess(ptrsId);
    } catch (err) {
      console.error(err);
      const msg =
        (err && (err.message || err.error || err.statusText)) ||
        "Failed to create PTRS report";
      showAlert(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ width: "100%", maxWidth: 980, mt: theme.spacing(2) }}
    >
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Create a new PTRS report
          </Typography>

          <TextField
            label="Optional label"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            {...register("label")}
            error={!!errors.label}
            helperText={errors.label?.message}
          />

          <TextField
            select
            label="Reporting period"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            {...register("periodIdx")}
            value={periodIdx}
            onChange={(e) =>
              setValue("periodIdx", Number(e.target.value), {
                shouldValidate: true,
              })
            }
            error={!!errors.periodIdx}
            helperText={errors.periodIdx?.message}
          >
            {PERIODS.map((p2, idx) => (
              <MenuItem key={p2.start} value={idx}>
                {p2.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="PTRS profile"
            fullWidth
            size="small"
            value={safeProfileId}
            onChange={(e) => setProfileId(e.target.value)}
            disabled={!profiles.length}
            helperText={
              profiles.length
                ? "Choose which profile this PTRS report belongs to."
                : "No profiles found for this customer."
            }
          >
            {profiles.map((p3) => (
              <MenuItem key={p3.id} value={p3.id}>
                {p3.name || p3.code || p3.id}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Reporting entity details
          </Typography>

          <TextField
            label="Reporting entity name"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            required
            {...register("reportingEntityName")}
            error={!!errors.reportingEntityName}
            helperText={
              errors.reportingEntityName?.message ||
              "Required. Shown in the report header and Board Pack."
            }
          />

          <TextField
            label="ABN (11 digits)"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            required
            {...register("abn")}
            error={!!errors.abn}
            helperText={
              errors.abn?.message ||
              "Required. Must be a valid ABN (checksum validated)."
            }
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="ACN (9 digits)"
              fullWidth
              size="small"
              {...register("acn")}
              error={!!errors.acn}
              helperText={errors.acn?.message}
            />
            <TextField
              label="ARBN (9 digits)"
              fullWidth
              size="small"
              {...register("arbn")}
              error={!!errors.arbn}
              helperText={errors.arbn?.message}
            />
          </Stack>
        </Grid>

        <Grid size={12}>
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Create the PTRS report first. You’ll upload datasets in the next
              step.
            </Typography>
          </Stack>
        </Grid>

        <Grid size={12}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={!canSubmit}
          >
            {submitting ? "Creating..." : "Create PTRS report"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
