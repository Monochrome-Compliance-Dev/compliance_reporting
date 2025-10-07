import { Typography } from "@mui/material";

const WhatSection = ({ description }) => {
  return (
    <>
      <Typography variant="h6" gutterBottom>
        What is it?
      </Typography>
      <Typography variant="body2" paragraph>
        {description}
      </Typography>
    </>
  );
};

export default WhatSection;
