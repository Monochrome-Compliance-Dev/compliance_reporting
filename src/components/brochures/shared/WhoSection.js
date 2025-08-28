import { Typography } from "@mui/material";

const WhoSection = ({ audience }) => {
  return (
    <>
      <Typography variant="h6" sx={{ mt: 4 }} gutterBottom>
        Who is it for?
      </Typography>
      <Typography variant="body2" paragraph>
        {audience}
      </Typography>
    </>
  );
};

export default WhoSection;
