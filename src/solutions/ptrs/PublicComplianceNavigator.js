import React, { useState, useMemo, useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  RadioGroup,
  FormControlLabel,
  FormGroup,
  Checkbox,
  Radio,
  Stepper,
  Step,
  StepLabel,
  Tooltip,
  LinearProgress,
  TextField,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { entityService } from "../../services";
// Removed Alert import since alerts are handled via context
import { handlePdf, sendSummaryByEmail } from "../../lib/utils";
import { sanitiseInput } from "../../lib/utils/sanitiseInput";
import { useAlert } from "../../context/AlertContext";
import { error as logError } from "../../lib/utils/logger";
import { isValidABN } from "../../lib/utils/abnChecksum";

const EntityDetailsForm = ({ control, errors, answers, theme }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
    {entityDetailsStep.fields.map((field) => (
      <Controller
        key={field.name}
        name={field.name}
        control={control}
        defaultValue={answers?.[field.name] || ""}
        render={({ field: controllerField }) => (
          <TextField
            {...controllerField}
            label={field.label}
            required={field.required}
            error={!!errors[field.name]}
            helperText={errors[field.name]?.message}
            InputLabelProps={{ style: { color: theme.palette.text.primary } }}
          />
        )}
      />
    ))}
  </Box>
);

const ContactDetailsForm = ({
  control,
  errors,
  answers,
  watchedEntityName,
  theme,
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
    {contactDetailsStep.fields.map((field) => (
      <Controller
        key={field.name}
        name={field.name}
        control={control}
        defaultValue={
          field.name === "entityName"
            ? watchedEntityName || ""
            : answers?.[field.name] || ""
        }
        render={({ field: controllerField }) => (
          <TextField
            {...controllerField}
            label={field.label}
            required={field.required}
            error={!!errors[field.name]}
            helperText={errors[field.name]?.message}
            InputLabelProps={{ style: { color: theme.palette.text.primary } }}
          />
        )}
      />
    ))}
  </Box>
);
// Yup validation schema for Entity Details
const entitySchema = yup.object().shape({
  entityName: yup
    .string()
    .trim()
    .min(5, "Please provide at least five characters")
    .required("Entity name is required"),
  entityABN: yup
    .string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .test(
      "is-valid-abn",
      "ABN must be exactly 11 digits and pass the official checksum",
      function (value) {
        if (!value) return true; // Optional field
        return /^\d{11}$/.test(value) && isValidABN(value);
      }
    ),
});

// Yup validation schema for Contact Details
const contactSchema = yup.object().shape({
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
  entityName: yup
    .string()
    .trim()
    .min(5, "Please provide at least five characters")
    .required("Entity name is required"),
  position: yup
    .string()
    .trim()
    .min(5, "Please provide at least five characters")
    .required("Your position is required"),
});

// Checkbox options for "Connection to Australia"
const ALL_CHECKBOX_OPTIONS = [
  "Incorporated in Australia",
  "Carries on business in Australia",
  "Central management and control in Australia",
  "Majority voting power controlled by Australian shareholders",
  "All of the above",
  "None of the above",
];

const INDIVIDUAL_OPTIONS = ALL_CHECKBOX_OPTIONS.filter(
  (opt) => opt !== "All of the above" && opt !== "None of the above"
);

// Memoize steps and flowQuestions for performance

const entityDetailsStep = {
  key: "entityDetails",
  question: "Please enter the entity details",
  type: "form",
  fields: [
    { name: "entityName", label: "Entity Name", required: true },
    { name: "entityABN", label: "ABN (optional)", required: false },
  ],
  help: "These details will be used to track submissions and ensure audit compliance.",
};

const startEntityStep = {
  key: "startEntity",
  question: "Are you starting with the highest-level entity in the group?",
  options: ["Yes", "No"],
  help: "Begin with the parent/holding entity, then assess others if needed.",
};

const section7Step = {
  key: "section7",
  question:
    "Has this entity been assessed under Section 7 of the Payment Times Reporting Act 2020?",
  options: ["Yes", "No"],
  help: "Only entities meeting the criteria in Section 7 are required to report.",
};

const cceStep = {
  key: "cce",
  question: "Is the entity a Constitutionally Covered Entity (CCE)?",
  options: ["Yes", "No"],
  help: "CCE includes trading, financial, and foreign corporations. See Section 6(1)(e) of the Payment Times Reporting Act 2020.",
};

const charityStep = {
  key: "charity",
  question: "Is the entity a registered charity?",
  options: ["Yes", "No"],
  help: "Charities are excluded from PTRS reporting. See Section 6(1)(e) of the Payment Times Reporting Act 2020.",
};

const connectionToAustraliaStep = {
  key: "connectionToAustralia",
  question: "Does the entity have a connection to Australia?",
  type: "checkbox",
  subOptions: [...ALL_CHECKBOX_OPTIONS],
  help: "Tick any that apply — only one is required. If none apply, select 'None of the above'.",
};

const revenueStep = {
  key: "revenue",
  question:
    "Did the entity have consolidated revenue of more than A$100 million in the last financial year?",
  options: ["Yes", "No"],
  help: "Entities below this threshold are excluded.",
};

const controlledStep = {
  key: "controlled",
  question:
    "Is the entity controlled by another entity that is a reporting entity?",
  options: ["Yes", "No"],
  help: "Controlled entities are included in the parent entity's report.",
};

const contactDetailsStep = {
  key: "contactDetails",
  question: "Please provide your contact details",
  type: "form",
  fields: [
    { name: "name", label: "Your Name", required: true },
    { name: "email", label: "Your Email", required: true },
    { name: "entityName", label: "Entity Name", required: true },
    { name: "position", label: "Your Position", required: true },
  ],
  help: "We'll use these details to send you a summary and follow up if needed.",
};

const stepsData = [
  "Entity Details",
  "Start at Highest-Level Entity",
  "Confirm Reporting Requirement",
  "Constitutionally Covered Entity",
  "Charity Status",
  "Connection to Australia",
  "Revenue Threshold",
  "Controlled by Reporting Entity",
  "Summary",
  "Contact Details",
];

const flowQuestionsData = [
  entityDetailsStep,
  startEntityStep,
  section7Step,
  cceStep,
  charityStep,
  connectionToAustraliaStep,
  revenueStep,
  controlledStep,
  contactDetailsStep,
];
export default function PublicComplianceNavigator() {
  // Memoize steps and flowQuestions so they're not recreated on every render
  const steps = useMemo(() => stepsData, []);
  const flowQuestions = useMemo(() => flowQuestionsData, []);
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false); // Track loading state for Submit button
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  // React-hook-form for Entity Details step
  const {
    control: entityControl,
    handleSubmit: handleEntitySubmit,
    formState: { errors: entityErrors },
  } = useForm({
    resolver: yupResolver(entitySchema),
    defaultValues: {
      entityName: "",
      entityABN: "",
    },
  });

  // Use useWatch to get live value of entityName and entityABN
  const watchedEntityName = useWatch({
    control: entityControl,
    name: "entityName",
    defaultValue: "",
  });
  const watchedEntityABN = useWatch({
    control: entityControl,
    name: "entityABN",
    defaultValue: "",
  });

  // React-hook-form for Contact Details step
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      entityName: answers.entityDetails?.entityName || watchedEntityName || "",
      position: "",
    },
  });

  // Sync the entityName into the contact form once it's known.
  // RHF does not update defaultValues automatically after initial mount.
  // This effect watches answers.entityDetails?.entityName and triggers a reset when it becomes available.
  useEffect(() => {
    const entityName = answers.entityDetails?.entityName;
    if (entityName) {
      reset((prev) => ({ ...prev, entityName }));
    }
  }, [answers.entityDetails?.entityName, reset]);

  const current = flowQuestions[activeStep] || {}; // Safeguard to ensure current is always defined

  // Submission handler for Contact Details with form validation
  const confirmSubmission = async (contactData) => {
    // Input sanitation to prevent HTML/script injection
    contactData.name = sanitiseInput(contactData.name);
    contactData.email = sanitiseInput(contactData.email);
    contactData.company = sanitiseInput(contactData.entityName);
    contactData.position = sanitiseInput(contactData.position);
    contactData.from = "contact@monochrome-compliance.com";
    setLoading(true);
    try {
      // Structure the data for saving to the backend
      const dataToSave = {
        entityName:
          answers.entityDetails?.entityName || watchedEntityName || "",
        entityABN: answers.entityDetails?.entityABN || watchedEntityABN || "",
        startEntity: answers.startEntity || "",
        section7: answers.section7 || "",
        cce: answers.cce || "",
        charity: answers.charity || "",
        connectionToAustralia: Array.isArray(answers.connectionToAustralia)
          ? answers.connectionToAustralia.join(", ")
          : answers.connectionToAustralia || "",
        revenue: answers.revenue || "",
        controlled: answers.controlled || "",
        contactDetails: contactData || {},
        completed: true,
        timestamp: new Date().toISOString(),
      };

      // Create the record in the backend
      const response = await entityService.create(dataToSave);
      const recordId = response.id;

      // Generate the PDF with the recordId
      const pdfBlob = await handlePdf(recordId, answers, flowQuestions);

      // Send the PDF via email
      await sendSummaryByEmail({
        pdfBlob,
        recordId,
        contactData,
        answers,
        entityService,
      });
      showAlert("Email sent successfully! Please check your inbox.", "success");
      // Navigate to the solution page
      navigate("/thankyou-compliance-navigator");
    } catch (error) {
      logError("Failed to complete submission", error);
      showAlert("Failed to complete submission. Please try again.", "error");
    } finally {
      setLoading(false); // Reset loading state after submission
    }
  };

  const handleNext = async (contactFormData) => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else if (activeStep === steps.length - 1) {
      // Only submit via react-hook-form handler for Contact Details step
      if (contactFormData) {
        // Save to answers state for consistency
        setAnswers((prev) => ({
          ...prev,
          contactDetails: contactFormData,
        }));
        await confirmSubmission(contactFormData);
      }
    }
  };

  const handleBack = () => {
    if (activeStep > 0) setActiveStep((prev) => prev - 1);
  };

  const handleInputChange = (key) => (e) => {
    const { name, value } = e.target;

    // Prevent non-numeric input for the entityABN field
    if (
      key === "entityDetails" &&
      name === "entityABN" &&
      !/^[0-9]*$/.test(value)
    ) {
      return;
    }

    setAnswers({
      ...answers,
      [key]: { ...answers[key], [name]: value },
    });
  };

  const isStepValid = (stepIndex) => {
    const q = flowQuestions[stepIndex];
    if (!q) return true; // Skip validation for steps like "Summary" that have no corresponding question
    const val = answers[q.key];
    if (q.type === "form") {
      if (q.key === "entityDetails") {
        return (
          watchedEntityName.trim().length >= 5 &&
          (!watchedEntityABN ||
            (watchedEntityABN.trim().length === 11 &&
              isValidABN(watchedEntityABN)))
        );
      } else if (q.key === "contactDetails") {
        return (
          answers.contactDetails &&
          answers.contactDetails.name?.trim().length >= 5 &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            answers.contactDetails.email?.trim()
          ) &&
          answers.contactDetails.entityName?.trim().length >= 5 &&
          answers.contactDetails.position?.trim().length >= 5
        );
      }
    }
    return val && (Array.isArray(val) ? val.length > 0 : true);
  };

  const handleStepClick = (step) => {
    if (
      step <= activeStep ||
      flowQuestions.slice(0, step).every((_, i) => isStepValid(i))
    ) {
      setActiveStep(step);
    }
  };

  const handleRadioChange = (key) => (e) =>
    setAnswers({ ...answers, [key]: e.target.value });

  const handleCheckboxChange = (key, value) => (e) => {
    const prev = Array.isArray(answers[key]) ? answers[key] : [];
    let updated = [];

    if (value === "None of the above") {
      updated = e.target.checked
        ? ["None of the above"]
        : prev.filter((v) => v !== "None of the above");
    } else if (value === "All of the above") {
      updated = e.target.checked
        ? [...INDIVIDUAL_OPTIONS, "All of the above"]
        : prev.filter(
            (v) => !INDIVIDUAL_OPTIONS.includes(v) && v !== "All of the above"
          );
    } else {
      if (e.target.checked) {
        updated = [...prev.filter((v) => v !== "None of the above"), value];
        const allSelected = INDIVIDUAL_OPTIONS.every((opt) =>
          updated.includes(opt)
        );
        if (allSelected && !updated.includes("All of the above")) {
          updated.push("All of the above");
        }
      } else {
        updated = prev.filter((v) => v !== value && v !== "All of the above");
      }
    }

    if (JSON.stringify(prev) !== JSON.stringify(updated)) {
      setAnswers({ ...answers, [key]: updated });
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeStep < steps.length - 1 && isStepValid(activeStep)) {
        handleNext();
      }
      // On Contact Details, Enter is handled by react-hook-form's handleSubmit
    }
  };

  const completion =
    activeStep === 0 ? 0 : Math.round((activeStep / steps.length) * 100);

  return (
    <Box sx={{ p: 4 }} onKeyUp={handleKeyUp}>
      <Typography variant="h5" gutterBottom>
        PTRS Compliance Navigator
      </Typography>

      <Box sx={{ mb: 2 }}>
        <LinearProgress variant="determinate" value={completion} />
        <Typography variant="caption">{completion}% complete</Typography>
      </Box>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label, index) => {
          const isEnabled =
            index <= activeStep ||
            flowQuestions.slice(0, index).every((_, i) => isStepValid(i));
          const tooltip = isEnabled
            ? "Click to jump to this step"
            : "Please complete prior steps before accessing this one.";
          const stepLabel = label; // Keep the label as is
          return (
            <Step key={index}>
              <Tooltip title={tooltip} arrow>
                <StepLabel
                  onClick={() => isEnabled && handleStepClick(index)}
                  StepIconProps={{
                    style: {
                      color: isEnabled ? theme.palette.secondary.main : "#ccc",
                      opacity: 1,
                    },
                  }}
                  style={{
                    cursor: isEnabled ? "pointer" : "not-allowed",
                    opacity: isEnabled ? 1 : 0.4, // Ensure inactive steps are visually distinct
                  }}
                >
                  {stepLabel}
                </StepLabel>
              </Tooltip>
            </Step>
          );
        })}
      </Stepper>

      <Card
        sx={{
          maxWidth: 700,
          margin: "0 auto",
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <CardContent>
          {activeStep === steps.length - 2 ? ( // Show Summary of Responses on the second-to-last step
            <>
              <Typography variant="h6" gutterBottom>
                Summary of Responses
              </Typography>
              {/* Entity Details summary at the top */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Entity Details</Typography>
                <ul
                  style={{
                    paddingLeft: "1rem",
                    margin: 0,
                    color: theme.palette.text.secondary,
                  }}
                >
                  <li>
                    <strong>Entity Name:</strong> {watchedEntityName || "—"}
                  </li>
                  <li>
                    <strong>ABN:</strong>{" "}
                    {watchedEntityABN
                      ? watchedEntityABN.replace(
                          /(\d{2})(\d{3})(\d{3})(\d{3})/,
                          "$1 $2 $3 $4"
                        )
                      : "—"}
                  </li>
                </ul>
              </Box>
              <Box sx={{ mb: 2 }}>
                {flowQuestions
                  .filter((q) => q.key !== "contactDetails")
                  .map((q) => {
                    const answer = answers[q.key];
                    const isForm = q.type === "form";
                    const isCheckbox = q.type === "checkbox";

                    const formatABN = (abn) =>
                      abn
                        ? abn.replace(
                            /(\d{2})(\d{3})(\d{3})(\d{3})/,
                            "$1 $2 $3 $4"
                          )
                        : "—";

                    const displayValue = isCheckbox
                      ? answer?.join(", ") || "—"
                      : isForm
                        ? Object.entries(answer || {}).map(([k, v]) => {
                            const label =
                              q.fields.find((f) => f.name === k)?.label || k;
                            const value =
                              k === "entityABN"
                                ? formatABN(v?.trim())
                                : v || "—";
                            return (
                              <li key={k}>
                                <strong>{label}:</strong> {value}
                              </li>
                            );
                          })
                        : answer || "—";

                    return (
                      <Box key={q.key} sx={{ mb: 1 }}>
                        <Typography variant="subtitle2">
                          {q.question}
                        </Typography>
                        <Box
                          sx={{
                            color: "text.secondary",
                            fontSize: "body2.fontSize",
                          }}
                        >
                          {Array.isArray(displayValue) ? (
                            <ul style={{ paddingLeft: "1rem", margin: 0 }}>
                              {displayValue}
                            </ul>
                          ) : isForm ? (
                            <ul style={{ paddingLeft: "1rem", margin: 0 }}>
                              {displayValue}
                            </ul>
                          ) : (
                            displayValue
                          )}
                        </Box>
                      </Box>
                    );
                  })}
              </Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}
              >
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  disabled={activeStep === 0}
                >
                  Back
                </Button>
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              </Box>
            </>
          ) : activeStep === steps.length - 1 ? ( // Show Contact Details on the final step
            <>
              <Typography variant="h6" gutterBottom>
                {current.question || "Contact Details"}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                gutterBottom
                sx={{ mb: 2 }}
              >
                {current.help || "Please provide your contact details."}
              </Typography>
              <form
                noValidate
                onSubmit={handleSubmit(handleNext)}
                autoComplete="off"
                style={{ width: "100%" }}
              >
                <ContactDetailsForm
                  control={control}
                  errors={errors}
                  answers={answers.contactDetails}
                  watchedEntityName={watchedEntityName}
                  theme={theme}
                />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 3,
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={handleBack}
                    disabled={activeStep === 0 || loading}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? "Submitting..." : "Submit"}
                  </Button>
                </Box>
              </form>
            </>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                {current.question}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {current.help}
              </Typography>
              {current.type === "form" ? (
                activeStep === 0 ? (
                  <EntityDetailsForm
                    control={entityControl}
                    errors={entityErrors}
                    answers={answers.entityDetails}
                    theme={theme}
                  />
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    {current.fields.map((field) => (
                      <TextField
                        key={field.name}
                        name={field.name}
                        label={field.label}
                        value={answers[current.key]?.[field.name] || ""}
                        onChange={handleInputChange(current.key)}
                        required={field.required}
                        error={false}
                        helperText=""
                      />
                    ))}
                  </Box>
                )
              ) : current.type === "checkbox" ? (
                <FormGroup>
                  {current.subOptions.map((option, index) => {
                    if (option === "None of the above") {
                      return (
                        <React.Fragment key={option}>
                          <Box
                            sx={{
                              borderBottom: "1px solid #ccc",
                              my: 1,
                              mx: 0,
                              width: "100%",
                            }}
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={(answers[current.key] || []).includes(
                                  option
                                )}
                                onChange={handleCheckboxChange(
                                  current.key,
                                  option
                                )}
                              />
                            }
                            label={option}
                          />
                        </React.Fragment>
                      );
                    }

                    return (
                      <FormControlLabel
                        key={option}
                        control={
                          <Checkbox
                            checked={(answers[current.key] || []).includes(
                              option
                            )}
                            onChange={handleCheckboxChange(current.key, option)}
                          />
                        }
                        label={option}
                      />
                    );
                  })}
                </FormGroup>
              ) : (
                <RadioGroup
                  value={answers[current.key] || ""}
                  onChange={handleRadioChange(current.key)}
                >
                  {current.options.map((option) => (
                    <FormControlLabel
                      key={option}
                      value={option}
                      control={<Radio />}
                      label={option}
                    />
                  ))}
                </RadioGroup>
              )}
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}
              >
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  disabled={activeStep === 0}
                >
                  Back
                </Button>
                {activeStep === 0 ? (
                  <Button
                    variant="contained"
                    onClick={handleEntitySubmit((data) => {
                      setAnswers((prev) => ({
                        ...prev,
                        entityDetails: data,
                      }));
                      handleNext();
                    })}
                    disabled={Boolean(
                      watchedEntityName.trim().length < 5 ||
                        (watchedEntityABN && !/^\d{11}$/.test(watchedEntityABN))
                    )}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={
                      current.type === "checkbox"
                        ? !(answers[current.key]?.length > 0)
                        : !answers[current.key]
                    }
                  >
                    Next
                  </Button>
                )}
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
