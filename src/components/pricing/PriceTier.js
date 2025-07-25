import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  useTheme,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { useNavigate } from "react-router";

const tiers = [
  {
    title: "Compliance Base",
    monthlyPrice: 2500,
    annualPrice: 2500 * 12 * 0.95,
    description: [
      "3 compliance obligations (e.g. Payment Times Reporting, Modern Slavery Statement)",
      "Guided template setup",
      "Deadline reminders",
      "Quarterly summary email",
      "Email support only",
    ],
    buttonText: "Get Started",
    buttonVariant: "outlined",
    buttonLink: "/signup",
  },
  {
    title: ".....   Compliance Growth",
    monthlyPrice: 4000,
    annualPrice: 4000 * 12 * 0.95,
    mostPopular: true,
    description: [
      "Everything in Base, plus:",
      "Unlimited obligations + report generation",
      "Whistleblower, ESG, Risk Register included",
      "Quarterly compliance dashboard",
      "4 hours/quarter advisory support",
      "Annual policy review (Code, Procurement, etc.)",
    ],
    buttonText: "Choose Growth",
    buttonVariant: "contained",
    buttonLink: "/signup",
  },
  {
    title: "Compliance Enterprise",
    monthlyPrice: 6500,
    annualPrice: 6500 * 12 * 0.95,
    description: [
      "Everything in Growth, plus:",
      "Custom training & onboarding",
      "Board-ready reporting (twice annually)",
      "Supplier risk scorecard + remediation",
      "Submission and document handling",
      "24h SLA for urgent compliance issues",
    ],
    buttonText: "Contact Sales",
    buttonVariant: "contained",
    buttonLink: "/contact",
  },
];

export default function PriceTier() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [billing, setBilling] = useState("monthly");
  const handleBillingChange = (_, newValue) => {
    if (newValue) setBilling(newValue);
  };

  return (
    <Box
      sx={{
        py: 2,
        backgroundColor: theme.palette.background.default,
        px: { xs: 2, sm: 0 },
        overflow: "visible",
      }}
    >
      <Typography variant="h4" align="center" gutterBottom>
        Pricing Plans
      </Typography>
      <Typography
        variant="subtitle1"
        align="center"
        color="text.secondary"
        component="p"
        gutterBottom
        sx={{ zIndex: 10 }}
      >
        Choose the level of support that’s right for your business
      </Typography>
      <Box textAlign="center" mt={2}>
        <ToggleButtonGroup
          value={billing}
          exclusive
          onChange={handleBillingChange}
          size="medium"
          color="primary"
        >
          <ToggleButton value="monthly">Monthly Billing</ToggleButton>
          <ToggleButton value="annual">Annual Billing (5% off)</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Grid container spacing={3} justifyContent="center" sx={{ mt: 2 }}>
        {tiers.map((tier) => (
          <Grid
            item
            key={tier.title}
            xs={12}
            sm="auto"
            sx={{
              maxWidth: 320,
              flex: "1 1 auto",
            }}
          >
            <Card
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                  boxShadow: 6,
                },
                "&:hover [data-ribbon] > div": {
                  boxShadow: `0 0 8px 2px ${theme.palette.warning.main}`,
                },
                position: "relative",
                overflow: "visible",
                width: { xs: "100%", sm: 350 },
              }}
            >
              {tier.mostPopular && (
                <Box
                  data-ribbon
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: 120,
                    height: 120,
                    overflow: "hidden",
                    zIndex: 5,
                    pointerEvents: "none",
                    "&:hover": {
                      filter: "drop-shadow(0 0 4px rgba(255, 193, 7, 0.6))",
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      width: 200,
                      left: -50,
                      top: 30,
                      transform: "rotate(-45deg)",
                      backgroundColor: theme.palette.warning.main,
                      color: theme.palette.getContrastText(
                        theme.palette.warning.main
                      ),
                      textAlign: "center",
                      fontWeight: "bold",
                      fontSize: 12,
                      py: 0.5,
                      boxShadow: 3,
                      transition: "box-shadow 0.3s ease",
                    }}
                  >
                    <StarIcon
                      sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.5 }}
                    />
                    Most Popular
                  </Box>
                </Box>
              )}
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                  px: 2,
                  py: 1,
                }}
              >
                <Typography
                  variant="h5"
                  align="center"
                  gutterBottom
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: "bold",
                    fontSize: "22px",
                    textTransform: "uppercase",
                  }}
                >
                  {tier.title}
                </Typography>
                <Box
                  sx={{
                    height: 3,
                    width: "60%",
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: 2,
                    mx: "auto",
                    mb: 2,
                  }}
                />
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {tier.description.map((line, index) => (
                    <Typography
                      component="li"
                      variant="subtitle1"
                      align="left"
                      key={index}
                      sx={{ whiteSpace: "normal" }}
                    >
                      {line}
                    </Typography>
                  ))}
                </ul>
              </CardContent>
              <Box
                sx={{
                  height: 3,
                  width: "60%",
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: 2,
                  mx: "auto",
                  mt: 1,
                }}
              />
              <Box
                sx={{
                  mt: 1,
                  mb: 2,
                  minHeight: 100,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                {tier.originalPrice && (
                  <Typography
                    variant="body2"
                    sx={{
                      textDecoration: "line-through",
                      fontSize: "0.85rem",
                      opacity: 0.7,
                    }}
                  >
                    {tier.originalPrice}
                  </Typography>
                )}
                {tier.discountPercentage && (
                  <Chip
                    label={`${tier.discountPercentage}% off`}
                    color="success"
                    size="small"
                    sx={{ mt: 1, mb: 1 }}
                  />
                )}
                {billing === "annual" && (
                  <Chip
                    label="Save 5%"
                    color="success"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                )}
                <Typography
                  variant="h4"
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-end",
                    gap: 1,
                  }}
                >
                  {billing === "monthly"
                    ? `$${tier.monthlyPrice.toLocaleString()}`
                    : `$${tier.annualPrice.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}`}
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{ opacity: 0.7, mb: 0.5 }}
                  >
                    {billing === "monthly" ? "/month" : "/year"}
                  </Typography>
                </Typography>
              </Box>
              <Box sx={{ py: 1, px: 2, textAlign: "center" }}>
                <Button
                  fullWidth
                  variant={tier.buttonVariant}
                  onClick={() =>
                    navigate(tier.buttonLink, { state: { tier: tier.title } })
                  }
                >
                  {tier.buttonText}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
