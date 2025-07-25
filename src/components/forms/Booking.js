import { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
  Container,
  Paper,
} from "@mui/material";
import { bookingService, publicService } from "../../services";
import { sanitiseInput } from "../../lib/utils";
import { useTheme } from "@mui/material/styles";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { format, addDays } from "date-fns";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Tooltip from "@mui/material/Tooltip";
import { error as logError } from "../../lib/utils/logger";
import { useAlert } from "../../context/AlertContext";

const Booking = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [booked, setBooked] = useState({});
  const [loading, setLoading] = useState(false);

  const { showAlert } = useAlert();

  const schema = yup.object().shape({
    name: yup
      .string()
      .trim()
      .min(5, "Please provide at least five characters")
      .required("Name is required"),
    email: yup
      .string()
      .trim()
      .email("Please enter a valid email address")
      .matches(
        /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
        "Please enter a valid email address"
      )
      .required("Email is required"),
    company: yup
      .string()
      .trim()
      .min(2, "Please provide at least two characters")
      .max(100, "Company name is too long (max 100 characters)")
      .required("Company is required"),
    reason: yup
      .string()
      .trim()
      .min(10, "Please provide at least 10 characters")
      .max(1000, "Message is too long (max 1000 characters)")
      .required("Reason is required"),
    date: yup
      .string()
      .required("Please select a slot above")
      .test(
        "valid-date",
        "Please select a valid date",
        (val) => !!val && /^\d{4}-\d{2}-\d{2}$/.test(val)
      ),
    time: yup
      .string()
      .required("Please select a time")
      .test(
        "valid-time",
        "Please select a valid time",
        (val) => !!val && /^(0[9]|1[0-1]|0[1-3]):00 (AM|PM)$/.test(val)
      ),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      reason: "",
      date: "",
      time: "",
    },
  });

  const watchDate = watch("date");
  const watchTime = watch("time");

  const timeslots = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
  ];

  const rawDays = Array.from({ length: 14 }, (_, i) =>
    addDays(new Date(), i)
  ).filter((day) => day.getDay() !== 0 && day.getDay() !== 6);
  const days = rawDays.sort((a, b) => {
    if (format(a, "yyyy-MM-dd") === todayStr) return -1;
    if (format(b, "yyyy-MM-dd") === todayStr) return 1;
    return a - b;
  });

  const scrollRef = useRef();

  useLayoutEffect(() => {
    if (scrollRef.current) {
      const todayEl = scrollRef.current.querySelector('[data-today="true"]');
      if (todayEl) {
        const containerRect = scrollRef.current.getBoundingClientRect();
        const todayRect = todayEl.getBoundingClientRect();
        scrollRef.current.scrollLeft +=
          todayRect.left - containerRect.left - 16;
      }
    }
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -160 : 160,
        behavior: "smooth",
      });
    }
  };

  const loadBookings = async () => {
    try {
      const data = await bookingService.getAll();
      const map = {};
      data.forEach((b) => {
        if (!map[b.date]) map[b.date] = [];
        map[b.date].push(b.time);
      });
      setBooked(map);
      // Remove pre-selection of date and time here:
      // const todayBookings = map[todayStr] || [];
      // const firstAvailable = timeslots.find(
      //   (slot) => !todayBookings.includes(slot)
      // );
      // if (firstAvailable) {
      //   setValue("date", todayStr);
      //   setValue("time", firstAvailable);
      // }
    } catch (err) {
      logError("Failed to load bookings:", err);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await bookingService.create(data);

      const bookingData = {
        topic: "Booking",
        name: sanitiseInput(data.name),
        email: sanitiseInput(data.email),
        subject: "booking",
        company: sanitiseInput(data.company),
        date: data.date,
        time: data.time,
        reason: sanitiseInput(data.reason),
        from: "contact@monochrome-compliance.com",
        to: sanitiseInput(data.email),
      };
      // Send confirmation email to the user
      await publicService.sendSesEmail(bookingData);

      await loadBookings();
      showAlert("Booking submitted successfully.", "success");
      navigate("/thankyou-booking");
    } catch (err) {
      logError("Booking submission failed:", err);
      showAlert("There was an error submitting your booking.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        mt: theme.spacing(4),
        backgroundColor: theme.palette.background.default,
        padding: theme.spacing(2),
        borderRadius: theme.shape.borderRadius,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: theme.spacing(3),
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Book an Appointment
        </Typography>
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
          Select a Time Slot
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pb: 2,
          }}
        >
          <IconButton onClick={() => scroll("left")}>
            <ArrowBackIosIcon />
          </IconButton>
          <Box
            ref={scrollRef}
            sx={{
              display: "flex",
              gap: 2,
              overflowX: "auto",
              scrollBehavior: "smooth",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              "&::-webkit-scrollbar": { display: "none" },
              flexWrap: "nowrap",
              minWidth: 800,
              mx: "auto",
            }}
          >
            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              return (
                <Box
                  key={dateStr}
                  data-today={dateStr === todayStr}
                  sx={{
                    width: 160,
                    flex: "0 0 auto",
                    border:
                      dateStr === todayStr
                        ? `2px solid ${theme.palette.primary.main}`
                        : undefined,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ textAlign: "center" }}>
                    {dateStr === todayStr ? "Today" : format(day, "EEE dd MMM")}
                  </Typography>
                  {timeslots.map((slot) => {
                    const isPastSlot =
                      dateStr === todayStr &&
                      new Date(`${dateStr} ${slot}`) < new Date();
                    if (isPastSlot) return null;
                    const isUnavailable = booked[dateStr]?.includes(slot);
                    const isSelected =
                      dateStr === (watchDate || todayStr) &&
                      slot === (watchTime || "");
                    return (
                      <Button
                        key={slot}
                        fullWidth
                        variant={isSelected ? "contained" : "outlined"}
                        disabled={isUnavailable}
                        sx={{
                          my: 0.5,
                          ...(isUnavailable && {
                            color: theme.palette.secondary.contrastText,
                            backgroundColor: theme.palette.secondary.main,
                          }),
                        }}
                        onClick={() => {
                          setValue("date", dateStr);
                          setValue("time", slot);
                        }}
                      >
                        {slot}
                      </Button>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
          <IconButton onClick={() => scroll("right")}>
            <ArrowForwardIosIcon />
          </IconButton>
        </Box>
        <TextField
          fullWidth
          margin="normal"
          label="Full Name *"
          name="name"
          autoComplete="off"
          {...register("name")}
          error={!!errors.name}
          helperText={errors.name?.message}
          InputLabelProps={{ style: { color: theme.palette.text.primary } }}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Email *"
          name="email"
          autoComplete="off"
          {...register("email")}
          error={!!errors.email}
          helperText={errors.email?.message}
          InputLabelProps={{ style: { color: theme.palette.text.primary } }}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Company *"
          name="company"
          autoComplete="off"
          {...register("company")}
          error={!!errors.company}
          helperText={errors.company?.message}
          InputLabelProps={{ style: { color: theme.palette.text.primary } }}
        />
        {/* Selected Date & Time display with button and validation message */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <TextField
              label="Selected Date & Time"
              value={
                watchDate && watchTime
                  ? `${watchDate} at ${watchTime}`
                  : "No slot selected"
              }
              disabled
              fullWidth
              sx={{ flex: 1 }}
            />
            <Box sx={{ display: "flex", alignItems: "center", pt: 1 }}>
              <Tooltip title="Select the earliest available slot">
                <span>
                  <Button
                    variant="contained"
                    color="secondary"
                    sx={{
                      height: 48,
                      minWidth: 110,
                      fontWeight: "bold",
                      boxShadow: 2,
                      ml: 1,
                    }}
                    onClick={() => {
                      // Find the first available slot from today onwards
                      for (const day of days) {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const bookedSlots = booked[dateStr] || [];
                        const firstAvailable = timeslots.find(
                          (slot) => !bookedSlots.includes(slot)
                        );
                        if (firstAvailable) {
                          setValue("date", dateStr);
                          setValue("time", firstAvailable);
                          break;
                        }
                      }
                    }}
                  >
                    Earliest
                  </Button>
                </span>
              </Tooltip>
            </Box>
          </Box>
          {(errors.date || errors.time) && (
            <Typography
              variant="caption"
              color="error"
              sx={{ pl: 1, mt: "-20px" }}
            >
              {errors.date?.message || errors.time?.message}
            </Typography>
          )}
        </Box>
        <TextField
          fullWidth
          margin="normal"
          label="Reason *"
          name="reason"
          multiline
          rows={3}
          autoComplete="off"
          {...register("reason")}
          error={!!errors.reason}
          helperText={errors.reason?.message}
          InputLabelProps={{ style: { color: theme.palette.text.primary } }}
        />
        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 2, mb: 2 }}
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Submitting..." : "Submit Booking"}
        </Button>
      </Paper>
    </Container>
  );
};

export default Booking;
