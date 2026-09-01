import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { icons, type IconProps, ShoppingCartIcon } from "./index";

/** One icon wired to the controls; the **Gallery** story previews the whole set. */
function IconPlayground(props: IconProps) {
  return <ShoppingCartIcon {...props} />;
}

const meta = {
  title: "Components/Icons",
  component: IconPlayground,
  tags: ["autodocs"],
  args: { size: 32, strokeWidth: 2 },
  argTypes: {
    size: { control: { type: "range", min: 12, max: 96, step: 2 } },
    strokeWidth: { control: { type: "range", min: 1, max: 3, step: 0.25 } },
    color: { control: "color" },
    title: { control: "text" },
  },
} satisfies Meta<typeof IconPlayground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Searchable preview of every icon in the library. Click a tile to copy its name. */
export const Gallery: Story = {
  args: { size: 24, strokeWidth: 2 },
  render: ({ size, strokeWidth, color }) => {
    const Grid = () => {
      const [q, setQ] = useState("");
      const [copied, setCopied] = useState<string | null>(null);
      const entries = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return Object.entries(icons).filter(([name]) =>
          needle ? name.toLowerCase().includes(needle) : true,
        );
      }, [q]);

      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter icons…"
              className="h-9 w-64 rounded-gk-md border border-line bg-canvas px-3 text-sm text-ink placeholder:text-muted focus:border-leaf focus:outline-none focus:ring-2 focus:ring-leaf/30"
            />
            <span className="text-xs text-muted">
              {entries.length} / {Object.keys(icons).length}
            </span>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-3">
            {entries.map(([name, Icon]) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(name);
                  setCopied(name);
                  window.setTimeout(() => setCopied((c) => (c === name ? null : c)), 1200);
                }}
                className="flex cursor-pointer flex-col items-center gap-2 rounded-gk-md border border-line bg-canvas p-3 text-center text-ink transition-colors hover:bg-mint"
              >
                <Icon size={size} strokeWidth={strokeWidth} color={color} />
                <span className="text-[0.6875rem] leading-tight text-muted">
                  {copied === name ? "copied!" : name}
                </span>
              </button>
            ))}
            {entries.length === 0 ? (
              <p className="col-span-full text-sm text-muted">No icon matches “{q}”.</p>
            ) : null}
          </div>
        </div>
      );
    };
    return <Grid />;
  },
};

/** Colour comes from `currentColor` (inherit) or the `color` prop per icon. */
export const Colored: Story = {
  render: () => (
    <div className="flex items-center gap-4 text-leaf">
      <icons.TagIcon size={28} />
      <icons.TruckIcon size={28} />
      <icons.PackageCheckIcon size={28} />
      <icons.HeartIcon size={28} color="#b42318" />
      <icons.StarIcon size={28} color="#f5d76b" />
    </div>
  ),
};
