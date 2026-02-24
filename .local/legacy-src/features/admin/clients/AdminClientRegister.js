import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  TextField,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Grid,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { clientService, userService, trackingService } from "../../services";
import { Alert } from "@mui/material";
import GoogleAddressAutocomplete from "../../components/common/GoogleAddressAutocomplete";

export default function ClientRegister() {
  const theme = useTheme();
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  const [sameAsAddress, setSameAsAddress] = useState(false);

  // Yup validation schema
  const validationSchema = Yup.object().shape({
    businessName: Yup.string().required("Business Name is required"),
    abn: Yup.string().matches(/^\d{11}$/, "ABN must be exactly 11 digits"),
    acn: Yup.string(),
    addressline1: Yup.string().required("Address Line 1 is required"),
    addressline2: Yup.string(),
    addressline3: Yup.string(),
    city: Yup.string().required("City is required"),
    state: Yup.string().required("State is required"),
    postcode: Yup.string().required("Postcode is required"),
    country: Yup.string().required("Country is required"),
    postaladdressline1: Yup.string().required(
      "Postal Address Line 1 is required"
    ),
    postaladdressline2: Yup.string(),
    postaladdressline3: Yup.string(),
    postalcity: Yup.string().required("Postal City is required"),
    postalstate: Yup.string().required("Postal State is required"),
    postalpostcode: Yup.string().required("Postal Postcode is required"),
    postalcountry: Yup.string().required("Postal Country is required"),
    industryCode: Yup.string().required("Industry Code is required"),
    contactFirst: Yup.string().required("Contact First Name is required"),
    contactLast: Yup.string().required("Contact Last Name is required"),
    contactPosition: Yup.string().required("Contact Position is required"),
    contactEmail: Yup.string()
      .email("Invalid email")
      .required("Contact Email is required"),
    contactPhone: Yup.string().required("Contact Phone is required"),
    controllingCorporationName: Yup.string(),
    controllingCorporationAbn: Yup.string(),
    controllingCorporationAcn: Yup.string(),
    headEntityName: Yup.string(),
    headEntityAbn: Yup.string(),
    headEntityAcn: Yup.string(),
    // Honeypot field
    nickname: Yup.string().test(
      "is-empty",
      "Form submission failed",
      (value) => !value || value.trim() === ""
    ),
  });

  const methods = useForm({
    resolver: yupResolver(validationSchema),
    // defaultValues: {
    //   businessName: "",
    //   abn: "",
    //   acn: "",
    //   addressline1: "Address Line 1",
    //   addressline2: "Address Line 2",
    //   addressline3: "Address Line 3",
    //   city: "City",
    //   state: "",
    //   postcode: "Postcode",
    //   country: "Australia",
    //   postaladdressline1: "Address Line 1",
    //   postaladdressline2: "Address Line 2",
    //   postaladdressline3: "Address Line 3",
    //   postalcity: "City",
    //   postalstate: "",
    //   postalpostcode: "Postcode",
    //   postalcountry: "Australia",
    //   industryCode: "",
    //   contactFirst: "",
    //   contactLast: "",
    //   contactPosition: "",
    //   contactEmail: "",
    //   contactPhone: "",
    //   controllingCorporationName: "",
    //   controllingCorporationAbn: "",
    //   controllingCorporationAcn: "",
    //   headEntityName: "",
    //   headEntityAbn: "",
    //   headEntityAcn: "",
    //   // Honeypot field
    //   nickname: "",
    // },
    defaultValues: {
      businessName: "Testicles Pty Ltd",
      abn: "12345678765",
      acn: "",
      addressline1: "Address Line 1",
      addressline2: "Address Line 2",
      addressline3: "Address Line 3",
      city: "City",
      state: "",
      postcode: "Postcode",
      country: "Australia",
      postaladdressline1: "Address Line 1",
      postaladdressline2: "Address Line 2",
      postaladdressline3: "Address Line 3",
      postalcity: "City",
      postalstate: "",
      postalpostcode: "Postcode",
      postalcountry: "Australia",
      industryCode: "12121",
      contactFirst: "Homer",
      contactLast: "Simpson",
      contactPosition: "King of the World",
      contactEmail: "darryll.robinson@monochrome-compliance.com",
      contactPhone: "1010101",
      controllingCorporationName: "",
      controllingCorporationAbn: "",
      controllingCorporationAcn: "",
      headEntityName: "",
      headEntityAbn: "",
      headEntityAcn: "",
      // Honeypot field
      nickname: "",
    },
  });
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = methods;

  // Watch address fields for auto-copying
  const addressFields = watch([
    "addressline1",
    "addressline2",
    "addressline3",
    "city",
    "state",
    "postcode",
    "country",
  ]);

  const handleCheckboxChange = (event) => {
    const checked = event.target.checked;
    if (!checked) {
      const confirmClear = window.confirm(
        "Are you sure you want to clear the postal address fields?"
      );
      if (!confirmClear) return;
    }
    setSameAsAddress(checked);
    if (checked) {
      // Only take the first line of addressline1 (before first comma, if any)
      const addressLine1 =
        (addressFields[0] && addressFields[0].split(",")[0]) || "";
      setValue("postaladdressline1", addressLine1);
      setValue("postaladdressline2", addressFields[1] || "");
      setValue("postaladdressline3", addressFields[2] || "");
      setValue("postalcity", addressFields[3] || "");
      setValue("postalstate", addressFields[4] || "");
      setValue("postalpostcode", addressFields[5] || "");
      setValue("postalcountry", addressFields[6] || "");
    } else {
      setValue("postaladdressline1", "");
      setValue("postaladdressline2", "");
      setValue("postaladdressline3", "");
      setValue("postalcity", "");
      setValue("postalstate", "");
      setValue("postalpostcode", "");
      setValue("postalcountry", "");
    }
  };

  const onSubmit = async (clientDetails) => {
    // Honeypot check
    if (clientDetails.nickname?.trim()) {
      setAlert({
        type: "error",
        message: "Form submission failed",
      });
      try {
        await trackingService.createHoneypot();
      } catch (logError) {
        console.error("Failed to log honeypot event", logError);
      }
      return;
    }
    clientDetails = {
      ...clientDetails,
      active: true,
      createdBy: userService.userValue.id,
    };
    try {
      const response = await clientService.create(clientDetails);
      sessionStorage.setItem("clientId", response.id); // Save ID for later use
      navigate("/users/create", {
        state: {
          client: {
            id: response.id,
            name: clientDetails.businessName,
            contactFirst: clientDetails.contactFirst,
            contactLast: clientDetails.contactLast,
            contactEmail: clientDetails.contactEmail,
            contactPhone: clientDetails.contactPhone,
            contactPosition: clientDetails.contactPosition,
          },
        },
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Error creating client",
      });
      console.error("Error creating client:", error);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        padding: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          maxWidth: 800,
          width: "100%",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography variant="h4" gutterBottom align="center">
          Register a New Client
        </Typography>
        {alert && (
          <Alert severity={alert.type} sx={{ mb: 2 }}>
            {alert.message}
          </Alert>
        )}
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            id="register-client-form"
            style={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Business Name"
                  fullWidth
                  {...register("businessName")}
                  error={!!errors.businessName}
                  helperText={errors.businessName?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="ABN"
                  fullWidth
                  {...register("abn")}
                  error={!!errors.abn}
                  helperText={errors.abn?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="ACN"
                  fullWidth
                  {...register("acn")}
                  error={!!errors.acn}
                  helperText={errors.acn?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <GoogleAddressAutocomplete />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  {...register("addressline1")}
                  error={!!errors.addressline1}
                  helperText={errors.addressline1?.message}
                  value={watch("addressline1")}
                  onChange={(e) => setValue("addressline1", e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  {...register("addressline2")}
                  error={!!errors.addressline2}
                  helperText={errors.addressline2?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  {...register("addressline3")}
                  error={!!errors.addressline3}
                  helperText={errors.addressline3?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  {...register("city")}
                  error={!!errors.city}
                  helperText={errors.city?.message}
                />
              </Grid>
              <Grid item xs={3}>
                <FormControl fullWidth error={!!errors.state}>
                  <InputLabel id="state-select-label">State</InputLabel>
                  <Select
                    labelId="state-select-label"
                    id="state-select"
                    label="State"
                    defaultValue=""
                    {...register("state")}
                    value={watch("state") || ""}
                    onChange={(e) => setValue("state", e.target.value)}
                  >
                    <MenuItem value="ACT">ACT</MenuItem>
                    <MenuItem value="NT">NT</MenuItem>
                    <MenuItem value="NSW">NSW</MenuItem>
                    <MenuItem value="QLD">QLD</MenuItem>
                    <MenuItem value="SA">SA</MenuItem>
                    <MenuItem value="TAS">TAS</MenuItem>
                    <MenuItem value="VIC">VIC</MenuItem>
                    <MenuItem value="WA">WA</MenuItem>
                  </Select>
                  {errors.state && (
                    <Typography variant="caption" color="error">
                      {errors.state.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  {...register("postcode")}
                  error={!!errors.postcode}
                  helperText={errors.postcode?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  {...register("country")}
                  error={!!errors.country}
                  helperText={errors.country?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={sameAsAddress}
                      onChange={handleCheckboxChange}
                      name="sameAsAddress"
                    />
                  }
                  label="Postal address is the same as the address above"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  {...register("postaladdressline1")}
                  error={!!errors.postaladdressline1}
                  helperText={errors.postaladdressline1?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  {...register("postaladdressline2")}
                  error={!!errors.postaladdressline2}
                  helperText={errors.postaladdressline2?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  {...register("postaladdressline3")}
                  error={!!errors.postaladdressline3}
                  helperText={errors.postaladdressline3?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  {...register("postalcity")}
                  error={!!errors.postalcity}
                  helperText={errors.postalcity?.message}
                />
              </Grid>
              <Grid item xs={3}>
                <FormControl fullWidth error={!!errors.postalstate}>
                  <InputLabel id="postalstate-select-label">
                    Postal State
                  </InputLabel>
                  <Select
                    labelId="postalstate-select-label"
                    id="postalstate-select"
                    label="Postal State"
                    defaultValue=""
                    {...register("postalstate")}
                    value={watch("postalstate") || ""}
                    onChange={(e) => setValue("postalstate", e.target.value)}
                  >
                    <MenuItem value="ACT">ACT</MenuItem>
                    <MenuItem value="NT">NT</MenuItem>
                    <MenuItem value="NSW">NSW</MenuItem>
                    <MenuItem value="QLD">QLD</MenuItem>
                    <MenuItem value="SA">SA</MenuItem>
                    <MenuItem value="TAS">TAS</MenuItem>
                    <MenuItem value="VIC">VIC</MenuItem>
                    <MenuItem value="WA">WA</MenuItem>
                  </Select>
                  {errors.postalstate && (
                    <Typography variant="caption" color="error">
                      {errors.postalstate.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  {...register("postalpostcode")}
                  error={!!errors.postalpostcode}
                  helperText={errors.postalpostcode?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  {...register("postalcountry")}
                  error={!!errors.postalcountry}
                  helperText={errors.postalcountry?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Industry Code"
                  fullWidth
                  {...register("industryCode")}
                  error={!!errors.industryCode}
                  helperText={errors.industryCode?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Contact First Name"
                  fullWidth
                  {...register("contactFirst")}
                  error={!!errors.contactFirst}
                  helperText={errors.contactFirst?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Contact Last Name"
                  fullWidth
                  {...register("contactLast")}
                  error={!!errors.contactLast}
                  helperText={errors.contactLast?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Contact Position"
                  fullWidth
                  {...register("contactPosition")}
                  error={!!errors.contactPosition}
                  helperText={errors.contactPosition?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Contact Email"
                  type="email"
                  fullWidth
                  {...register("contactEmail")}
                  error={!!errors.contactEmail}
                  helperText={errors.contactEmail?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Contact Phone"
                  fullWidth
                  {...register("contactPhone")}
                  error={!!errors.contactPhone}
                  helperText={errors.contactPhone?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Controlling Corporation Name"
                  fullWidth
                  {...register("controllingCorporationName")}
                  error={!!errors.controllingCorporationName}
                  helperText={errors.controllingCorporationName?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Controlling Corporation ABN"
                  fullWidth
                  {...register("controllingCorporationAbn")}
                  error={!!errors.controllingCorporationAbn}
                  helperText={errors.controllingCorporationAbn?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Controlling Corporation ACN"
                  fullWidth
                  {...register("controllingCorporationAcn")}
                  error={!!errors.controllingCorporationAcn}
                  helperText={errors.controllingCorporationAcn?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Head Entity Name"
                  fullWidth
                  {...register("headEntityName")}
                  error={!!errors.headEntityName}
                  helperText={errors.headEntityName?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Head Entity ABN"
                  fullWidth
                  {...register("headEntityAbn")}
                  error={!!errors.headEntityAbn}
                  helperText={errors.headEntityAbn?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Head Entity ACN"
                  fullWidth
                  {...register("headEntityAcn")}
                  error={!!errors.headEntityAcn}
                  helperText={errors.headEntityAcn?.message}
                />
              </Grid>
            </Grid>
            {/* Honeypot field */}
            <TextField
              label="Nickname"
              fullWidth
              {...register("nickname")}
              style={{ display: "none" }}
              tabIndex="-1"
              autoComplete="off"
            />
            <Button
              variant="contained"
              color="primary"
              type="submit"
              fullWidth
              sx={{ mt: 2 }}
            >
              Register Client
            </Button>
          </form>
        </FormProvider>
      </Paper>
    </Box>
  );
}
