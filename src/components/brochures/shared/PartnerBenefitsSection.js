import { Typography, Paper } from "@mui/material";

const PartnerBenefitsSection = ({ benefits = [], extras = [] }) => {
  return (
    <>
      <Typography variant="h6" sx={{ mt: 4 }} gutterBottom>
        Partner Benefits
      </Typography>
      {benefits.map((benefit, idx) => (
        <Paper key={idx} sx={{ p: 3, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {benefit.title}
          </Typography>
          <Typography variant="body2">{benefit.body}</Typography>
        </Paper>
      ))}

      <Typography variant="h6" sx={{ mt: 4 }} gutterBottom>
        Why Partner With Us?
      </Typography>
      {extras.map((extras, idx) => (
        <Paper key={idx} sx={{ p: 3, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {extras.title}
          </Typography>
          <Typography variant="body2">{extras.body}</Typography>
        </Paper>
      ))}
    </>
  );
};

export default PartnerBenefitsSection;
