import React, { useState } from "react";
import {
  Box,
  Typography,
  Drawer,
  List,
  ListItem,
  Link,
  TextField,
  Button,
  IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useTheme, useMediaQuery } from "@mui/material";
import { userService } from "../../services";

const drawerWidth = 240;

const PolicyDocument = ({ title, lastUpdated, sections }) => {
  const user = userService.userValue;
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const filteredSections = sections.filter((section) =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toolbarHeight = 64 * 2;

  const drawerContent = (
    <List>
      {filteredSections.map(({ id, title }) => (
        <ListItem key={id} disablePadding>
          <Link
            href={`#${id}`}
            underline="hover"
            sx={{
              pl: 2,
              py: 1,
              color: "text.primary",
            }}
            onClick={() => isMobile && setMobileOpen(false)}
          >
            {title}
          </Link>
        </ListItem>
      ))}
    </List>
  );

  return (
    <Box sx={{ display: "flex" }}>
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{
            position: "fixed",
            top: `${toolbarHeight}px`,
            left: 8,
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: theme.palette.background.paper,
            border: "1px solid",
            borderColor: theme.palette.divider,
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          display: { xs: "block", sm: "block" },
          "& .MuiDrawer-paper": {
            position: isMobile ? "fixed" : "fixed",
            top: `${toolbarHeight}px`,
            height: `calc(100vh - ${toolbarHeight}px)`,
            width: drawerWidth,
            boxSizing: "border-box",
            overflowY: "auto",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: `${toolbarHeight + 24}px`,
          px: 6,
          ml: 0,
          width: "100%",
          maxWidth: "100%",
          overflowWrap: "break-word",
        }}
      >
        <Typography variant="h3" gutterBottom>
          {title}
        </Typography>

        <Typography variant="subtitle2" gutterBottom>
          Last Updated: {lastUpdated}
        </Typography>

        {user && (
          <Box sx={{ mb: 2 }}>
            <Button variant="contained" color="primary">
              Download PDF
            </Button>
          </Box>
        )}

        <TextField
          label="Search Sections"
          variant="outlined"
          size="small"
          fullWidth
          sx={{ mb: 4, maxWidth: 400 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {filteredSections.map(({ id, title, content }) => (
          <Box key={id} id={id} sx={{ mb: 6 }}>
            <Typography variant="h4" gutterBottom>
              {title}
            </Typography>
            {content}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PolicyDocument;
