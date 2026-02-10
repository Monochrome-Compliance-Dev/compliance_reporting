import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router";

const tiers = [
  {
    title: "PTRS — Per reporting entity",
    priceLabel: "$7,000",
    priceHint: "per reporting period",
    description: [
      "One reporting entity submission",
      "We consolidate and validate your exports",
      "Metrics calculated correctly and checked",
      "Submission-ready outputs + audit trail",
      "Calm comms and practical guidance",
    ],
    buttonText: "Talk to us",
    buttonVariant: "contained",
    buttonLink: "/contact",
  },
  {
    title: "PTRS — Complex org structures",
    priceLabel: "Let’s scope it",
    priceHint: "quickly and calmly",
    description: [
      "Multiple reporting entities, higher volumes, or fragmented exports",
      "Clear options and trade-offs before we start",
      "Minimum path to a defensible submission",
    ],
    buttonText: "Contact us",
    buttonVariant: "outlined",
    buttonLink: "/contact",
  },
];

export default function PriceTier() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        py: { xs: 4, sm: 6 },
        backgroundColor: theme.palette.background.default,
        px: { xs: 2, sm: 0 },
      }}
    >
      <Typography variant="h4" align="center" gutterBottom>
        Payment Times Reporting pricing
      </Typography>

      <Typography
        variant="subtitle1"
        align="center"
        color="text.secondary"
        component="p"
        gutterBottom
        sx={{ maxWidth: 820, mx: "auto" }}
      >
        Straightforward pricing. Most organisations are{" "}
        <strong>$7,000 per reporting entity</strong> per reporting period. If
        you have complex group structures or messy exports, we’ll scope it up
        front and keep it calm.
      </Typography>

      <Grid container spacing={3} justifyContent="center" sx={{ mt: 3 }}>
        {tiers.map((tier) => (
          <Grid
            item
            key={tier.title}
            xs={12}
            md={4}
            sx={{
              display: "flex",
            }}
          >
            <Card
              sx={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 6,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: 700, textTransform: "none" }}
                >
                  {tier.title}
                </Typography>

                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {tier.priceLabel}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {tier.priceHint}
                </Typography>

                <Box component="ul" sx={{ pl: 2.2, m: 0 }}>
                  {tier.description.map((line, index) => (
                    <Typography
                      component="li"
                      variant="body2"
                      key={index}
                      sx={{ whiteSpace: "normal", mb: 0.75 }}
                    >
                      {line}
                    </Typography>
                  ))}
                </Box>
              </CardContent>

              <Box sx={{ p: 2 }}>
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
