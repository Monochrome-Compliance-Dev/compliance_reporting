import React from "react";
import Step4 from "../Step4";

export default function Step4View({
  data,
  onNext,
  onBack,
  reportStatus,
  setStepData,
}) {
  return (
    <Step4
      savedRecords={data}
      onNext={onNext}
      onBack={onBack}
      reportStatus={reportStatus}
      setStepData={setStepData}
    />
  );
}
