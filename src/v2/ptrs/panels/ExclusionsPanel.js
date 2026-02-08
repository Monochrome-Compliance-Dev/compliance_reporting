import {
  Box,
  Stack,
  Typography,
  Divider,
  Button,
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAlert } from "context";
import { usePtrsV2Context } from "v2/ptrs/context/PtrsV2Context";
import {
  useApplyExclusionsMutation,
  useExclusionsPreviewQuery,
} from "v2/ptrs/hooks/usePtrsQueries";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RuleIcon from "@mui/icons-material/Rule";
import { useNavigate } from "react-router";
import { useMemo } from "react";

function SampleTable({ rows }) {
  if (!Array.isArray(rows) || !rows.length) return null;

  return (
    <Box sx={{ mt: 1, overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Payee</TableCell>
            <TableCell>Payee ABN</TableCell>
            <TableCell>Invoice ref</TableCell>
            <TableCell>Payment date</TableCell>
            <TableCell align="right">Payment amt</TableCell>
            <TableCell>Note</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, idx) => (
            <TableRow key={`${r?.row_no ?? idx}`}>
              <TableCell>{r?.payee_entity_name || "-"}</TableCell>
              <TableCell>{r?.payee_entity_abn || "-"}</TableCell>
              <TableCell>{r?.invoice_reference_number || "-"}</TableCell>
              <TableCell>{r?.payment_date || "-"}</TableCell>
              <TableCell align="right">{r?.payment_amount || "-"}</TableCell>
              <TableCell>{r?.exclude_comment || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

function ExclusionCard({
  title,
  description,
  category,
  enabled,
  previewCount,
  previewRows,
  onPreview,
  onApply,
  busy,
  statusMessage,
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>

          {enabled ? (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Preview:{" "}
              <strong>
                {previewCount == null ? "—" : `${previewCount} row(s)`}
              </strong>
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Coming soon.
            </Typography>
          )}
          {enabled && previewCount === 0 && (
            <Typography variant="body2" color="text.secondary">
              No records matched this exclusion category.
            </Typography>
          )}

          {enabled && <SampleTable rows={previewRows} />}
        </Stack>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2 }}>
        {statusMessage && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mr: 2, alignSelf: "center" }}
          >
            {statusMessage}
          </Typography>
        )}
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={onPreview}
            disabled={!enabled || busy}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            startIcon={<RuleIcon />}
            onClick={onApply}
            disabled={!enabled || busy}
          >
            Apply
          </Button>
        </Stack>
      </CardActions>
    </Card>
  );
}

export default function ExclusionsPanel() {
  const theme = useTheme();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const { ptrsId, profileId } = usePtrsV2Context();

  const applyMutation = useApplyExclusionsMutation(ptrsId);
  const govPreviewQuery = useExclusionsPreviewQuery(ptrsId, {
    profileId,
    category: "gov",
    limit: 5,
  });

  const govAlreadyExcludedCount = useMemo(() => {
    const total =
      govPreviewQuery.data?.result?.alreadyExcludedCounts?.gov ?? null;

    // Prefer backend-provided total (covers the whole dataset, not just the sample)
    if (Number.isFinite(total)) return Number(total);

    // Fallback: sample-based estimate (only used if backend doesn't provide totals)
    const rows = govPreviewQuery.data?.result?.samples?.gov || [];
    if (!rows.length) return 0;
    return rows.filter((r) => r?.alreadyExcluded === true).length;
  }, [govPreviewQuery.data]);

  const busy = applyMutation.isLoading || govPreviewQuery.isFetching;

  const handlePreviewGov = async () => {
    try {
      showAlert("Previewing government entity exclusions…", "info");
      const out = await govPreviewQuery.refetch();
      if (out?.error) throw out.error;
      showAlert("Preview loaded.", "success");
    } catch (err) {
      showAlert(err?.message || "Failed to preview exclusions.", "error");
    }
  };

  const handleApplyGov = async () => {
    try {
      showAlert("Applying government entity exclusions…", "info");
      const res = await applyMutation.mutateAsync({
        profileId,
        category: "gov",
      });

      const persisted = res?.persisted ?? 0;
      showAlert(`Applied. ${persisted} row(s) re-evaluated.`, "success");

      // Refresh preview so inline counts reflect the new state
      govPreviewQuery.refetch();
    } catch (err) {
      showAlert(err?.message || "Failed to apply exclusions.", "error");
    }
  };

  const handleNext = () => {
    navigate(
      `/v2/ptrs/rules?ptrsId=${ptrsId}${profileId ? `&profileId=${profileId}` : ""}`,
    );
  };

  const cards = useMemo(
    () => [
      {
        title: "Government entities",
        description:
          "Exclude payments to government entities using a shared ABN reference list.",
        category: "gov",
        enabled: true,
      },
      {
        title: "Intra-company payments",
        description:
          "Exclude payments between related entities (profile-scoped reference).",
        category: "intra_company",
        enabled: false,
      },
      {
        title: "Employee & expense payments",
        description:
          "Exclude wages, reimbursements, and employee-related payments (profile-scoped reference + keywords).",
        category: "employee",
        enabled: false,
      },
      {
        title: "Custom keyword exclusions",
        description:
          "Exclude profile-specific rows when keywords match nominated fields.",
        category: "keyword",
        enabled: false,
      },
      {
        title: "Partial payments",
        description:
          "Exclude earlier payments where multiple payments exist for the same invoice reference.",
        category: "partial",
        enabled: false,
      },
      {
        title: "Pre-payments",
        description:
          "Exclude payments with prepaid terms such as PREPAID (where applicable).",
        category: "prepaid",
        enabled: false,
      },
    ],
    [],
  );

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={600}>
          Exclusions & eligibility
        </Typography>

        <Divider />

        <Typography
          variant="body1"
          sx={{ color: theme.palette.text.secondary }}
        >
          Preview each exclusion category, review a sample of impacted rows,
          then apply the exclusions. Excluded records will not appear in metrics
          or reports.
        </Typography>

        <Stack spacing={2} sx={{ mt: 1 }}>
          {cards.map((c) => {
            if (c.category === "gov") {
              return (
                <ExclusionCard
                  key={c.category}
                  title={c.title}
                  description={c.description}
                  category={c.category}
                  enabled={c.enabled}
                  previewCount={
                    govPreviewQuery.isFetched
                      ? (govPreviewQuery.data?.result?.counts?.gov ?? 0)
                      : null
                  }
                  previewRows={govPreviewQuery.data?.result?.samples?.gov ?? []}
                  busy={busy}
                  onPreview={handlePreviewGov}
                  onApply={handleApplyGov}
                  statusMessage={
                    govPreviewQuery.isFetched
                      ? `${govAlreadyExcludedCount} row(s) already excluded`
                      : null
                  }
                />
              );
            }

            return (
              <ExclusionCard
                key={c.category}
                title={c.title}
                description={c.description}
                category={c.category}
                enabled={c.enabled}
                previewCount={null}
                previewRows={[]}
                busy={busy}
                onPreview={() => {}}
                onApply={() => {}}
              />
            );
          })}
        </Stack>

        <Divider sx={{ mt: 1 }} />

        <Box>
          <Button
            variant="contained"
            endIcon={<NavigateNextIcon />}
            disabled={!ptrsId}
            onClick={handleNext}
          >
            Next: Rules
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
