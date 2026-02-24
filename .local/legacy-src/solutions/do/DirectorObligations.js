import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useNavigate } from "react-router";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import GavelIcon from "@mui/icons-material/Gavel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LockIcon from "@mui/icons-material/Lock";
import DescriptionIcon from "@mui/icons-material/Description";
import ChecklistIcon from "@mui/icons-material/Checklist";
import RelatedSolutions from "../RelatedSolutions";
import PageMeta from "../../components/ui/PageMeta";

export default function DirectorObligations() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const groupedFeatures = [
    {
      title: "Track & Record",
      items: [
        {
          title: "Conflict Disclosures",
          description:
            "Directors can submit and update personal interest declarations as required under the Corporations Act.",
          iconComponent: AssignmentIndIcon,
        },
        {
          title: "Recurring Attestations",
          description:
            "Set up quarterly or annual workflows to confirm ongoing compliance with key duties.",
          iconComponent: ChecklistIcon,
        },
      ],
    },
    {
      title: "Review & Report",
      items: [
        {
          title: "Visibility for Governance",
          description:
            "Give Company Secretaries or Board stakeholders a clean view of compliance submissions and gaps.",
          iconComponent: VisibilityIcon,
        },
        {
          title: "Structured Registers",
          description:
            "Maintain structured logs of disclosures, training, and declarations — ready for audit or annual reporting.",
          iconComponent: DescriptionIcon,
        },
      ],
    },
    {
      title: "Secure & Retain",
      items: [
        {
          title: "Access Controls",
          description:
            "All director and officer data is role-gated and logged to ensure confidentiality and accountability.",
          iconComponent: LockIcon,
        },
        {
          title: "Seven-Year Retention",
          description:
            "All records are stored securely and retained for a minimum of seven years for audit purposes.",
          iconComponent: GavelIcon,
        },
      ],
    },
  ];

  return (
    <>
      <PageMeta
        title="Director Obligations"
        description="Manage director disclosures, conflict declarations and recurring attestations using Monochrome Compliance’s board-friendly workflows."
      />
      <Box
        sx={{
          px: { xs: theme.spacing(3), md: theme.spacing(8) },
          py: theme.spacing(4),
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          color={theme.palette.text.primary}
        >
          Director Obligations & Disclosures, Managed
        </Typography>

        <Typography
          variant="body1"
          color={theme.palette.text.secondary}
          sx={{ mb: theme.spacing(4) }}
        >
          Help your directors and officers stay on top of their obligations with
          a lightweight, auditable workflow. No spreadsheets. No surprises.
        </Typography>

        {groupedFeatures.map((group, i) => (
          <Box key={i} sx={{ mb: theme.spacing(5) }}>
            <Typography
              variant="h6"
              gutterBottom
              color={theme.palette.text.primary}
            >
              {group.title}
            </Typography>
            <Grid container spacing={3}>
              {group.items.map((item, j) => (
                <Grid item xs={12} sm={6} key={j}>
                  <Card
                    elevation={2}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      padding: 2,
                      height: "100%",
                    }}
                  >
                    <item.iconComponent
                      sx={{
                        fontSize: 40,
                        color: theme.palette.primary.main,
                        mr: 2,
                      }}
                    />
                    <Box>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color={theme.palette.text.secondary}
                      >
                        {item.description}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}

        <Box sx={{ mt: theme.spacing(6), textAlign: "center" }}>
          <Typography
            variant="h6"
            gutterBottom
            color={theme.palette.text.primary}
          >
            Ready to simplify director compliance?
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: isSmallScreen ? "column" : "row",
              justifyContent: "center",
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate("/contact")}
              sx={{ width: isSmallScreen ? "100%" : "auto" }}
            >
              Talk to our team
            </Button>
          </Box>
        </Box>
        <RelatedSolutions exclude="do" />
      </Box>
    </>
  );
}
