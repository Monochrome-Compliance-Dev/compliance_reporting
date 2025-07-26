import {
  Box,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

const defaultTiers = [
  {
    name: "Free Trial",
    price: "Free",
    description: "Try it out with limited access",
    features: ["Access one module", "Up to 5 users", "Email support only"],
  },
  {
    name: "Essentials",
    price: "$950/mo",
    description: "Full access to one compliance module",
    features: ["All core features", "Unlimited users", "Priority support"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Multi-module access & white-labelling",
    features: [
      "Includes all features",
      "Dedicated account manager",
      "Custom integrations",
    ],
  },
];

export default function PricingSection({
  headline = "Transparent, partner-friendly pricing",
  subheadline = "Simple tiers that scale with your ambitions",
  tiers = defaultTiers,
}) {
  const theme = useTheme();

  return (
    <Box sx={{ my: 6 }}>
      <Typography
        variant="h4"
        gutterBottom
        align="center"
        color={theme.palette.text.primary}
      >
        {headline}
      </Typography>
      <Typography
        variant="subtitle1"
        gutterBottom
        align="center"
        color={theme.palette.text.primary}
      >
        {subheadline}
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 3,
          mt: 4,
        }}
      >
        {tiers.map((tier, index) => (
          <Paper
            key={index}
            elevation={3}
            sx={{
              p: 3,
              width: 280,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              color={theme.palette.text.primary}
            >
              {tier.name}
            </Typography>
            <Typography
              variant="h5"
              gutterBottom
              color={theme.palette.text.primary}
            >
              {tier.price}
            </Typography>
            <Typography
              variant="body2"
              gutterBottom
              color={theme.palette.text.primary}
            >
              {tier.description}
            </Typography>
            <Divider sx={{ my: 2, borderColor: theme.palette.divider }} />
            <List dense>
              {tier.features.map((feature, i) => (
                <ListItem key={i} disablePadding>
                  <ListItemText primary={feature} />
                </ListItem>
              ))}
            </List>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
