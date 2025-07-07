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
import LockIcon from "@mui/icons-material/Lock";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ShieldIcon from "@mui/icons-material/Shield";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PolicyIcon from "@mui/icons-material/Policy";
import RelatedSolutions from "../RelatedSolutions";
import PageMeta from "../../components/ui/PageMeta";

export default function WhistleBlower() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const groupedFeatures = [
    {
      title: "Capture & Route",
      items: [
        {
          title: "Anonymous Intake Form",
          description:
            "Allow employees and stakeholders to report misconduct anonymously through a secure online form.",
          iconComponent: SupportAgentIcon,
        },
        {
          title: "Policy-Aware Workflows",
          description:
            "Configure intake categories and escalation flows based on your organisation’s whistleblower policy.",
          iconComponent: PolicyIcon,
        },
      ],
    },
    {
      title: "Triage & Respond",
      items: [
        {
          title: "Case Management Logs",
          description:
            "Track case status, outcomes, and reviewer notes — all securely stored for audit or board-level oversight.",
          iconComponent: ListAltIcon,
        },
        {
          title: "Role-Based Access",
          description:
            "Restrict case access to authorised individuals only, with full access logging.",
          iconComponent: ShieldIcon,
        },
      ],
    },
    {
      title: "Retain & Report",
      items: [
        {
          title: "Secure Storage",
          description:
            "All submissions and correspondence are stored securely with encrypted at-rest and in-transit protections.",
          iconComponent: LockIcon,
        },
        {
          title: "Visibility & Insights",
          description:
            "Generate reports on case volume, resolution times, and compliance with response obligations.",
          iconComponent: VisibilityIcon,
        },
      ],
    },
  ];

  return (
    <>
      <PageMeta
        title="Whistleblower Compliance"
        description="Launch a secure, policy-aligned whistleblower intake and case tracking system with Monochrome Compliance."
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
          Whistleblower Compliance Made Practical
        </Typography>

        <Typography
          variant="body1"
          color={theme.palette.text.secondary}
          sx={{ mb: theme.spacing(4) }}
        >
          Satisfy your obligations under the Corporations Act with a simple,
          secure platform that encourages reporting without overengineering the
          process.
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
            Want to launch a compliant intake process?
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
        <RelatedSolutions exclude="wb" />
      </Box>
    </>
  );
}
