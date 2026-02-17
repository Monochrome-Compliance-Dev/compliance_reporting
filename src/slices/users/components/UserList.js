import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  useTheme,
  Divider,
} from "@mui/material";

import { useAlert } from "../../../context";
import { userService } from "../userApi";

function formatName(u) {
  const first = (u?.firstName || "").trim();
  const last = (u?.lastName || "").trim();
  const full = `${first} ${last}`.trim();
  return full || u?.email || "(Unnamed user)";
}

function formatMetaLine(u) {
  const bits = [];
  if (u?.role) bits.push(`Role: ${u.role}`);
  if (u?.email) bits.push(`Email: ${u.email}`);
  if (u?.phone) bits.push(`Phone: ${u.phone}`);
  return bits.join(" • ") || "";
}

export default function UserList() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const hasUsers = items && items.length > 0;

  const sorted = useMemo(() => {
    const list = Array.isArray(items) ? [...items] : [];
    list.sort((a, b) => {
      const an = formatName(a).toLowerCase();
      const bn = formatName(b).toLowerCase();
      return an.localeCompare(bn);
    });
    return list;
  }, [items]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      try {
        const res = await userService.getAll();
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.items)
            ? res.items
            : [];
        if (!isMounted) return;
        setItems(list);
      } catch (err) {
        if (!isMounted) return;
        console.error("[UserList] Error loading users:", err);
        showAlert("Failed to load users.", "error");
        setItems([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [showAlert]);

  const handleCreate = () => {
    // This component is intended to be mounted at /app/boss/users
    // Use relative navigation to avoid hard-coded paths.
    navigate("create");
  };

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 3 },
        backgroundColor: theme.palette.background.default,
        minHeight: "100%",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          maxWidth: 1000,
          mx: "auto",
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography variant="h4" sx={{ lineHeight: 1.1 }}>
              Users
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
              Manage users who can access this customer.
            </Typography>
          </Box>

          <Button variant="contained" onClick={handleCreate}>
            Create user
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {loading ? (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <CircularProgress size={20} />
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Loading users…
            </Typography>
          </Stack>
        ) : !hasUsers ? (
          <Box sx={{ py: 3 }}>
            <Typography variant="h6" gutterBottom>
              No users yet
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              Create the first user for this customer.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.25}>
            {sorted.map((u) => (
              <Paper
                key={u.id}
                variant="outlined"
                sx={{
                  p: 2,
                  borderColor: theme.palette.divider,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {formatName(u)}
                    </Typography>
                    {formatMetaLine(u) ? (
                      <Typography
                        variant="body2"
                        sx={{
                          opacity: 0.85,
                          mt: 0.25,
                          wordBreak: "break-word",
                        }}
                      >
                        {formatMetaLine(u)}
                      </Typography>
                    ) : null}
                  </Box>

                  {/* Placeholder for v2 actions (edit/deactivate/resend etc.) */}
                  {/*
                  <Button variant="outlined" size="small" onClick={() => navigate(`${u.id}`)}>
                    View
                  </Button>
                  */}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
