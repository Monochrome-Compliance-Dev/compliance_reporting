import { render, screen } from "./test-utils";
import Alert from "../../src/components/common/Alert";

test("renders alert with message", () => {
  render(<Alert severity="success">This is a success message</Alert>);
  expect(screen.getByText(/success message/i)).toBeInTheDocument();
});
