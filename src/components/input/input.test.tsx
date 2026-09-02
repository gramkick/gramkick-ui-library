import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Input } from "./input";

const codes = [
  { value: "+91", label: "India +91", triggerLabel: "+91" },
  { value: "+1", label: "USA +1", triggerLabel: "+1" },
  { value: "+44", label: "UK +44", triggerLabel: "+44", disabled: true },
];

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

  it("multiline renders a textarea with the same label / hint chrome", async () => {
    render(<Input label="Description" hint="Shown to customers" multiline rows={4} />);
    const field = screen.getByLabelText("Description");
    expect(field.tagName).toBe("TEXTAREA");
    expect(field).toHaveAttribute("rows", "4");
    expect(field.getAttribute("aria-describedby")).toBeTruthy();
    await userEvent.type(field, "Line 1\nLine 2");
    expect(field).toHaveValue("Line 1\nLine 2");
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

  it("renders a left select addon, opens it, and reports the pick", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Input
        label="Phone"
        leftSelect={{ options: codes, defaultValue: "+91", "aria-label": "Country code", onChange }}
      />,
    );

    const trigger = screen.getByRole("combobox", { name: "Country code" });
    expect(trigger).toHaveTextContent("+91");

    await user.click(trigger);
    const list = screen.getByRole("listbox", { name: "Country code" });
    await user.click(within(list).getByRole("option", { name: "USA +1" }));

    expect(onChange).toHaveBeenCalledWith("+1");
    expect(trigger).toHaveTextContent("+1");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("skips disabled addon options", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Input
        aria-label="Phone"
        leftSelect={{ options: codes, defaultValue: "+91", "aria-label": "Country code", onChange }}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Country code" }));
    await user.click(screen.getByRole("option", { name: "UK +44" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("option", { name: "UK +44" })).toHaveAttribute("aria-disabled", "true");
  });

  it("joins the addon to the field by trimming the shared edge", () => {
    const { rerender } = render(
      <Input aria-label="p" leftSelect={{ options: codes, "aria-label": "code" }} />,
    );
    expect(screen.getByLabelText("p")).toHaveClass("rounded-l-none", "border-l-0");

    rerender(<Input aria-label="p" rightSelect={{ options: codes, "aria-label": "unit" }} />);
    expect(screen.getByLabelText("p")).toHaveClass("rounded-r-none", "border-r-0");
  });

  it("still accepts typed text alongside an addon", async () => {
    render(
      <Input
        label="Phone"
        leftSelect={{ options: codes, defaultValue: "+91", "aria-label": "code" }}
      />,
    );
    const field = screen.getByRole("textbox", { name: "Phone" });
    await userEvent.type(field, "9876543210");
    expect(field).toHaveValue("9876543210");
  });

  it("disables the addon when the input is disabled", () => {
    render(
      <Input
        aria-label="Phone"
        disabled
        leftSelect={{ options: codes, "aria-label": "Country code" }}
      />,
    );
    expect(screen.getByRole("combobox", { name: "Country code" })).toBeDisabled();
  });

  it("supports a controlled addon value", async () => {
    const user = userEvent.setup();
    function Host() {
      const [code, setCode] = useState("+91");
      return (
        <Input
          aria-label="Phone"
          leftSelect={{
            options: codes,
            value: code,
            onChange: setCode,
            "aria-label": "Country code",
          }}
        />
      );
    }
    render(<Host />);
    const trigger = screen.getByRole("combobox", { name: "Country code" });
    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: "USA +1" }));
    expect(trigger).toHaveTextContent("+1");
  });

  it("allowPattern blocks keystrokes that would break the pattern", async () => {
    render(<Input aria-label="PIN" allowPattern={/^\d*$/} />);
    const field = screen.getByRole("textbox", { name: "PIN" });
    await userEvent.type(field, "12ab34cd");
    expect(field).toHaveValue("1234");
  });

  it("allowPattern still lets the field be cleared", async () => {
    render(<Input aria-label="PIN" allowPattern={/^\d*$/} defaultValue="4821" />);
    const field = screen.getByRole("textbox", { name: "PIN" });
    await userEvent.clear(field);
    expect(field).toHaveValue("");
  });

  it("allowPattern only fires onChange for accepted values", async () => {
    const seen: string[] = [];
    render(
      <Input
        aria-label="PIN"
        allowPattern={/^\d*$/}
        onChange={(e) => seen.push(e.currentTarget.value)}
      />,
    );
    const field = screen.getByRole("textbox", { name: "PIN" });
    await userEvent.type(field, "1a2");
    expect(seen).toEqual(["1", "12"]);
    expect(field).toHaveValue("12");
  });

  it("allowPattern supports fractional constraints and works with a controlled value", async () => {
    const user = userEvent.setup();
    function Host() {
      const [v, setV] = useState("");
      return (
        <Input
          aria-label="Amount"
          allowPattern={/^\d*\.?\d{0,2}$/}
          value={v}
          onChange={(e) => setV(e.target.value)}
        />
      );
    }
    render(<Host />);
    const field = screen.getByRole("textbox", { name: "Amount" });
    await user.type(field, "12.345");
    expect(field).toHaveValue("12.34");
  });
});
