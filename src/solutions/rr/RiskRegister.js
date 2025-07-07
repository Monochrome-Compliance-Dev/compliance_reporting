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
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import ChecklistIcon from "@mui/icons-material/Checklist";
import TimelineIcon from "@mui/icons-material/Timeline";
import AssignmentIcon from "@mui/icons-material/Assignment";
import GavelIcon from "@mui/icons-material/Gavel";
import LockIcon from "@mui/icons-material/Lock";
import RelatedSolutions from "../RelatedSolutions";
import PageMeta from "../../components/ui/PageMeta";

export default function RiskRegister() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const groupedFeatures = [
    {
      title: "Register & Categorise",
      items: [
        {
          title: "Template-Based Register",
          description:
            "Start with a prebuilt risk register covering key operational, strategic, and compliance risks.",
          iconComponent: LibraryBooksIcon,
        },
        {
          title: "Risk Classification",
          description:
            "Categorise risks by type, impact, likelihood, and control effectiveness.",
          iconComponent: ChecklistIcon,
        },
      ],
    },
    {
      title: "Review & Respond",
      items: [
        {
          title: "Review Workflows",
          description:
            "Assign owners and deadlines for periodic risk reviews, with automatic tracking and reminders.",
          iconComponent: AssignmentIcon,
        },
        {
          title: "Risk Trends & History",
          description:
            "See how risk ratings have changed over time and identify emerging issues before they escalate.",
          iconComponent: TimelineIcon,
        },
      ],
    },
    {
      title: "Retain & Protect",
      items: [
        {
          title: "Secure Storage",
          description:
            "All register data is stored in a secure, access-controlled environment with full audit logs.",
          iconComponent: LockIcon,
        },
        {
          title: "Long-Term Record Keeping",
          description:
            "Ensure compliance with corporate record-keeping requirements via long-term storage and export options.",
          iconComponent: GavelIcon,
        },
      ],
    },
  ];

  return (
    <>
      <PageMeta
        title="Risk Register"
        description="Ditch the spreadsheet and manage risk with a structured register, review workflows and audit-ready controls from Monochrome Compliance."
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
          Risk Register as a Service
        </Typography>

        <Typography
          variant="body1"
          color={theme.palette.text.secondary}
          sx={{ mb: theme.spacing(4) }}
        >
          Move your risk register out of Excel and into a system built for
          visibility, ownership, and ongoing review. No integrations required.
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
            Want a register your board will actually use?
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
        <RelatedSolutions exclude="rr" />
      </Box>
    </>
  );
}
