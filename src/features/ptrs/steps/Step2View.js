import React from "react";
import Step2 from "../ptrs/Step2";

export default function Step2View({ data, onNext, onBack, reportStatus }) {
  return (
    <Step2
      savedRecords={data}
      onNext={onNext}
      onBack={onBack}
      reportStatus={reportStatus}
    />
  );
}
