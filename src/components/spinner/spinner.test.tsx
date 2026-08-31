import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spinner } from "./spinner";

describe("Spinner", () => {
  it("exposes a status role with an accessible label", () => {
    render(<Spinner label="Fetching orders" />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Fetching orders");
  });

  it("defaults the label to Loading", () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });
});
