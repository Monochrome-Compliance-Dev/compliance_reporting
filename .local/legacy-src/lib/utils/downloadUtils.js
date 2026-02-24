// Utility to trigger a download with a native "Save As" prompt
export async function downloadFile(url, filename = "download.pdf") {
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: "PDF file",
            accept: { "application/pdf": [".pdf"] },
          },
        ],
      });

      const response = await fetch(url);
      const blob = await response.blob();

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (e) {
      console.warn("Save file picker was cancelled or failed.", e);
      return;
    }
  }

  // Fallback for browsers without File System Access API
  const response = await fetch(url);
  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
