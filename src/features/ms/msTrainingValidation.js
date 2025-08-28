import * as Yup from "yup";

export const defaultTrainingValues = {
  employeeName: "",
  department: "",
  completed: false,
  completedAt: null,
};

export const trainingValidationSchema = Yup.object().shape({
  employeeName: Yup.string()
    .trim()
    .min(3, "Employee Name must be at least 3 characters")
    .required("Employee Name is required"),
  department: Yup.string()
    .trim()
    .min(3, "Department must be at least 3 characters")
    .required("Department is required"),
  completed: Yup.boolean(),
  completedAt: Yup.date()
    .nullable()
    .when("completed", {
      is: true,
      then: (schema) =>
        schema.required("Date Completed is required when marked completed"),
    }),
});
