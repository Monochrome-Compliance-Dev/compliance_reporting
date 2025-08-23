import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router";
import { usePulseContext } from "../../context/PulseContext";

const schema = yup.object().shape({
  clientId: yup.string().required("Client is required"),
  engagementName: yup.string().required("Engagement Name is required"),
  budgetHours: yup
    .number()
    .typeError("Budget Hours must be a number")
    .required("Budget Hours is required")
    .min(0, "Budget Hours must be non-negative"),
  budgetAmount: yup
    .number()
    .typeError("Budget ($) must be a number")
    .min(0, "Budget ($) must be non-negative")
    .notRequired(),
});

export default function Engagement() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      clientId: "",
      engagementName: "",
      budgetHours: "",
      budgetAmount: "",
    },
  });

  // ✅ Custom hook is called **inside** the component body
  const { clients = [], saveEngagement } = usePulseContext();

  const onSubmit = async (formData) => {
    const id = Date.now().toString();
    await saveEngagement({
      id,
      clientId: formData.clientId,
      name: formData.engagementName,
      budgetHours: Number(formData.budgetHours || 0),
      budgetAmount: formData.budgetAmount ? Number(formData.budgetAmount) : 0,
      status: "PLANNED",
    });
    navigate("/pulse");
  };

  const handleCancel = () => {
    navigate("/pulse");
  };

  return (
    <Box maxWidth={400} mx="auto" mt={6}>
      <Typography variant="h5" mb={3}>
        Create Engagement
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2}>
          <TextField
            label="Client"
            select
            {...register("clientId")}
            error={!!errors.clientId}
            helperText={errors.clientId?.message}
            fullWidth
            autoFocus
          >
            <MenuItem value="">Select a client</MenuItem>
            {clients.map((client) => (
              <MenuItem key={client.id} value={client.id}>
                {client.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Engagement Name"
            {...register("engagementName")}
            error={!!errors.engagementName}
            helperText={errors.engagementName?.message}
            fullWidth
          />
          <TextField
            label="Budget Hours"
            type="number"
            {...register("budgetHours")}
            error={!!errors.budgetHours}
            helperText={errors.budgetHours?.message}
            fullWidth
            inputProps={{ min: 0 }}
          />
          <TextField
            label="Budget ($)"
            type="number"
            {...register("budgetAmount")}
            error={!!errors.budgetAmount}
            helperText={errors.budgetAmount?.message}
            fullWidth
            inputProps={{ min: 0 }}
          />
          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
            <Button onClick={handleCancel} color="secondary" variant="outlined">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              Create
            </Button>
          </Stack>
        </Stack>
      </form>
    </Box>
  );
}
