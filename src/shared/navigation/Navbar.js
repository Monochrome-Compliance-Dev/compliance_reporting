import { useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Divider,
  IconButton,
  ListSubheader,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MenuIcon from "@mui/icons-material/Menu";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { useTheme } from "@mui/material/styles";
import { Link, useLocation, useNavigate } from "react-router";
import { useAlert, useAuthContext } from "../../context";
import { userService } from "slices/users/userApi";

const marketingNav = {
  services: {
    label: "Services",
    to: "/services",
    items: [
      {
        label: "Payment Times Reporting",
        to: "/payment-times-reporting",
      },
      {
        label: "Payment Health Check",
        to: "/payment-health-check",
      },
      {
        label: "Pricing",
        to: "/pricing",
      },
    ],
  },
  industries: {
    label: "Industries",
    to: "/industries",
    items: [
      {
        label: "Construction",
        to: "/construction-payment-reporting",
      },
    ],
  },
  insights: {
    label: "Insights",
    to: "/insights",
    items: [
      {
        label: "Knowledge Centre",
        to: "/insights/knowledge",
      },
      {
        label: "Blog",
        to: "/insights/blog",
      },
    ],
  },
  company: {
    label: "Company",
    to: "/about",
    items: [
      {
        label: "Contact",
        to: "/contact",
      },
    ],
  },
};

export default function Navbar({ isDarkTheme, onToggleTheme }) {
  const { user } = useAuthContext();
  const { showAlert } = useAlert();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileAnchor, setMobileAnchor] = useState(null);
  const [desktopMenu, setDesktopMenu] = useState({
    key: null,
    anchorEl: null,
  });

  const isPublicOnlyMode =
    String(process.env.REACT_APP_PUBLIC_ONLY).toLowerCase() === "true";

  const isAuthEnabled = !isPublicOnlyMode;
  const isLoggedIn = isAuthEnabled && Boolean(user);
  const isMarketingRoute = !location.pathname.startsWith("/app");

  const isPathActive = (path, exact = false) =>
    exact
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const openDesktopMenu = (key, event) => {
    setDesktopMenu({
      key,
      anchorEl: event.currentTarget,
    });
  };

  const closeDesktopMenu = () => {
    setDesktopMenu({
      key: null,
      anchorEl: null,
    });
  };

  const openMobileMenu = (event) => {
    setMobileAnchor(event.currentTarget);
  };

  const closeMobileMenu = () => {
    setMobileAnchor(null);
  };

  const handleLogout = async () => {
    try {
      await userService.logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      showAlert("Failed to log out. Please try again.", "error");
    }
  };

  const navLinkSx = (active = false) => ({
    minWidth: "auto",
    px: 1,
    py: 0.75,
    borderRadius: 1.5,
    color: theme.palette.text.primary,
    backgroundColor: active ? theme.palette.action.selected : "transparent",
    fontSize: theme.typography.body2.fontSize,
    fontWeight: active ? 700 : 500,
    lineHeight: 1.25,
    textTransform: "none",
    whiteSpace: "nowrap",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  });

  const dropdownButtonSx = (active = false) => ({
    width: 28,
    height: 28,
    p: 0,
    ml: -0.5,
    borderRadius: 1,
    color: theme.palette.text.secondary,
    backgroundColor: active ? theme.palette.action.selected : "transparent",
    "&:hover": {
      color: theme.palette.text.primary,
      backgroundColor: theme.palette.action.hover,
    },
  });

  const dropdownPaperSx = {
    mt: 0.75,
    minWidth: 210,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 2,
    backgroundColor: theme.palette.background.paper,
    backgroundImage: "none",
  };

  const renderSplitNavigation = (key, item) => {
    const active = isPathActive(item.to);
    const menuOpen = desktopMenu.key === key;

    return (
      <>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <Button
            component={Link}
            to={item.to}
            onClick={closeDesktopMenu}
            sx={navLinkSx(active)}
          >
            {item.label}
          </Button>

          <IconButton
            id={`${key}-navigation-button`}
            aria-label={`Open ${item.label} menu`}
            aria-controls={menuOpen ? `${key}-navigation-menu` : undefined}
            aria-haspopup="true"
            aria-expanded={menuOpen ? "true" : undefined}
            onClick={(event) => openDesktopMenu(key, event)}
            sx={dropdownButtonSx(active)}
          >
            <ExpandMoreIcon
              sx={{
                fontSize: 18,
                transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 150ms ease",
              }}
            />
          </IconButton>
        </Box>

        <Menu
          id={`${key}-navigation-menu`}
          anchorEl={menuOpen ? desktopMenu.anchorEl : null}
          open={menuOpen}
          onClose={closeDesktopMenu}
          slotProps={{
            paper: {
              elevation: 0,
              sx: dropdownPaperSx,
            },
          }}
          MenuListProps={{
            "aria-labelledby": `${key}-navigation-button`,
            sx: {
              py: 0.75,
            },
          }}
        >
          {item.items.map((menuItem) => (
            <MenuItem
              key={menuItem.to}
              component={Link}
              to={menuItem.to}
              selected={isPathActive(menuItem.to)}
              onClick={closeDesktopMenu}
              sx={{
                mx: 0.75,
                px: 1.5,
                py: 1,
                borderRadius: 1.25,
                color: theme.palette.text.primary,
                fontSize: theme.typography.body2.fontSize,
              }}
            >
              {menuItem.label}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  };

  const renderMobileSection = (key, item) => (
    <Box key={key}>
      <MenuItem
        component={Link}
        to={item.to}
        selected={isPathActive(item.to)}
        onClick={closeMobileMenu}
        sx={{
          fontWeight: 700,
        }}
      >
        {item.label}
      </MenuItem>

      {item.items.map((menuItem) => (
        <MenuItem
          key={menuItem.to}
          component={Link}
          to={menuItem.to}
          selected={isPathActive(menuItem.to)}
          onClick={closeMobileMenu}
          sx={{
            pl: 4,
            fontSize: theme.typography.body2.fontSize,
          }}
        >
          {menuItem.label}
        </MenuItem>
      ))}
    </Box>
  );

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        width: "100%",
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.navbar,
        color: theme.palette.text.primary,
        backgroundImage: "none",
      }}
    >
      <Toolbar
        variant="dense"
        sx={{
          minHeight: {
            xs: 58,
            md: 62,
          },
          px: {
            xs: 2,
            sm: 2.5,
            lg: 3,
          },
          gap: 0.25,
        }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            color: theme.palette.text.primary,
          }}
        >
          <Box
            component="img"
            src={
              isDarkTheme
                ? "https://monochrome-assets.s3.ap-southeast-2.amazonaws.com/logo-dark-no-background.png"
                : "https://monochrome-assets.s3.ap-southeast-2.amazonaws.com/logo-light-no-background.png"
            }
            alt="Monochrome Compliance"
            onClick={() => navigate("/")}
            sx={{
              display: "block",
              width: "100%",
              maxWidth: {
                xs: 190,
                sm: 220,
                lg: 250,
              },
              height: "auto",
              objectFit: "contain",
              ml: -1,
              cursor: "pointer",
              transition: "opacity 120ms ease",
              "&:hover": {
                opacity: 0.8,
              },
            }}
          />
        </Typography>

        <Box
          sx={{
            display: {
              xs: "none",
              lg: "flex",
            },
            alignItems: "center",
            gap: 0.25,
          }}
        >
          {isMarketingRoute && (
            <>
              <Button
                component={Link}
                to="/regulator-payment-times"
                onClick={closeDesktopMenu}
                sx={navLinkSx(isPathActive("/regulator-payment-times"))}
              >
                Payment Times Explorer
              </Button>

              {renderSplitNavigation("services", marketingNav.services)}

              {renderSplitNavigation("industries", marketingNav.industries)}

              {renderSplitNavigation("insights", marketingNav.insights)}

              {renderSplitNavigation("company", marketingNav.company)}
            </>
          )}

          {isLoggedIn && !isMarketingRoute && (
            <>
              <Button
                id="explore-navigation-button"
                endIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
                onClick={(event) => openDesktopMenu("explore", event)}
                sx={navLinkSx(desktopMenu.key === "explore")}
              >
                Explore
              </Button>

              <Menu
                anchorEl={
                  desktopMenu.key === "explore" ? desktopMenu.anchorEl : null
                }
                open={desktopMenu.key === "explore"}
                onClose={closeDesktopMenu}
                slotProps={{
                  paper: {
                    elevation: 0,
                    sx: dropdownPaperSx,
                  },
                }}
              >
                <MenuItem
                  component={Link}
                  to="/regulator-payment-times"
                  onClick={closeDesktopMenu}
                >
                  Payment Times Explorer
                </MenuItem>

                <Divider />

                <ListSubheader
                  sx={{
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.secondary,
                  }}
                >
                  Services
                </ListSubheader>

                <MenuItem
                  component={Link}
                  to="/services"
                  onClick={closeDesktopMenu}
                >
                  Services
                </MenuItem>

                <MenuItem
                  component={Link}
                  to="/payment-times-reporting"
                  onClick={closeDesktopMenu}
                >
                  Payment Times Reporting
                </MenuItem>

                <MenuItem
                  component={Link}
                  to="/payment-health-check"
                  onClick={closeDesktopMenu}
                >
                  Payment Health Check
                </MenuItem>

                <Divider />

                <ListSubheader
                  sx={{
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.secondary,
                  }}
                >
                  Insights
                </ListSubheader>

                <MenuItem
                  component={Link}
                  to="/insights"
                  onClick={closeDesktopMenu}
                >
                  Industry Insights
                </MenuItem>

                <MenuItem
                  component={Link}
                  to="/insights/knowledge"
                  onClick={closeDesktopMenu}
                >
                  Knowledge Centre
                </MenuItem>

                <MenuItem
                  component={Link}
                  to="/insights/blog"
                  onClick={closeDesktopMenu}
                >
                  Blog
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>

        <Box
          sx={{
            display: {
              xs: "flex",
              lg: "none",
            },
          }}
        >
          <IconButton
            color="inherit"
            aria-label="Open navigation"
            aria-controls={mobileAnchor ? "mobile-navigation-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={mobileAnchor ? "true" : undefined}
            onClick={openMobileMenu}
            sx={{
              color: theme.palette.text.primary,
            }}
          >
            <MenuIcon />
          </IconButton>

          <Menu
            id="mobile-navigation-menu"
            anchorEl={mobileAnchor}
            open={Boolean(mobileAnchor)}
            onClose={closeMobileMenu}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  mt: 0.75,
                  width: "min(320px, calc(100vw - 24px))",
                  maxHeight: "calc(100vh - 80px)",
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  backgroundColor: theme.palette.background.paper,
                  backgroundImage: "none",
                },
              },
            }}
            MenuListProps={{
              sx: {
                py: 0.75,
              },
            }}
          >
            {isLoggedIn && !isMarketingRoute && (
              <>
                <MenuItem component={Link} to="/app" onClick={closeMobileMenu}>
                  <WorkOutlineIcon
                    sx={{
                      mr: 1.5,
                      fontSize: 19,
                    }}
                  />
                  Open Workspace
                </MenuItem>

                <Divider />
              </>
            )}

            {isMarketingRoute && (
              <>
                <MenuItem
                  component={Link}
                  to="/regulator-payment-times"
                  selected={isPathActive("/regulator-payment-times")}
                  onClick={closeMobileMenu}
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  Payment Times Explorer
                </MenuItem>

                <Divider />

                {Object.entries(marketingNav).map(([key, item], index) => (
                  <Box key={key}>
                    {index > 0 && <Divider />}
                    {renderMobileSection(key, item)}
                  </Box>
                ))}
              </>
            )}
          </Menu>
        </Box>

        {isLoggedIn && (
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            onClick={() => navigate("/app")}
            startIcon={
              <WorkOutlineIcon
                sx={{
                  fontSize: 17,
                }}
              />
            }
            aria-label="Open workspace"
            sx={{
              ml: 0.75,
              px: 1.25,
              py: 0.5,
              borderColor: theme.palette.divider,
              display: {
                xs: "none",
                lg: "inline-flex",
              },
              fontSize: theme.typography.body2.fontSize,
              fontWeight: 600,
              textTransform: "none",
              "&:hover": {
                borderColor: theme.palette.text.secondary,
              },
            }}
          >
            Workspace
          </Button>
        )}

        {!isLoggedIn && !isPublicOnlyMode && (
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => navigate("/login")}
            sx={{
              ml: 0.75,
              px: 1.5,
              py: 0.6,
              fontSize: theme.typography.body2.fontSize,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Login
          </Button>
        )}

        {isLoggedIn && (
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            onClick={handleLogout}
            sx={{
              ml: 0.75,
              fontSize: theme.typography.body2.fontSize,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Logout
          </Button>
        )}

        <IconButton
          color="inherit"
          aria-label="Toggle colour theme"
          onClick={onToggleTheme}
          size="small"
          sx={{
            ml: 0.25,
            color: theme.palette.text.primary,
          }}
        >
          {isDarkTheme ? (
            <Brightness7Icon sx={{ fontSize: 20 }} />
          ) : (
            <Brightness4Icon sx={{ fontSize: 20 }} />
          )}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
