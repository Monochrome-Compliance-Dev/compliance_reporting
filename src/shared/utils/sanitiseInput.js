export function sanitiseInput(value) {
  return value
    .trim()
    .replace(/<[^>]*>?/gm, "")
    .replace(/[&<>"']/g, (match) => {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };
      return map[match];
    });
}
