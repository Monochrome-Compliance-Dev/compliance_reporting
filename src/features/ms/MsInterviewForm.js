import { useForm, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  Button,
  Box,
  LinearProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useAuthContext } from "../../context/AuthContext";
import { useTheme } from "@mui/material/styles";
import role from "../../context/role";
import { msService } from "../../services/ms/ms";

// Validation schema with required fields in Reporting Entity
const schema = yup.object().shape({
  reportingEntityName: yup
    .string()
    .required("Legal name of entity is required"),
  reportingEntityABN: yup.string().required("ABN is required"),
  reportingEntityContact: yup
    .string()
    .required("Registered business address is required"),
  reportingEntitySigner: yup
    .string()
    .required("Signer information is required"),
  // Add more fields and validation as needed
});

const MsInterviewForm = () => {
  const { user } = useAuthContext();
  const theme = useTheme();
  const editableSections = role.getEditableSectionsForPosition(user?.position);

  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState(null);
  // Use reportingPeriodId from URL params
  const { reportingPeriodId } = useParams();
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      reportingEntityName: "",
      reportingEntityABN: "",
      reportingEntityContact: "",
      reportingEntitySigner: "",
      isPartOfGroup: "",
      mainBusinessActivities: "",
      operationLocations: "",
      numberOfEmployees: "",
      mainGoodsServicesProcured: "",
      sourceOverseas: "",
      labourHireUse: "",
      risksDescription: "",
      actionsDescription: "",
      effectivenessDescription: "",
      consultationDescription: "",
      otherInfo: "",
    },
  });

  useEffect(() => {
    setLoading(true);
    msService
      .getInterviewResponses(reportingPeriodId)
      .then((data) => {
        console.log("Loaded interview data:", data);
        setInitialData(data);
        if (data) {
          reset(data);
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportingPeriodId, reset]);

  const onSubmit = (data) => {
    // NOTE: Later, role-based permission checks can be passed via props/context
    // to enable/disable editing of each section.
    // msService.submitInterviewResponses(reportingPeriodId, data) // Ready to wire
    console.log(data);
  };

  // Progress calculation
  const watchedFields = watch();
  // Main sections (7): Reporting Entity, Structure/Operations/Supply Chains, Risks, Actions, Effectiveness, Consultation, Other Info
  // We'll count as complete if any key field in each section is non-empty
  const completedSections = [
    // Reporting Entity: any of the 4 required fields
    watchedFields.reportingEntityName ||
    watchedFields.reportingEntityABN ||
    watchedFields.reportingEntityContact ||
    watchedFields.reportingEntitySigner
      ? 1
      : 0,
    // Structure, Operations & Supply Chains: any of the 7
    watchedFields.isPartOfGroup ||
    watchedFields.mainBusinessActivities ||
    watchedFields.operationLocations ||
    watchedFields.numberOfEmployees ||
    watchedFields.mainGoodsServicesProcured ||
    watchedFields.sourceOverseas ||
    watchedFields.labourHireUse
      ? 1
      : 0,
    // Risks
    watchedFields.risksDescription ? 1 : 0,
    // Actions
    watchedFields.actionsDescription ? 1 : 0,
    // Effectiveness
    watchedFields.effectivenessDescription ? 1 : 0,
    // Consultation
    watchedFields.consultationDescription ? 1 : 0,
    // Other Info
    watchedFields.otherInfo ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <Box
        sx={{
          width: "100%",
          maxWidth: 800,
          mx: "auto",
          mt: theme.spacing(4),
          textAlign: "center",
        }}
      >
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Loading interview data...</Typography>
      </Box>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ width: "100%", maxWidth: 800, mx: "auto", mt: theme.spacing(4) }}
    >
      {/* Progress Indicator */}
      <Box sx={{ mb: theme.spacing(3) }}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          Completion: {completedSections} of 7 sections
        </Typography>
        <LinearProgress
          variant="determinate"
          value={(completedSections / 7) * 100}
        />
      </Box>
      {/* Reporting Entity */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Reporting Entity</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Controller
            name="reportingEntityName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Legal name of entity"
                fullWidth
                margin="normal"
                error={!!errors.reportingEntityName}
                helperText={
                  errors.reportingEntityName?.message ||
                  "Full legal name under which you are reporting."
                }
                disabled={!editableSections.includes("Reporting Entity")}
              />
            )}
          />
          <Controller
            name="reportingEntityABN"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="ABN"
                fullWidth
                margin="normal"
                error={!!errors.reportingEntityABN}
                helperText={
                  errors.reportingEntityABN?.message ||
                  "Australian Business Number."
                }
                disabled={!editableSections.includes("Reporting Entity")}
              />
            )}
          />
          <Controller
            name="reportingEntityContact"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Registered business address"
                fullWidth
                margin="normal"
                error={!!errors.reportingEntityContact}
                helperText={
                  errors.reportingEntityContact?.message ||
                  "Street address, city and state."
                }
                disabled={!editableSections.includes("Reporting Entity")}
              />
            )}
          />
          <Controller
            name="reportingEntitySigner"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Who will sign the final statement?"
                fullWidth
                margin="normal"
                error={!!errors.reportingEntitySigner}
                helperText={
                  errors.reportingEntitySigner?.message ||
                  "Full name and position of the person signing."
                }
                disabled={!editableSections.includes("Reporting Entity")}
              />
            )}
          />
        </AccordionDetails>
      </Accordion>

      {/* Structure, Operations & Supply Chains */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Structure, Operations & Supply Chains
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Controller
            name="isPartOfGroup"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Is your business part of a larger corporate group?"
                fullWidth
                margin="normal"
                helperText="If yes, please provide details."
                disabled={
                  !editableSections.includes(
                    "Structure, Operations & Supply Chains"
                  )
                }
              />
            )}
          />
          <Controller
            name="mainBusinessActivities"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Main business activities"
                fullWidth
                margin="normal"
                multiline
                minRows={2}
                helperText="Describe the primary activities your business undertakes."
                disabled={
                  !editableSections.includes(
                    "Structure, Operations & Supply Chains"
                  )
                }
              />
            )}
          />
          <Controller
            name="operationLocations"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Where do you operate?"
                fullWidth
                margin="normal"
                multiline
                minRows={2}
                helperText="Offices, facilities, project sites."
                disabled={
                  !editableSections.includes(
                    "Structure, Operations & Supply Chains"
                  )
                }
              />
            )}
          />
          <Controller
            name="numberOfEmployees"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Approximate number of employees"
                fullWidth
                margin="normal"
                helperText="Include full-time, part-time and casual staff."
                disabled={
                  !editableSections.includes(
                    "Structure, Operations & Supply Chains"
                  )
                }
              />
            )}
          />
          <Controller
            name="mainGoodsServicesProcured"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Main types of goods and services procured"
                fullWidth
                margin="normal"
                multiline
                minRows={2}
                helperText="Describe key goods and services your business purchases."
                disabled={
                  !editableSections.includes(
                    "Structure, Operations & Supply Chains"
                  )
                }
              />
            )}
          />
          <Controller
            name="sourceOverseas"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Do you source anything from overseas?"
                fullWidth
                margin="normal"
                multiline
                minRows={2}
                helperText="List countries if applicable."
                disabled={
                  !editableSections.includes(
                    "Structure, Operations & Supply Chains"
                  )
                }
              />
            )}
          />
          <Controller
            name="labourHireUse"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Use of labour-hire or subcontractors?"
                fullWidth
                margin="normal"
                multiline
                minRows={2}
                helperText="Provide details about any labour-hire or subcontracting arrangements."
                disabled={
                  !editableSections.includes(
                    "Structure, Operations & Supply Chains"
                  )
                }
              />
            )}
          />
        </AccordionDetails>
      </Accordion>

      {/* Risks of Modern Slavery Practices */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Risks of Modern Slavery Practices
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Controller
            name="risksDescription"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Describe identified risks"
                fullWidth
                margin="normal"
                multiline
                minRows={3}
                helperText="Provide details of any modern slavery risks identified in your operations and supply chains."
                disabled={
                  !editableSections.includes(
                    "Risks of Modern Slavery Practices"
                  )
                }
              />
            )}
          />
        </AccordionDetails>
      </Accordion>

      {/* Actions Taken */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Actions Taken</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Controller
            name="actionsDescription"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Describe actions taken"
                fullWidth
                margin="normal"
                multiline
                minRows={3}
                helperText="Outline the steps your business has taken to address modern slavery risks."
                disabled={!editableSections.includes("Actions Taken")}
              />
            )}
          />
        </AccordionDetails>
      </Accordion>

      {/* Assessing Effectiveness */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Assessing Effectiveness</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Controller
            name="effectivenessDescription"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="How effectiveness is assessed"
                fullWidth
                margin="normal"
                multiline
                minRows={3}
                helperText="Explain how your business measures the effectiveness of actions taken."
                disabled={!editableSections.includes("Assessing Effectiveness")}
              />
            )}
          />
        </AccordionDetails>
      </Accordion>

      {/* Consultation */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Consultation</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Controller
            name="consultationDescription"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Describe consultation"
                fullWidth
                margin="normal"
                multiline
                minRows={3}
                helperText="Detail how your business has consulted with entities in your reporting group or stakeholders."
                disabled={!editableSections.includes("Consultation")}
              />
            )}
          />
        </AccordionDetails>
      </Accordion>

      {/* Other Relevant Information */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Other Relevant Information</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Controller
            name="otherInfo"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Other relevant information"
                fullWidth
                margin="normal"
                multiline
                minRows={3}
                helperText="Include any additional information relevant to your modern slavery statement."
                disabled={
                  !editableSections.includes("Other Relevant Information")
                }
              />
            )}
          />
        </AccordionDetails>
      </Accordion>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
        <Button type="submit" variant="contained" color="primary">
          Submit
        </Button>
      </Box>
      {/* 
        NOTE: In the future, each section could use role-based permission checks
        (passed via props or context) to disable/enable editing.
      */}
    </Box>
  );
};

export default MsInterviewForm;
