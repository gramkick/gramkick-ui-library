import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { DataTable, type DataTableColumn } from "./data-table";
import { Badge } from "../badge/badge";
import { Button } from "../button/button";

interface Member {
  id: string;
  user: { name: string; email: string; iconUrl: string };
  role: string;
  status: "active" | "invited" | "suspended";
  phone: string;
  city: string;
  region: string;
  plan: string;
  segment: string;
  orders: number;
  lastOrder: string;
  joined: string;
  balance: number;
  spend: number;
}

const members: Member[] = Array.from({ length: 47 }, (_, i) => ({
  id: `m${i + 1}`,
  user: {
    name:
      ["Asha Rao", "Vikram Shah", "Neha Kulkarni", "Raj Patel", "Priya Nair"][i % 5]! + ` ${i + 1}`,
    email: `member${i + 1}@sharma-kirana.in`,
    iconUrl: `https://i.pravatar.cc/64?img=${(i % 60) + 1}`,
  },
  role: ["Owner", "Manager", "Staff", "Cashier"][i % 4]!,
  status: (["active", "invited", "suspended"] as const)[i % 3]!,
  phone: `+91 9${String(800000000 + i * 137).slice(0, 9)}`,
  city: ["Pune", "Mumbai", "Nashik", "Nagpur", "Aurangabad"][i % 5]!,
  region: ["West", "North", "South", "East"][i % 4]!,
  plan: ["Free", "Growth", "Pro", "Enterprise"][i % 4]!,
  segment: ["New", "Regular", "VIP", "Churn risk"][i % 4]!,
  orders: (i * 7) % 40,
  lastOrder: `${(i % 28) + 1} ${["Jan", "Feb", "Mar", "Apr"][i % 4]}`,
  joined: `${["Jan", "Mar", "Jun", "Sep", "Nov"][i % 5]} 202${(i % 4) + 1}`,
  balance: (i % 6) * 250 - 200,
  spend: (i + 1) * 340,
}));

// A larger set so `FullFeatured` shows real pagination.
const manyMembers: Member[] = [
  ...members,
  ...members.map((m, i) => {
    const n = members.length + i + 1;
    return {
      ...m,
      id: `m${n}`,
      user: { ...m.user, email: `member${n}@sharma-kirana.in` },
    };
  }),
];

// No `width` on any column — each sizes to its content and the table scrolls.
const columns: DataTableColumn<Member>[] = [
  {
    id: "user",
    header: "Member",
    accessor: (r) => r.user,
    sortable: true,
    sortAccessor: (r) => r.user.name,
  },
  { id: "role", header: "Role", sortable: true },
  {
    id: "status",
    header: "Status",
    cell: (r) => (
      <Badge
        variant={r.status === "active" ? "success" : r.status === "invited" ? "info" : "danger"}
        size="sm"
      >
        {r.status}
      </Badge>
    ),
  },
  { id: "phone", header: "Phone" },
  { id: "city", header: "City" },
  { id: "region", header: "Region" },
  { id: "plan", header: "Plan" },
  {
    id: "segment",
    header: "Segment",
    cell: (r) => (
      <Badge
        variant={
          r.segment === "VIP" ? "success" : r.segment === "Churn risk" ? "warning" : "neutral"
        }
        size="sm"
      >
        {r.segment}
      </Badge>
    ),
  },
  { id: "orders", header: "Orders", align: "right", sortable: true },
  { id: "lastOrder", header: "Last order" },
  { id: "joined", header: "Joined" },
  {
    id: "balance",
    header: "Balance",
    align: "right",
    cell: (r) => (
      <span className={r.balance < 0 ? "text-danger" : "text-ink"}>
        ₹{r.balance.toLocaleString("en-IN")}
      </span>
    ),
  },
  {
    id: "spend",
    header: "Spend",
    align: "right",
    cell: (r) => `₹${r.spend.toLocaleString("en-IN")}`,
    sortable: true,
    sortAccessor: (r) => r.spend,
  },
];

const meta = {
  title: "Components/DataTable",
  component: DataTable,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "striped", "bordered"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    selectionMode: { control: "inline-radio", options: ["checkbox", "menu"] },
    loading: { control: "boolean" },
    selectable: { control: "boolean" },
    stickyFirstColumn: { control: "boolean" },
    stickyActions: { control: "boolean" },
    stickyHeader: { control: "boolean" },
    isFixedHeight: { control: "boolean" },
  },
  args: { columns, data: members, "aria-label": "Members" },
  decorators: [
    // Full-width frame: the card fills the canvas, and the many columns still
    // force the table to scroll *inside* the scroll region — the card border and
    // the pagination footer stay put at the canvas width.
    (Story) => (
      <div className="w-full min-w-0">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DataTable<Member>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = { args: { variant: "striped" } };

export const FullFeatured: Story = {
  render: (args) => {
    const Demo = () => {
      const [selected, setSelected] = useState<string[]>([]);
      return (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">{selected.length} selected</p>
          <DataTable
            {...args}
            data={manyMembers}
            variant="striped"
            selectable
            selectionMode="menu"
            selectedIds={selected}
            onSelectionChange={(ids) => setSelected(ids)}
            stickyFirstColumn
            stickyActions
            pagination
            defaultPageSize={10}
            actions={(r) => (
              <Button size="sm" variant="ghost" onClick={() => alert(r.user.name)}>
                View
              </Button>
            )}
          />
        </div>
      );
    };
    return <Demo />;
  },
};

export const Highlighted: Story = {
  args: {
    variant: "striped",
    pagination: true,
    defaultPageSize: 10,
    // Flag suspended members with a warm tint — the pinned columns match it too.
    highlightBackgroundColor: (r: Member) => (r.status === "suspended" ? "#fef2f2" : undefined),
  },
};

export const Sorting: Story = {
  args: {
    data: manyMembers,
    variant: "striped",
    pagination: true,
    defaultPageSize: 10,
    // Sortable columns show a toggle in the header; click cycles asc → desc → off.
    defaultSort: { id: "spend", dir: "desc" },
  },
};

export const FixedHeight: Story = {
  args: {
    variant: "striped",
    isFixedHeight: true,
    maxHeight: 340,
    pagination: true,
    defaultPageSize: 25,
    selectable: true,
    stickyFirstColumn: true,
    stickyActions: true,
    actions: () => (
      <Button size="sm" variant="ghost">
        Edit
      </Button>
    ),
  },
};

export const Loading: Story = { args: { loading: true, pagination: true, defaultPageSize: 8 } };

export const Empty: Story = {
  args: {
    data: [],
    emptyTitle: "No members yet",
    emptyDescription: "Invite your team to get started.",
  },
};

export const ErrorState: Story = {
  name: "Error",
  args: { data: [], error: "The members service is unavailable. Try again shortly." },
};

export const StickyOnMobile: Story = {
  args: {
    selectable: true,
    stickyFirstColumn: true,
    stickyActions: true,
    pagination: true,
    defaultPageSize: 8,
  },
  render: (args) => (
    <div className="w-[22rem] overflow-hidden rounded-gk-lg">
      <DataTable
        {...args}
        actions={() => (
          <Button size="sm" variant="ghost">
            Edit
          </Button>
        )}
      />
    </div>
  ),
};
