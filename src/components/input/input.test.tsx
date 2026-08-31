import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Input } from "./input";

describe("Input", () => {
  it("accepts typed text", async () => {
    render(<Input aria-label="Store name" />);
    const field = screen.getByRole("textbox", { name: "Store name" });
    await userEvent.type(field, "Sharma Kirana");
    expect(field).toHaveValue("Sharma Kirana");
  });

  it("wires the label to the input", () => {
    render(<Input label="GST number" />);
    const field = screen.getByLabelText("GST number");
    expect(field.tagName).toBe("INPUT");
  });

  it("marks required fields on the label", () => {
    render(<Input label="Name" required />);
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toBeRequired();
  });

  it("links a hint via aria-describedby", () => {
    render(<Input label="GST" hint="15-character GSTIN" />);
    const field = screen.getByLabelText("GST");
    const describedBy = field.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent("15-character GSTIN");
  });

  it("shows an error, links it, and sets aria-invalid; hint is hidden", () => {
    render(<Input label="GST" hint="15-character GSTIN" error="Invalid GSTIN" />);
    const field = screen.getByLabelText("GST");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Invalid GSTIN")).toBeInTheDocument();
    expect(screen.queryByText("15-character GSTIN")).not.toBeInTheDocument();
    const describedBy = field.getAttribute("aria-describedby");
    expect(document.getElementById(describedBy!)).toHaveTextContent("Invalid GSTIN");
  });

  it("sets aria-invalid from the invalid prop and omits it by default", () => {
    const { rerender } = render(<Input aria-label="GST" />);
    expect(screen.getByLabelText("GST")).not.toHaveAttribute("aria-invalid");
    rerender(<Input aria-label="GST" invalid />);
    expect(screen.getByLabelText("GST")).toHaveAttribute("aria-invalid", "true");
  });

  it("applies size and variant classes", () => {
    const { rerender } = render(<Input aria-label="f" size="lg" variant="filled" />);
    const field = screen.getByLabelText("f");
    expect(field).toHaveClass("h-12", "text-base", "bg-mint");
    rerender(<Input aria-label="f" size="sm" />);
    expect(screen.getByLabelText("f")).toHaveClass("h-9");
  });

  it("renders left and right icons and pads the field for them", () => {
    render(
      <Input
        aria-label="Search"
        leftIcon={<span data-testid="left" />}
        rightIcon={<span data-testid="right" />}
      />,
    );
    expect(screen.getByTestId("left")).toBeInTheDocument();
    expect(screen.getByTestId("right")).toBeInTheDocument();
    const field = screen.getByLabelText("Search");
    expect(field).toHaveClass("pl-10", "pr-10");
  });

  it("keeps the left icon non-interactive and the right icon interactive", async () => {
    function PasswordField() {
      const [show, setShow] = useState(false);
      return (
        <Input
          label="Password"
          type={show ? "text" : "password"}
          defaultValue="secret"
          leftIcon={<span data-testid="left" />}
          rightIcon={
            <button type="button" aria-label="Toggle" onClick={() => setShow((v) => !v)}>
              eye
            </button>
          }
        />
      );
    }
    render(<PasswordField />);
    const field = screen.getByLabelText("Password");
    expect(field).toHaveAttribute("type", "password");

    // left icon wrapper is inert
    expect(screen.getByTestId("left").parentElement).toHaveClass("pointer-events-none");

    // right icon button works
    await userEvent.click(screen.getByRole("button", { name: "Toggle" }));
    expect(field).toHaveAttribute("type", "text");
  });

  it("does not accept input while disabled", async () => {
    render(<Input label="Locked" disabled />);
    const field = screen.getByLabelText("Locked");
    expect(field).toBeDisabled();
    await userEvent.type(field, "nope");
    expect(field).toHaveValue("");
  });

  it("is read-only: value stays, typing is ignored, no disabled attribute", async () => {
    render(<Input label="Merchant ID" defaultValue="usr_1" readOnly />);
    const field = screen.getByLabelText("Merchant ID");
    expect(field).toHaveAttribute("readonly");
    expect(field).not.toBeDisabled();
    await userEvent.type(field, "xxx");
    expect(field).toHaveValue("usr_1");
  });

  it("merges consumer className onto the input and containerClassName onto the wrapper", () => {
    render(
      <Input aria-label="f" className="font-mono" containerClassName="w-40" data-testid="w" />,
    );
    const field = screen.getByLabelText("f");
    expect(field).toHaveClass("font-mono");
    expect(field.closest("div.w-40")).toBeInTheDocument();
  });
});
