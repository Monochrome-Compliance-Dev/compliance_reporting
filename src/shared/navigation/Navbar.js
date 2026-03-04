import { useRef, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Menu,
  MenuItem,
  Popper,
  Paper,
  MenuList,
  ClickAwayListener,
  Grow,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import Divider from "@mui/material/Divider";
import MenuIcon from "@mui/icons-material/Menu";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import ArticleIcon from "@mui/icons-material/Article";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { Link, useNavigate, useLocation } from "react-router";
import { useTheme } from "@mui/material/styles";
import { useAuthContext } from "context";
import { userService } from "slices/users/userApi";

export default function Navbar({ isDarkTheme, onToggleTheme }) {
  const { user } = useAuthContext();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const servicesAnchorRef = useRef(null);
  const [isServicesMenuOpen, setIsServicesMenuOpen] = useState(false);
  const handleServicesToggle = () => setIsServicesMenuOpen((prev) => !prev);
  const handleServicesClose = () => setIsServicesMenuOpen(false);
  const industriesAnchorRef = useRef(null);
  const [isIndustriesMenuOpen, setIsIndustriesMenuOpen] = useState(false);
  const handleIndustriesToggle = () => setIsIndustriesMenuOpen((prev) => !prev);
  const handleIndustriesClose = () => setIsIndustriesMenuOpen(false);
  const [companyAnchor, setCompanyAnchor] = useState(null);
  const handleCompanyOpen = (event) => setCompanyAnchor(event.currentTarget);
  const handleCompanyClose = () => setCompanyAnchor(null);
  const [exploreAnchor, setExploreAnchor] = useState(null);
  const handleExploreOpen = (event) => setExploreAnchor(event.currentTarget);
  const handleExploreClose = () => setExploreAnchor(null);
  const insightsAnchorRef = useRef(null);
  const [isInsightsMenuOpen, setIsInsightsMenuOpen] = useState(false);
  const handleInsightsToggle = () => setIsInsightsMenuOpen((prev) => !prev);
  const handleInsightsClose = () => setIsInsightsMenuOpen(false);

  // --- Marketing dropdown close delay helpers ---
  const marketingCloseTimerRef = useRef(null);

  const cancelMarketingClose = () => {
    if (marketingCloseTimerRef.current) {
      clearTimeout(marketingCloseTimerRef.current);
      marketingCloseTimerRef.current = null;
    }
  };

  const scheduleMarketingClose = (closeFn) => {
    cancelMarketingClose();
    marketingCloseTimerRef.current = setTimeout(() => {
      closeFn();
      marketingCloseTimerRef.current = null;
    }, 120);
  };

  // --- Desktop marketing dropdown helpers ---
  const closeAllMarketingDropdowns = () => {
    setIsServicesMenuOpen(false);
    setIsIndustriesMenuOpen(false);
    setIsInsightsMenuOpen(false);
  };

  const handleServicesOpen = () => {
    cancelMarketingClose();
    setIsIndustriesMenuOpen(false);
    setIsInsightsMenuOpen(false);
    setIsServicesMenuOpen(true);
  };

  const handleIndustriesOpen = () => {
    cancelMarketingClose();
    setIsServicesMenuOpen(false);
    setIsInsightsMenuOpen(false);
    setIsIndustriesMenuOpen(true);
  };

  const handleInsightsOpen = () => {
    cancelMarketingClose();
    setIsServicesMenuOpen(false);
    setIsIndustriesMenuOpen(false);
    setIsInsightsMenuOpen(true);
  };
  const navigate = useNavigate();
  const location = useLocation();
  const isPublicOnlyMode =
    String(process.env.REACT_APP_PUBLIC_ONLY).toLowerCase() === "true";
  const isAuthEnabled = !isPublicOnlyMode;

  const isMarketingRoute = !location.pathname.startsWith("/app");

  const isLoggedIn = isAuthEnabled && Boolean(user);

  // Shared marketing nav definition
  const marketingNav = {
    services: [
      { label: "Payment Times Reporting", to: "/payment-times-reporting" },
      { label: "Payment Health Check", to: "/construction-payment-diagnostic" },
    ],
    industries: [
      { label: "Construction", to: "/construction-payment-reporting" },
    ],
    company: [
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
    ],
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

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
          {isMarketingRoute && (
            <Box sx={{ display: "contents" }}>
              <Box
                ref={servicesAnchorRef}
                onMouseEnter={handleServicesOpen}
                onMouseLeave={() => scheduleMarketingClose(handleServicesClose)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 1.5,
                  px: 0.75,
                  py: 0.25,
                  transition: "background-color 120ms ease",
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                  },
                  "&:focus-within": {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <Button
                  color="inherit"
                  component={Link}
                  to="/services"
                  onClick={() => {
                    closeAllMarketingDropdowns();
                    handleMenuClose();
                  }}
                  sx={{
                    color: theme.palette.text.primary,
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: theme.typography.body1.fontSize,
                    minWidth: "auto",
                    px: 0.5,
                  }}
                >
                  Services
                </Button>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleServicesToggle();
                  }}
                  aria-label="Open services menu"
                  sx={{
                    color: theme.palette.text.primary,
                    ml: 0,
                    p: 0.5,
                    borderRadius: 1,
                    "&:hover": { backgroundColor: "transparent" },
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Box>
              <Popper
                open={isServicesMenuOpen}
                anchorEl={servicesAnchorRef.current}
                placement="bottom-start"
                transition
                sx={{ zIndex: theme.zIndex.modal }}
                modifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [0, 8],
                    },
                  },
                ]}
              >
                {({ TransitionProps }) => (
                  <Grow {...TransitionProps}>
                    <Paper
                      elevation={0}
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundColor: theme.palette.background.paper,
                        minWidth: 240,
                      }}
                      onMouseEnter={cancelMarketingClose}
                      onMouseLeave={() =>
                        scheduleMarketingClose(handleServicesClose)
                      }
                    >
                      <ClickAwayListener
                        onClickAway={() => {
                          handleServicesClose();
                        }}
                      >
                        <MenuList variant="menu" autoFocusItem={false}>
                          {marketingNav.services.map((item) => (
                            <MenuItem
                              key={item.to}
                              onClick={() => {
                                cancelMarketingClose();
                                closeAllMarketingDropdowns();
                                handleMenuClose();
                              }}
                              component={Link}
                              to={item.to}
                            >
                              {item.label}
                            </MenuItem>
                          ))}
                        </MenuList>
                      </ClickAwayListener>
                    </Paper>
                  </Grow>
                )}
              </Popper>

              <Box
                ref={industriesAnchorRef}
                onMouseEnter={handleIndustriesOpen}
                onMouseLeave={() =>
                  scheduleMarketingClose(handleIndustriesClose)
                }
                sx={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 1.5,
                  px: 0.75,
                  py: 0.25,
                  transition: "background-color 120ms ease",
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                  },
                  "&:focus-within": {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <Button
                  color="inherit"
                  component={Link}
                  to="/industries"
                  onClick={() => {
                    closeAllMarketingDropdowns();
                    handleMenuClose();
                  }}
                  sx={{
                    color: theme.palette.text.primary,
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: theme.typography.body1.fontSize,
                    minWidth: "auto",
                    px: 0.5,
                  }}
                >
                  Industries
                </Button>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleIndustriesToggle();
                  }}
                  aria-label="Open industries menu"
                  sx={{
                    color: theme.palette.text.primary,
                    ml: 0,
                    p: 0.5,
                    borderRadius: 1,
                    "&:hover": { backgroundColor: "transparent" },
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Box>
              <Popper
                open={isIndustriesMenuOpen}
                anchorEl={industriesAnchorRef.current}
                placement="bottom-start"
                transition
                sx={{ zIndex: theme.zIndex.modal }}
                modifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [0, 8],
                    },
                  },
                ]}
              >
                {({ TransitionProps }) => (
                  <Grow {...TransitionProps}>
                    <Paper
                      elevation={0}
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundColor: theme.palette.background.paper,
                        minWidth: 240,
                      }}
                      onMouseEnter={cancelMarketingClose}
                      onMouseLeave={() =>
                        scheduleMarketingClose(handleIndustriesClose)
                      }
                    >
                      <ClickAwayListener
                        onClickAway={() => {
                          handleIndustriesClose();
                        }}
                      >
                        <MenuList variant="menu" autoFocusItem={false}>
                          {marketingNav.industries.map((item) => (
                            <MenuItem
                              key={item.to}
                              onClick={() => {
                                cancelMarketingClose();
                                closeAllMarketingDropdowns();
                                handleMenuClose();
                              }}
                              component={Link}
                              to={item.to}
                            >
                              {item.label}
                            </MenuItem>
                          ))}
                        </MenuList>
                      </ClickAwayListener>
                    </Paper>
                  </Grow>
                )}
              </Popper>

              <Box
                ref={insightsAnchorRef}
                onMouseEnter={handleInsightsOpen}
                onMouseLeave={() => scheduleMarketingClose(handleInsightsClose)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 1.5,
                  px: 0.75,
                  py: 0.25,
                  transition: "background-color 120ms ease",
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                  },
                  "&:focus-within": {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <Button
                  color="inherit"
                  component={Link}
                  to="/insights"
                  onClick={() => {
                    closeAllMarketingDropdowns();
                    handleMenuClose();
                  }}
                  sx={{
                    color: theme.palette.text.primary,
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: theme.typography.body1.fontSize,
                    minWidth: "auto",
                    px: 0.5,
                  }}
                >
                  Insights
                </Button>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleInsightsToggle();
                  }}
                  aria-label="Open insights menu"
                  sx={{
                    color: theme.palette.text.primary,
                    ml: 0,
                    p: 0.5,
                    borderRadius: 1,
                    "&:hover": { backgroundColor: "transparent" },
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Box>
              <Popper
                open={isInsightsMenuOpen}
                anchorEl={insightsAnchorRef.current}
                placement="bottom-start"
                transition
                sx={{ zIndex: theme.zIndex.modal }}
                modifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [0, 8],
                    },
                  },
                ]}
              >
                {({ TransitionProps }) => (
                  <Grow {...TransitionProps}>
                    <Paper
                      elevation={0}
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundColor: theme.palette.background.paper,
                        minWidth: 220,
                      }}
                      onMouseEnter={cancelMarketingClose}
                      onMouseLeave={() =>
                        scheduleMarketingClose(handleInsightsClose)
                      }
                    >
                      <ClickAwayListener
                        onClickAway={() => {
                          handleInsightsClose();
                        }}
                      >
                        <MenuList variant="menu" autoFocusItem={false}>
                          <MenuItem
                            onClick={() => {
                              cancelMarketingClose();
                              closeAllMarketingDropdowns();
                              handleMenuClose();
                            }}
                            component={Link}
                            to="/insights"
                          >
                            Industry Insights
                          </MenuItem>
                          <MenuItem
                            onClick={() => {
                              cancelMarketingClose();
                              closeAllMarketingDropdowns();
                              handleMenuClose();
                            }}
                            component={Link}
                            to="/insights/blog"
                          >
                            Blog
                          </MenuItem>
                        </MenuList>
                      </ClickAwayListener>
                    </Paper>
                  </Grow>
                )}
              </Popper>

              <Button
                color="inherit"
                onClick={handleCompanyOpen}
                sx={{
                  color: theme.palette.text.primary,
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: theme.typography.body1.fontSize,
                }}
                endIcon={<ExpandMoreIcon />}
              >
                Company
              </Button>
              <Menu
                anchorEl={companyAnchor}
                open={Boolean(companyAnchor)}
                onClose={handleCompanyClose}
                sx={{ mt: 1 }}
              >
                {marketingNav.company.map((item) => (
                  <MenuItem
                    key={item.to}
                    onClick={() => {
                      handleCompanyClose();
                      handleMenuClose();
                    }}
                    component={Link}
                    to={item.to}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          )}
          {isLoggedIn && !isMarketingRoute && (
            <Box sx={{ display: "contents" }}>
              <Button
                color="inherit"
                onClick={handleExploreOpen}
                sx={{
                  color: theme.palette.text.secondary,
                  alignItems: "center",
                }}
                endIcon={<ExpandMoreIcon />}
              >
                Explore
              </Button>
              <Menu
                anchorEl={exploreAnchor}
                open={Boolean(exploreAnchor)}
                onClose={handleExploreClose}
                sx={{ mt: 1 }}
              >
                <MenuItem onClick={handleExploreClose} disabled>
                  Services
                </MenuItem>
                {marketingNav.services.map((item) => (
                  <MenuItem
                    key={item.to}
                    onClick={handleExploreClose}
                    component={Link}
                    to={item.to}
                  >
                    <AccessTimeIcon sx={{ fontSize: 20, mr: 1 }} />
                    {item.label}
                  </MenuItem>
                ))}

                <Divider />

                <MenuItem onClick={handleExploreClose} disabled>
                  Industries
                </MenuItem>
                {marketingNav.industries.map((item) => (
                  <MenuItem
                    key={item.to}
                    onClick={handleExploreClose}
                    component={Link}
                    to={item.to}
                  >
                    <WorkOutlineIcon sx={{ fontSize: 20, mr: 1 }} />
                    {item.label}
                  </MenuItem>
                ))}

                <Divider />

                <MenuItem onClick={handleExploreClose} disabled>
                  Insights
                </MenuItem>
                <MenuItem
                  onClick={handleExploreClose}
                  component={Link}
                  to="/insights"
                >
                  <ArticleIcon sx={{ fontSize: 20, mr: 1 }} />
                  Industry Insights
                </MenuItem>
                <MenuItem
                  onClick={handleExploreClose}
                  component={Link}
                  to="/insights/blog"
                >
                  <ArticleIcon sx={{ fontSize: 20, mr: 1 }} />
                  Blog
                </MenuItem>

                <Divider />

                <MenuItem onClick={handleExploreClose} disabled>
                  Company
                </MenuItem>
                {marketingNav.company.map((item) => (
                  <MenuItem
                    key={item.to}
                    onClick={handleExploreClose}
                    component={Link}
                    to={item.to}
                  >
                    {item.to === "/contact" ? (
                      <MailOutlineIcon sx={{ fontSize: 20, mr: 1 }} />
                    ) : (
                      <InfoIcon sx={{ fontSize: 20, mr: 1 }} />
                    )}
                    {item.label}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          )}
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
            {isLoggedIn && !isMarketingRoute && (
              <MenuItem
                onClick={handleMenuClose}
                component={Link}
                to="/app"
                sx={{ color: theme.palette.text.primary }}
              >
                <WorkOutlineIcon sx={{ fontSize: 20, mr: 1 }} />
                Open Workspace
              </MenuItem>
            )}
            <Divider />
            {isMarketingRoute && (
              <Box sx={{ display: "contents" }}>
                <MenuItem
                  onClick={handleMenuClose}
                  component={Link}
                  to="/services"
                  sx={{ color: theme.palette.text.primary }}
                >
                  Services overview
                </MenuItem>
                <Divider />
                {marketingNav.services.map((item) => (
                  <MenuItem
                    key={item.to}
                    onClick={handleMenuClose}
                    component={Link}
                    to={item.to}
                    sx={{ color: theme.palette.text.primary }}
                  >
                    {item.label}
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem
                  onClick={handleMenuClose}
                  component={Link}
                  to="/industries"
                  sx={{ color: theme.palette.text.primary }}
                >
                  Industries overview
                </MenuItem>
                {marketingNav.industries.map((item) => (
                  <MenuItem
                    key={item.to}
                    onClick={handleMenuClose}
                    component={Link}
                    to={item.to}
                    sx={{ color: theme.palette.text.primary }}
                  >
                    {item.label}
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem
                  onClick={handleMenuClose}
                  component={Link}
                  to="/insights"
                  sx={{ color: theme.palette.text.primary }}
                >
                  Industry Insights
                </MenuItem>
                <MenuItem
                  onClick={handleMenuClose}
                  component={Link}
                  to="/insights/blog"
                  sx={{ color: theme.palette.text.primary }}
                >
                  Blog
                </MenuItem>
                <Divider />
                {marketingNav.company.map((item) => (
                  <MenuItem
                    key={item.to}
                    onClick={handleMenuClose}
                    component={Link}
                    to={item.to}
                    sx={{ color: theme.palette.text.primary }}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </Box>
            )}
          </Menu>
        </Box>
        {/* Book a Call CTA removed */}
        {isLoggedIn && (
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            onClick={() => navigate("/app")}
            startIcon={<WorkOutlineIcon sx={{ fontSize: 18 }} />}
            aria-label="Open workspace"
            sx={{
              ml: 1,
              fontWeight: 600,
              px: 1.25,
              py: 0.5,
              borderColor: theme.palette.divider,
              display: { xs: "none", md: "inline-flex" },
              "&:hover": { borderColor: theme.palette.text.secondary },
            }}
          >
            Workspace
          </Button>
        )}
        {/* Dynamic Login/Logout button */}
        {!isLoggedIn && !isPublicOnlyMode && (
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate("/login")}
            sx={{ ml: 2, fontWeight: 600 }}
          >
            Login
          </Button>
        )}
        {isLoggedIn && (
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
