import { createRef, useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Switch } from "./switch";

describe("Switch", () => {
  it("renders a labelled switch and toggles on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label="Wi-Fi" onChange={onChange} />);
    const sw = screen.getByRole("switch", { name: "Wi-Fi" });
    expect(sw).not.toBeChecked();
    await user.click(sw);
    expect(sw).toBeChecked();
    expect(onChange).toHaveBeenCalled();
  });

  it("toggles with the keyboard", async () => {
    const user = userEvent.setup();
    render(<Switch label="Wi-Fi" />);
    const sw = screen.getByRole("switch");
    sw.focus();
    await user.keyboard(" ");
    expect(sw).toBeChecked();
  });

  it("wires the description via aria-describedby", () => {
    render(<Switch label="2FA" description="OTP on new devices" />);
    const sw = screen.getByRole("switch", { name: "2FA" });
    const id = sw.getAttribute("aria-describedby");
    expect(id).toBeTruthy();
    expect(document.getElementById(id!)).toHaveTextContent("OTP on new devices");
  });

  it("honours a controlled checked value", async () => {
    const user = userEvent.setup();
    function Host() {
      const [on, setOn] = useState(false);
      return <Switch label="Beta" checked={on} onChange={(e) => setOn(e.target.checked)} />;
    }
    render(<Host />);
    const sw = screen.getByRole("switch");
    await user.click(sw);
    expect(sw).toBeChecked();
  });

  it("does not toggle while disabled", async () => {
    const user = userEvent.setup();
    render(<Switch label="Locked" disabled />);
    const sw = screen.getByRole("switch");
    await user.click(sw);
    expect(sw).not.toBeChecked();
    expect(sw).toBeDisabled();
  });

  it("applies size and variant classes", () => {
    const { rerender } = render(<Switch label="x" size="lg" variant="danger" />);
    const sw = screen.getByRole("switch");
    expect(sw.parentElement).toHaveClass("w-11");
    expect(sw.parentElement?.querySelector('[data-slot="switch-track"]')).toHaveClass(
      "peer-checked:bg-danger",
    );
    rerender(<Switch label="x" size="sm" />);
    expect(screen.getByRole("switch").parentElement).toHaveClass("w-7");
  });

  it("merges className onto the input and forwards the ref", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Switch ref={ref} label="x" className="peer-checked:[&+*]:bg-red-500" />);
    expect(ref.current).toBe(screen.getByRole("switch"));
    expect(ref.current).toHaveClass("peer");
  });
});
