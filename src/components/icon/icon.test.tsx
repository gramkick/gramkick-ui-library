import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createIcon, icons, ShoppingCartIcon, CheckIcon } from "./index";

describe("icons", () => {
  it("renders a 24×24 svg by default, decorative (aria-hidden)", () => {
    const { container } = render(<ShoppingCartIcon data-testid="cart" />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("width", "24");
    expect(svg).toHaveAttribute("height", "24");
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("stroke", "currentColor");
    expect(svg).toHaveAttribute("fill", "none");
  });

  it("honours size, color and strokeWidth props", () => {
    const { container } = render(<CheckIcon size={18} color="#087a35" strokeWidth={1.5} />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("width", "18");
    expect(svg).toHaveAttribute("height", "18");
    expect(svg).toHaveAttribute("stroke-width", "1.5");
    expect(svg).toHaveStyle({ color: "#087a35" });
  });

  it("exposes an accessible name when given a title", () => {
    render(<ShoppingCartIcon title="Cart" />);
    const img = screen.getByRole("img", { name: "Cart" });
    expect(img).not.toHaveAttribute("aria-hidden");
  });

  it("merges className and forwards arbitrary svg props / ref", () => {
    const ref = createRef<SVGSVGElement>();
    const { container } = render(
      <CheckIcon ref={ref} className="size-4 text-leaf" data-foo="bar" />,
    );
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveClass("shrink-0", "size-4", "text-leaf");
    expect(svg).toHaveAttribute("data-foo", "bar");
    expect(ref.current).toBe(svg);
  });

  it("createIcon can build a solid (fill) icon", () => {
    const Dot = createIcon("Dot", <circle cx="12" cy="12" r="6" />, { variant: "fill" });
    const { container } = render(<Dot />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("fill", "currentColor");
    expect(svg).not.toHaveAttribute("stroke");
  });

  it("the `icons` map holds every exported icon", () => {
    expect(Object.keys(icons).length).toBeGreaterThan(50);
    expect(icons.ShoppingCartIcon).toBe(ShoppingCartIcon);
  });
});
