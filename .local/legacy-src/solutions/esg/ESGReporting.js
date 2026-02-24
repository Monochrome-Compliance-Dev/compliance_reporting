import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  useTheme,
  useMediaQuery,
  CardContent,
  CardMedia,
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
            "Collect structured data across carbon, water, diversity, and supply chain metrics. Align inputs with ISSB S1/S2 and enable version-controlled entries.",
          iconComponent: AssessmentIcon,
          image: "/images/solutions/esg/metrics.jpg",
        },
        {
          title: "Guided Workflows",
          description:
            "Assign tasks by ESG topic, validate supporting evidence, and track contributor progress with assurance-ready logs and status indicators.",
          iconComponent: ChecklistIcon,
          image: "/images/solutions/esg/workflows.jpg",
        },
      ],
    },
    {
      title: "Report & Align",
      items: [
        {
          title: "Annual & Periodic Reporting",
          description:
            "Generate exportable ESG reports mapped to IFRS S1/S2, Australian climate disclosures, and industry-specific standards like SASB. Maintain audit-ready version history.",
          iconComponent: TimelineIcon,
          image: "/images/solutions/esg/reporting.jpg",
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
          ESG expectations are escalating — particularly under Australia’s new
          climate disclosure laws. Monochrome Compliance equips you to collect,
          structure, and disclose ESG data with rigour, clarity, and confidence.
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
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="230"
                      image={item.image}
                      alt={item.description}
                      sx={{ mb: 2, borderRadius: 1 }}
                      loading="lazy"
                    ></CardMedia>
                    <CardContent>
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
                    </CardContent>
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
            Get ahead of mandatory ESG reporting requirements
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
