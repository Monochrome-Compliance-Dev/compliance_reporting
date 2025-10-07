import { useReactToPrint } from "react-to-print";

export function usePrintComponent(printRef, options = {}) {
  console.log("printRef, options: ", printRef, options);
  const triggerPrint = useReactToPrint({
    content: () => {
      if (!printRef?.current) {
        console.error("printRef.current is undefined during print trigger.");
        return null;
      }
      return printRef.current;
    },
    documentTitle: options.title || "document",
    onAfterPrint: options.onAfterPrint || (() => {}),
    onBeforePrint: options.onBeforePrint || (() => {}),
    removeAfterPrint: options.removeAfterPrint || false,
  });

  return () => {
    if (!printRef?.current) {
      console.warn("Tried to print but printRef.current is still undefined.");
      return;
    }

    try {
      const result = triggerPrint();
      if (result && typeof result.then === "function") {
        result.then(() => {
          console.log("Print triggered successfully");
        });
      } else {
        console.log("Print triggered synchronously or no Promise returned.");
      }
    } catch (error) {
      console.error("Error during print trigger:", error);
    }
  };
}
