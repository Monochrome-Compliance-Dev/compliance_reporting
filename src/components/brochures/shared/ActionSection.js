import { Box, Typography } from "@mui/material";
import React from "react";

const ActionSection = ({ actions }) => {
  const { title, intro, items = [] } = actions;
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" paragraph>
        {intro}
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          alignItems: "center",
          mt: 2,
        }}
      >
        {items.map((action, idx) => (
          <React.Fragment key={idx}>
            <Box
              component="img"
              src={action.src}
              alt={action.alt}
              sx={{
                maxWidth: "100%",
                borderRadius: 2,
                boxShadow: 2,
              }}
            />
            <Typography variant="caption" color="textSecondary">
              {action.caption}
            </Typography>
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
};

export default ActionSection;
