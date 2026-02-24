export default function DataErrorBoundary({ error }) {
  const message = error?.message || "An unexpected error occurred.";
  const status = error?.status || 500;

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Error {status}</h1>
      <p>{message}</p>
    </div>
  );
}
