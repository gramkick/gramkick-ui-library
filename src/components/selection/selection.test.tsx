import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox, CheckboxGroup, Radio, RadioGroup } from "./selection";

describe("Checkbox", () => {
  it("renders a labelled checkbox and toggles on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Accept terms" onChange={onChange} />);
    const box = screen.getByRole("checkbox", { name: "Accept terms" });
    expect(box).not.toBeChecked();
    await user.click(box);
    expect(box).toBeChecked();
    expect(onChange).toHaveBeenCalled();
  });

  it("wires the description via aria-describedby", () => {
    render(<Checkbox label="Marketing" description="Occasional product news" />);
    const box = screen.getByRole("checkbox", { name: "Marketing" });
    const id = box.getAttribute("aria-describedby");
    expect(id).toBeTruthy();
    expect(document.getElementById(id!)).toHaveTextContent("Occasional product news");
  });

  it("sets the DOM indeterminate property", () => {
    const { rerender } = render(<Checkbox label="All" indeterminate />);
    expect((screen.getByRole("checkbox") as HTMLInputElement).indeterminate).toBe(true);
    rerender(<Checkbox label="All" indeterminate={false} />);
    expect((screen.getByRole("checkbox") as HTMLInputElement).indeterminate).toBe(false);
  });

  it("honours a controlled checked value", async () => {
    const user = userEvent.setup();
    function Host() {
      const [on, setOn] = useState(false);
      return <Checkbox label="Wrap" checked={on} onChange={(e) => setOn(e.target.checked)} />;
    }
    render(<Host />);
    const box = screen.getByRole("checkbox");
    await user.click(box);
    expect(box).toBeChecked();
  });

  it("does not toggle while disabled", async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Locked" disabled />);
    const box = screen.getByRole("checkbox");
    await user.click(box);
    expect(box).not.toBeChecked();
    expect(box).toBeDisabled();
  });

  it("applies size and variant classes", () => {
    render(<Checkbox label="x" size="lg" variant="danger" />);
    const box = screen.getByRole("checkbox");
    expect(box.parentElement).toHaveClass("size-6");
    expect(box.nextElementSibling).toHaveClass("peer-checked:bg-danger");
  });
});

describe("RadioGroup", () => {
  const options = [
    { value: "standard", label: "Standard" },
    { value: "express", label: "Express" },
    { value: "pickup", label: "Pickup", disabled: true },
  ];

  it("renders a radiogroup and selects one option at a time", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RadioGroup label="Speed" options={options} onChange={onChange} />);

    expect(screen.getByRole("radiogroup", { name: "Speed" })).toBeInTheDocument();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);

    await user.click(screen.getByRole("radio", { name: "Express" }));
    expect(onChange).toHaveBeenCalledWith("express");
    expect(screen.getByRole("radio", { name: "Express" })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "Standard" }));
    expect(screen.getByRole("radio", { name: "Standard" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Express" })).not.toBeChecked();
  });

  it("shares one name across its radios and marks disabled items", () => {
    render(<RadioGroup label="Speed" options={options} />);
    const [a, b] = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(a!.name).toBeTruthy();
    expect(a!.name).toBe(b!.name);
    expect(screen.getByRole("radio", { name: "Pickup" })).toBeDisabled();
  });

  it("honours defaultValue and a controlled value", async () => {
    const user = userEvent.setup();
    function Host() {
      const [v, setV] = useState("standard");
      return (
        <>
          <RadioGroup value={v} onChange={setV} label="Speed" options={options} />
          <span data-testid="v">{v}</span>
        </>
      );
    }
    render(<Host />);
    expect(screen.getByRole("radio", { name: "Standard" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "Express" }));
    expect(screen.getByTestId("v")).toHaveTextContent("express");
  });

  it("passes variant / size down to its radios", () => {
    render(
      <RadioGroup label="s" size="sm" variant="secondary">
        <Radio value="a" label="A" />
      </RadioGroup>,
    );
    const radio = screen.getByRole("radio", { name: "A" });
    expect(radio.parentElement).toHaveClass("size-4");
    expect(radio.nextElementSibling).toHaveClass("peer-checked:bg-ink");
  });
});

describe("CheckboxGroup", () => {
  const options = [
    { value: "email", label: "Email" },
    { value: "sms", label: "SMS" },
    { value: "push", label: "Push" },
  ];

  it("toggles membership and reports the array", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CheckboxGroup label="Alerts" defaultValue={["sms"]} options={options} onChange={onChange} />,
    );

    expect(screen.getByRole("group", { name: "Alerts" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "SMS" })).toBeChecked();

    await user.click(screen.getByRole("checkbox", { name: "Email" }));
    expect(onChange).toHaveBeenLastCalledWith(["sms", "email"]);

    await user.click(screen.getByRole("checkbox", { name: "SMS" }));
    expect(onChange).toHaveBeenLastCalledWith(["email"]);
  });

  it("supports a controlled value", async () => {
    const user = userEvent.setup();
    function Host() {
      const [v, setV] = useState<string[]>([]);
      return (
        <>
          <CheckboxGroup value={v} onChange={setV} label="Alerts" options={options} />
          <span data-testid="v">{v.join(",")}</span>
        </>
      );
    }
    render(<Host />);
    await user.click(screen.getByRole("checkbox", { name: "Push" }));
    expect(screen.getByTestId("v")).toHaveTextContent("push");
    expect(screen.getByRole("checkbox", { name: "Push" })).toBeChecked();
  });
});
