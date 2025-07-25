import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import FolderIcon from "@mui/icons-material/Folder";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Divider from "@mui/material/Divider";
import MenuIcon from "@mui/icons-material/Menu";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import Tooltip from "@mui/material/Tooltip";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import { Link, useNavigate, useLocation } from "react-router";
import { useTheme } from "@mui/material/styles";
import { userService } from "../../services";
import { useAuthContext } from "../../context/AuthContext";

export default function Navbar({ isDarkTheme, onToggleTheme }) {
  const { user } = useAuthContext();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [gettingStartedAnchor, setGettingStartedAnchor] = useState(null);
  const [connectAnchor, setConnectAnchor] = useState(null);
  const [partnersAnchor, setPartnersAnchor] = useState(null);
  const handlePartnersOpen = (event) => setPartnersAnchor(event.currentTarget);
  const handlePartnersClose = () => setPartnersAnchor(null);
  const [adminAnchor, setAdminAnchor] = useState(null);
  const [solutionsAnchor, setSolutionsAnchor] = useState(null);
  const handleSolutionsOpen = (event) =>
    setSolutionsAnchor(event.currentTarget);
  const handleSolutionsClose = () => setSolutionsAnchor(null);
  const [productsAnchor, setProductsAnchor] = useState(null);
  const handleProductsOpen = (event) => setProductsAnchor(event.currentTarget);
  const handleProductsClose = () => setProductsAnchor(null);
  const handleConnectOpen = (event) => setConnectAnchor(event.currentTarget);
  const handleConnectClose = () => setConnectAnchor(null);
  const handleAdminOpen = (event) => setAdminAnchor(event.currentTarget);
  const handleAdminClose = () => setAdminAnchor(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = Boolean(user);
  const hideNavLinks =
    location.pathname.includes("/dashboard") ||
    location.pathname.includes("/data") ||
    location.pathname.includes("/report");

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleGettingStartedOpen = (event) =>
    setGettingStartedAnchor(event.currentTarget);
  const handleGettingStartedClose = () => setGettingStartedAnchor(null);

  const handleLogout = async () => {
    try {
      userService.logout();
      handleMenuClose();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error); // Log the error
      alert("Failed to log out. Please try again."); // Display a user-friendly message
    }
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: theme.palette.background.navbar,
        color: theme.palette.text.primary,
        backgroundImage: "none", // Explicitly remove the gradient
        width: "100%",
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            color: theme.palette.text.primary,
          }}
        >
          <Box
            component="img"
            src={
              isDarkTheme
                ? // ? "/images/logos/logo-dark-thin.png"
                  "https://monochrome-assets.s3.ap-southeast-2.amazonaws.com/logo-dark-no-background.png"
                : "https://monochrome-assets.s3.ap-southeast-2.amazonaws.com/logo-light-no-background.png"
            }
            alt="Monochrome Compliance Logo"
            sx={{
              height: "auto",
              maxWidth: { xs: "200px", md: "300px" },
              width: "100%",
              objectFit: "contain",
              mt: 1.5,
              mb: 0.5,
              ml: -1.5,
              cursor: "pointer",
              "&:hover": {
                opacity: 0.8,
              },
            }}
            onClick={() => {
              navigate("/");
            }}
          />
        </Typography>
        <Box sx={{ display: { xs: "none", md: "flex" } }}>
          <Button
            color="inherit"
            onClick={handleSolutionsOpen}
            sx={{
              color: theme.palette.text.primary,
              display: "flex",
              alignItems: "center",
            }}
            endIcon={<ExpandMoreIcon />}
          >
            Solutions
          </Button>
          <Menu
            anchorEl={solutionsAnchor}
            open={Boolean(solutionsAnchor)}
            onClose={handleSolutionsClose}
            sx={{ mt: 1 }}
          >
            <MenuItem
              onClick={handleSolutionsClose}
              component={Link}
              to="/solutions"
            >
              <InfoIcon sx={{ fontSize: 20, mr: 1 }} />
              Overview
            </MenuItem>
            <MenuItem
              onClick={handleSolutionsClose}
              component={Link}
              to="/pricing"
            >
              <InfoIcon sx={{ fontSize: 20, mr: 1 }} />
              Pricing
            </MenuItem>
          </Menu>
          <Button
            color="inherit"
            onClick={handleProductsOpen}
            sx={{
              color: theme.palette.text.primary,
              display: "flex",
              alignItems: "center",
            }}
            endIcon={<ExpandMoreIcon />}
          >
            Products
          </Button>
          <Menu
            anchorEl={productsAnchor}
            open={Boolean(productsAnchor)}
            onClose={handleProductsClose}
            sx={{ mt: 1 }}
          >
            <MenuItem
              onClick={handleProductsClose}
              component={Link}
              to="/payment-times-reporting"
            >
              <InfoIcon sx={{ fontSize: 20, mr: 1 }} />
              PTR Solution
            </MenuItem>
            <MenuItem
              onClick={handleProductsClose}
              component={Link}
              to="/modern-slavery"
            >
              <InfoIcon sx={{ fontSize: 20, mr: 1 }} />
              Modern Slavery
            </MenuItem>
            <MenuItem
              onClick={handleProductsClose}
              component={Link}
              to="/whistleblower-compliance"
            >
              <InfoIcon sx={{ fontSize: 20, mr: 1 }} />
              Whistleblower Compliance
            </MenuItem>
            <MenuItem
              onClick={handleProductsClose}
              component={Link}
              to="/director-obligations"
            >
              <InfoIcon sx={{ fontSize: 20, mr: 1 }} />
              Director Obligations
            </MenuItem>
            <MenuItem
              onClick={handleProductsClose}
              component={Link}
              to="/risk-register"
            >
              <InfoIcon sx={{ fontSize: 20, mr: 1 }} />
              Risk Register
            </MenuItem>
            <MenuItem
              onClick={handleProductsClose}
              component={Link}
              to="/working-capital"
            >
              <InfoIcon sx={{ fontSize: 20, mr: 1 }} />
              Working Capital Analysis
            </MenuItem>
            <MenuItem
              onClick={handleProductsClose}
              component={Link}
              to="/esg-reporting"
            >
              <InfoIcon sx={{ fontSize: 20, mr: 1 }} />
              ESG Reporting
            </MenuItem>
          </Menu>
          {/* <Button
            color="inherit"
            onClick={handleGettingStartedOpen}
            sx={{
              color: theme.palette.text.primary,
              display: "flex",
              alignItems: "center",
            }}
            endIcon={<ExpandMoreIcon />}
          >
            Getting Started
          </Button>
          <Menu
            anchorEl={gettingStartedAnchor}
            open={Boolean(gettingStartedAnchor)}
            onClose={handleGettingStartedClose}
            sx={{ mt: 1 }}
          >
            <MenuItem
              onClick={handleGettingStartedClose}
              component={Link}
              to="/overview"
            >
              <InfoIcon sx={{ fontSize: 20, mr: 1 }} />
              Overview
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={handleGettingStartedClose}
              component={Link}
              to="/resources"
            >
              <FolderIcon sx={{ fontSize: 20, mr: 1 }} />
              Resources
            </MenuItem>
            <MenuItem
              onClick={handleGettingStartedClose}
              component={Link}
              to="/faq"
            >
              <HelpOutlineIcon sx={{ fontSize: 20, mr: 1 }} />
              FAQ
            </MenuItem>
          </Menu> */}
          <Button
            color="inherit"
            onClick={handlePartnersOpen}
            sx={{
              color: theme.palette.text.primary,
              display: "flex",
              alignItems: "center",
            }}
            endIcon={<ExpandMoreIcon />}
          >
            Partners
          </Button>
          <Menu
            anchorEl={partnersAnchor}
            open={Boolean(partnersAnchor)}
            onClose={handlePartnersClose}
            sx={{ mt: 1 }}
          >
            <MenuItem
              onClick={handlePartnersClose}
              component={Link}
              to="/partners"
            >
              <InfoIcon sx={{ fontSize: 20, mr: 1 }} />
              Overview
            </MenuItem>
            <MenuItem
              onClick={handlePartnersClose}
              component={Link}
              to="/partners/products/modern-slavery"
            >
              <InfoIcon sx={{ fontSize: 20, mr: 1 }} />
              Modern Slavery
            </MenuItem>
          </Menu>
          <Button
            color="inherit"
            onClick={handleConnectOpen}
            sx={{
              color: theme.palette.text.primary,
              display: "flex",
              alignItems: "center",
            }}
            endIcon={<ExpandMoreIcon />}
          >
            Connect
          </Button>
          <Menu
            anchorEl={connectAnchor}
            open={Boolean(connectAnchor)}
            onClose={handleConnectClose}
            sx={{ mt: 1 }}
          >
            <MenuItem
              onClick={handleConnectClose}
              component={Link}
              to="/contact"
            >
              <InfoIcon sx={{ fontSize: 20, mr: 1 }} />
              Contact
            </MenuItem>
            <MenuItem onClick={handleConnectClose} component={Link} to="/blog">
              <HelpOutlineIcon sx={{ fontSize: 20, mr: 1 }} />
              Blog
            </MenuItem>
            <MenuItem onClick={handleConnectClose} component={Link} to="/about">
              <InfoIcon sx={{ fontSize: 20, mr: 1 }} />
              About
            </MenuItem>
          </Menu>
        </Box>
        <Box sx={{ display: { xs: "flex", md: "none" } }}>
          <IconButton
            color="inherit"
            aria-label="menu"
            onClick={handleMenuOpen}
            sx={{ color: theme.palette.text.primary }}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            sx={{ backgroundColor: theme.palette.background.paper }}
          >
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/solutions"
              sx={{ color: theme.palette.text.primary }}
            >
              Solutions Overview
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/pricing"
              sx={{ color: theme.palette.text.primary }}
            >
              Pricing
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/payment-times-reporting"
              sx={{ color: theme.palette.text.primary }}
            >
              PTR Solution
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/modern-slavery"
              sx={{ color: theme.palette.text.primary }}
            >
              Modern Slavery
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/whistleblower-compliance"
              sx={{ color: theme.palette.text.primary }}
            >
              Whistleblower Compliance
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/director-obligations"
              sx={{ color: theme.palette.text.primary }}
            >
              Director Obligations
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/risk-register"
              sx={{ color: theme.palette.text.primary }}
            >
              Risk Register
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/working-capital"
              sx={{ color: theme.palette.text.primary }}
            >
              Working Capital Analysis
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/esg-reporting"
              sx={{ color: theme.palette.text.primary }}
            >
              ESG Reporting
            </MenuItem>
            {/* <Divider />
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/overview"
              sx={{ color: theme.palette.text.primary }}
            >
              Overview
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/resources"
              sx={{ color: theme.palette.text.primary }}
            >
              Resources
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/faq"
              sx={{ color: theme.palette.text.primary }}
            >
              FAQ
            </MenuItem> */}
            <Divider />
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/contact"
              sx={{ color: theme.palette.text.primary }}
            >
              Contact
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/blog"
              sx={{ color: theme.palette.text.primary }}
            >
              Blog
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/about"
              sx={{ color: theme.palette.text.primary }}
            >
              About
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/partners"
              sx={{ color: theme.palette.text.primary }}
            >
              Partners
            </MenuItem>
          </Menu>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/contact")}
          sx={{
            ml: 2,
            fontWeight: 600,
            display: { xs: "none", md: "inline-flex" },
          }}
        >
          Book a Call
        </Button>
        {/* Dynamic Login/Logout button */}
        {!isLoggedIn ? (
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate("/login")}
            sx={{ ml: 2, fontWeight: 600 }}
          >
            Login
          </Button>
        ) : (
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleLogout}
            sx={{ ml: 2, fontWeight: 600 }}
          >
            Logout
          </Button>
        )}
        <IconButton
          sx={{ ml: 1, color: theme.palette.text.primary }}
          onClick={onToggleTheme}
          color="inherit"
          aria-label="toggle theme"
        >
          {isDarkTheme ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
