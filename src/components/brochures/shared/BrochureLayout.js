import ModernSlaveryPartnerBrochure from "../../partners/products/ModernSlavery";
import BrochureButtons from "./BrochureButtons";

export default function BrochureLayout() {
  console.log("BrochureLayout");
  return <BrochureButtons PrintableContent={ModernSlaveryPartnerBrochure} />;
}
