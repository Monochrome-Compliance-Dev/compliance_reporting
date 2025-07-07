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
import GavelIcon from "@mui/icons-material/Gavel";
import SearchIcon from "@mui/icons-material/Search";
import ChecklistIcon from "@mui/icons-material/Checklist";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ArticleIcon from "@mui/icons-material/Article";
import RelatedSolutions from "../RelatedSolutions";
import PageMeta from "../../components/ui/PageMeta";

export default function ModernSlavery() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const groupedFeatures = [
    {
      title: "Assess & Understand",
      items: [
        {
          title: "Risk Assessment Toolkit",
          description:
            "Start with a templated assessment to identify key areas of modern slavery risk across your supply chain and operations.",
          iconComponent: SearchIcon,
        },
        {
          title: "Integrated Guidance",
          description:
            "Each section includes contextual helper text based on Australian Government Modern Slavery guidance.",
          iconComponent: HelpOutlineIcon,
        },
      ],
    },
    {
      title: "Document & Evidence",
      items: [
        {
          title: "Due Diligence Logs",
          description:
            "Maintain a record of supplier engagement, remediation efforts, and internal training activities with audit-ready logs.",
          iconComponent: ChecklistIcon,
        },
        {
          title: "Template-Based Reporting",
          description:
            "Generate a structured Modern Slavery Statement aligned with the government-mandated reporting criteria.",
          iconComponent: ArticleIcon,
        },
      ],
    },
    {
      title: "Secure & Store",
      items: [
        {
          title: "Secure Architecture",
          description:
            "Data is stored securely in a multi-tenant environment, with access logging and role-based permissions.",
          iconComponent: LockIcon,
        },
        {
          title: "Seven-Year Retention",
          description:
            "We retain relevant records and statements securely for the legislated seven-year minimum.",
          iconComponent: GavelIcon,
        },
      ],
    },
  ];

  return (
    <>
      <PageMeta
        title="Modern Slavery Compliance"
        description="Streamline your Modern Slavery Statement preparation with Monochrome Compliance’s risk assessment, due diligence tracking, and templated reporting."
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
          Make Modern Slavery Compliance Simple
        </Typography>

        <Typography
          variant="body1"
          color={theme.palette.text.secondary}
          sx={{ mb: theme.spacing(4) }}
        >
          Whether you're drafting your first statement or formalising your
          existing process, Monochrome helps you meet obligations under the
          Modern Slavery Act 2018 without the hassle.
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
            Ready to streamline your next statement?
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
        <RelatedSolutions exclude="ms" />
      </Box>
    </>
  );
}
