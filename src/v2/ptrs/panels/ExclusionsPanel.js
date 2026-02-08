import { Box, Stack, Typography, Divider, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAlert } from "context";
import { usePtrsV2Context } from "v2/ptrs/context/PtrsV2Context";
import { useApplyExclusionsMutation } from "v2/ptrs/hooks/usePtrsQueries";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useNavigate } from "react-router";

export default function ExclusionsPanel() {
  const theme = useTheme();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const { ptrsId, profileId } = usePtrsV2Context();
  const applyMutation = useApplyExclusionsMutation(ptrsId);

  const handleApply = async () => {
    try {
      showAlert("Applying exclusion checks…", "info");
      const res = await applyMutation.mutateAsync({ profileId });
      const persisted = res?.persisted ?? 0;
      showAlert(
        `Exclusions applied — ${persisted} row(s) re-evaluated.`,
        "success",
      );
    } catch (err) {
      showAlert(err?.message || "Failed to apply exclusions.", "error");
    }
  };

  const handleNext = () => {
    navigate(
      `/v2/ptrs/rules?ptrsId=${ptrsId}${profileId ? `&profileId=${profileId}` : ""}`,
    );
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: "auto" }}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={600}>
          Exclusions & eligibility
        </Typography>

        <Divider />

        <Typography
          variant="body1"
          sx={{ color: theme.palette.text.secondary }}
        >
          These checks determine which payments are eligible for TCP reporting.
          Excluded records will not appear in metrics or reports.
        </Typography>

        <Box>
          <Button
            variant="contained"
            onClick={handleApply}
            disabled={!ptrsId || applyMutation.isLoading}
          >
            Apply exclusions
          </Button>
        </Box>

        <Divider />

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
