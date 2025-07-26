import { Typography } from "@mui/material";

export default function FeaturesSection({ features }) {
  return (
    <>
      <Typography variant="h6" sx={{ mt: 4 }} gutterBottom>
        Key Features
      </Typography>
      <ul>
        {features.map((feature, idx) => (
          <li key={idx}>
            <Typography variant="body2">{feature}</Typography>
          </li>
        ))}
      </ul>
    </>
  );
}
