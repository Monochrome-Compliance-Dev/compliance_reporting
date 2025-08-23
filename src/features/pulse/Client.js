import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Paper,
} from "@mui/material";
import { useNavigate, useParams } from "react-router";
import { usePulseContext } from "../../context/PulseContext";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  abn: yup.string().required("ABN is required"),
  email: yup.string().email("Invalid email").nullable(),
});

export default function Client() {
  const navigate = useNavigate();
  const { clientId } = useParams();

  const { clients } = usePulseContext();
  const client = Array.isArray(clients)
    ? clients.find((c) => c.id === clientId)
    : undefined;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      abn: "",
      email: "",
    },
  });

  useEffect(() => {
    if (client) {
      reset({
        name: client.name || "",
        abn: client.abn || "",
        email: client.email || "",
      });
    }
  }, [client, reset]);

  const { saveClient } = usePulseContext();
  const onSubmit = async (data) => {
    await saveClient({ id: clientId, ...data });
    navigate("/pulse/clients");
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {clientId ? "Edit Client" : "New Client"}
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Name"
              fullWidth
              {...register("name")}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              label="ABN"
              fullWidth
              {...register("abn")}
              error={!!errors.abn}
              helperText={errors.abn?.message}
            />
            <TextField
              label="Email"
              fullWidth
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={() => navigate("/pulse/clients")}>Cancel</Button>
              <Button type="submit" variant="contained">
                Save
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
