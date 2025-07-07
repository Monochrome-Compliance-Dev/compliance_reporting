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
import AssessmentIcon from "@mui/icons-material/Assessment";
import TimelineIcon from "@mui/icons-material/Timeline";
import ChecklistIcon from "@mui/icons-material/Checklist";
import PageMeta from "../../components/ui/PageMeta";
import RelatedSolutions from "../RelatedSolutions";

export default function ESGReporting() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const groupedFeatures = [
    {
      title: "Capture & Track",
      items: [
        {
          title: "Centralised Metrics",
          description:
            "Track carbon emissions, diversity stats, modern slavery inputs, and other ESG indicators from a unified dashboard.",
          iconComponent: AssessmentIcon,
        },
        {
          title: "Guided Workflows",
          description:
            "Prompt contributors for input, track status by ESG domain, and export a consistent, governance-ready report.",
          iconComponent: ChecklistIcon,
        },
      ],
    },
    {
      title: "Report & Align",
      items: [
        {
          title: "Annual & Periodic Reporting",
          description:
            "Generate reporting outputs aligned with TCFD, SASB, or local ESG disclosure frameworks. Review history with audit-ready logs.",
          iconComponent: TimelineIcon,
        },
      ],
    },
  ];

  return (
    <>
      <PageMeta
        title="ESG Reporting"
        description="Streamline Environmental, Social, and Governance (ESG) reporting with practical workflows and template-driven outputs from Monochrome Compliance."
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
          Practical ESG reporting — without reinventing your workflow
        </Typography>

        <Typography
          variant="body1"
          color={theme.palette.text.secondary}
          sx={{ mb: theme.spacing(4) }}
        >
          ESG obligations are evolving quickly, but your process doesn't have
          to. Monochrome Compliance helps you collect, structure and publish ESG
          data with clarity and consistency.
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
            Ready to streamline ESG reporting?
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
        <RelatedSolutions exclude="esg" />
      </Box>
    </>
  );
}
