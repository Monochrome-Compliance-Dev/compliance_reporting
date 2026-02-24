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
import InsightsIcon from "@mui/icons-material/Insights";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LockIcon from "@mui/icons-material/Lock";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import TimelineIcon from "@mui/icons-material/Timeline";
import RelatedSolutions from "../RelatedSolutions";
import PageMeta from "../../components/ui/PageMeta";

export default function WorkingCapitalAnalysis() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const groupedFeatures = [
    {
      title: "Track & Analyse",
      items: [
        {
          title: "Payment Terms Intelligence",
          description:
            "Get visibility into actual versus contracted payment terms across your supplier base.",
          iconComponent: TimelineIcon,
        },
        {
          title: "Cash Flow Lens",
          description:
            "Understand how payment behaviour impacts your working capital and liquidity profile.",
          iconComponent: MonetizationOnIcon,
        },
      ],
    },
    {
      title: "Benchmark & Report",
      items: [
        {
          title: "Compare to Industry",
          description:
            "Benchmark against industry peers or previous reporting periods using consistent methodology.",
          iconComponent: AssessmentIcon,
        },
        {
          title: "Executive Summaries",
          description:
            "Auto-generate board-ready insights and export key metrics to Excel or PDF.",
          iconComponent: InsightsIcon,
        },
      ],
    },
    {
      title: "Retain & Protect",
      items: [
        {
          title: "Secure & Compliant",
          description:
            "Built on the same secure architecture as all Monochrome Compliance solutions.",
          iconComponent: LockIcon,
        },
        {
          title: "Data Controls",
          description:
            "Access is role-based, audit-logged, and fully segregated by client.",
          iconComponent: VerifiedUserIcon,
        },
      ],
    },
  ];

  return (
    <>
      <PageMeta
        title="Working Capital Analysis"
        description="Uncover insights from payment terms and cash flow behaviour across your supplier data with Monochrome Compliance."
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
          Working Capital Visibility Without the Spreadsheet Nightmare
        </Typography>

        <Typography
          variant="body1"
          color={theme.palette.text.secondary}
          sx={{ mb: theme.spacing(4) }}
        >
          Monochrome Compliance gives you financial insight from supplier
          payment behaviour — automatically extracted and benchmarked across
          your data.
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
            Want to surface insights from your next report?
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

        <RelatedSolutions exclude="wc" />
      </Box>
    </>
  );
}
