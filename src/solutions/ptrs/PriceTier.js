import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  useTheme,
  Chip,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { Link, useNavigate } from "react-router";

const tiers = [
  {
    title: "DIY",
    price: "$4,990",
    originalPrice: "$5,990",
    discountPercentage: 17,
    description: [
      "Access the full reporting preparation portal — no restrictions",
      "Automated compliance with the Payment Times Reporting rules",
      "Audit-ready records and tracked user activity",
      "Secure, long-term data retention for 7 years (regulatory requirement)",
      "Responsive support via email",
    ],
    buttonText: "Get Started",
    buttonVariant: "contained",
    buttonLink: "/signup",
  },
  {
    title: "Plus",
    price: "$9,990",
    originalPrice: "$12,990",
    discountPercentage: 23,
    mostPopular: true,
    description: [
      "Everything included in DIY",
      "We handle the preparation and submission of your PTR report",
      "You provide the data — we handle the rest",
      "Review and approve before we submit on your behalf",
      "Covers up to 5 organisations within the reporting entity",
    ],
    buttonText: "Upgrade to Plus",
    buttonVariant: "contained",
    buttonLink: "/signup",
  },
  {
    title: "Premium",
    price: "Price on request",
    description: [
      "Everything included in Plus",
      "Support for complex corporate structures and 6+ organisations within the reporting entity",
    ],
    buttonText: "Contact Us",
    buttonVariant: "contained",
    buttonLink: "/signup",
  },
];

export default function PriceTier() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        py: 6,
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
      <Grid container spacing={5} justifyContent="center" sx={{ mt: 4 }}>
        {tiers.map((tier) => (
          <Grid
            item
            key={tier.title}
            xs={12}
            sm="auto"
            sx={{
              maxWidth: 320,
              flex: "1 1 auto",
              // mx: "auto",
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
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {tier.price}
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
