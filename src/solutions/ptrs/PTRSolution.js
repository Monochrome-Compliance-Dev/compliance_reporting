import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  useTheme,
  useMediaQuery,
  CardMedia,
  CardContent,
  CardHeader,
} from "@mui/material";
import PageMeta from "../../components/ui/PageMeta";
import { useNavigate } from "react-router";
import LockIcon from "@mui/icons-material/Lock";
import HistoryIcon from "@mui/icons-material/History";
import DescriptionIcon from "@mui/icons-material/Description";
import FunctionsIcon from "@mui/icons-material/Functions";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import RouteIcon from "@mui/icons-material/Route";
import RelatedSolutions from "../RelatedSolutions";

export default function PTRSolution() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const groupedFeatures = [
    {
      title: "Assess & Prepare",
      items: [
        {
          title: "Compliance Navigator",
          description:
            "A guided flowchart that helps you determine if your entity is required to report under the revised requirements of the Payment Times Reporting Amendment Act 2024.",
          iconComponent: RouteIcon,
        },
        {
          title: "Integrated Guidance",
          description:
            "Step-by-step helper texts and tooltips based on government documentation, ensuring you're never left guessing what a field means.",
          iconComponent: HelpOutlineIcon,
        },
      ],
    },
    {
      title: "Calculate & Report",
      items: [
        {
          title: "Automated Calculations",
          description:
            "Our platform calculates all required metrics like average payment time, percentiles, and compliance thresholds based on your dataset.",
          iconComponent: FunctionsIcon,
        },
        {
          title: "PDF Reporting",
          description:
            "Generate and download professional summary reports, or have them sent directly to your inbox.",
          iconComponent: DescriptionIcon,
        },
      ],
    },
    {
      title: "Secure & Track",
      items: [
        {
          title: "Audit Trail",
          description:
            "We take care of fulfilling your legislated requirements, including a complete audit trail and secure storage of your data and preparation for seven years.",
          iconComponent: () => (
            <HistoryIcon sx={{ color: theme.palette.text.primary }} />
          ),
        },
        {
          title: "Secure Multi-Tenant Architecture",
          description:
            "Data is isolated and secured at the database level, ensuring your records are never exposed to other users.",
          iconComponent: () => (
            <LockIcon sx={{ color: theme.palette.text.primary }} />
          ),
        },
      ],
    },
  ];

  return (
    <>
      <PageMeta
        title="PTRS Compliance"
        description="Automate your Payment Times Reporting with Monochrome Compliance’s guided navigator, ABN enrichment, and secure reporting workflows."
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
          PTRS Compliance, Done Right with Monochrome Compliance
        </Typography>

        <Typography
          variant="body1"
          color={theme.palette.text.secondary}
          sx={{ mb: theme.spacing(4) }}
        >
          From eligibility checks to report generation, Monochrome Compliance
          simplifies every step of the Payment Times Reporting process so you
          can focus on running your business.
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
                      height="140"
                      image={`/images/ptrs-card-${i}-${j}.png`}
                      alt={`${item.title} preview`}
                    />
                    <CardHeader
                      avatar={<item.iconComponent />}
                      title={item.title}
                      titleTypographyProps={{
                        variant: "subtitle1",
                        fontWeight: "bold",
                      }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
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
            Ready to take the stress out of PTR reporting?
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: isSmallScreen ? "column" : "row",
              justifyContent: "center",
            }}
          >
            {/* <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate("/compliance-navigator")}
              sx={{ width: isSmallScreen ? "100%" : "auto" }}
            >
              Launch the Compliance Navigator
            </Button> */}
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate("/contact")}
              sx={{ width: isSmallScreen ? "100%" : "auto" }}
            >
              Get in Touch
            </Button>
          </Box>
        </Box>
        <RelatedSolutions exclude="ptrs" />
      </Box>
    </>
  );
}
