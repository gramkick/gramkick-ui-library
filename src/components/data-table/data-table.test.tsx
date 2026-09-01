import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTable, pageRange, type DataTableColumn } from "./data-table";

interface Row {
  id: string;
  user: { name: string; email: string };
  role: string;
  spend: number;
}

const rows: Row[] = Array.from({ length: 25 }, (_, i) => ({
  id: `u${i + 1}`,
  user: { name: `User ${i + 1}`, email: `user${i + 1}@shop.in` },
  role: i % 2 ? "Manager" : "Staff",
  spend: (i + 1) * 100,
}));

const columns: DataTableColumn<Row>[] = [
  { id: "user", header: "Member", accessor: (r) => r.user },
  { id: "role", header: "Role" },
  { id: "spend", header: "Spend", align: "right", cell: (r) => `₹${r.spend}` },
];

describe("DataTable", () => {
  it("renders headers and rows, expanding a rich-cell object into text + subtext", () => {
    render(<DataTable columns={columns} data={rows.slice(0, 3)} aria-label="Members" />);
    const table = screen.getByRole("table", { name: "Members" });
    expect(within(table).getByText("Member")).toBeInTheDocument();
    expect(within(table).getByText("User 1")).toBeInTheDocument();
    expect(within(table).getByText("user1@shop.in")).toBeInTheDocument();
    expect(within(table).getByText("₹100")).toBeInTheDocument();
    expect(within(table).getAllByRole("row")).toHaveLength(1 + 3); // head + 3
  });

  it("shows skeleton rows while loading and no data", () => {
    const { container } = render(
      <DataTable columns={columns} data={rows} loading loadingRows={4} />,
    );
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(screen.queryByText("User 1")).not.toBeInTheDocument();
  });

  it("shows an error state", () => {
    render(<DataTable columns={columns} data={[]} error="Server said no" />);
    const alert = screen.getByRole("alert");
    expect(within(alert).getByText("Server said no")).toBeInTheDocument();
  });

  it("shows the empty state", () => {
    render(<DataTable columns={columns} data={[]} emptyTitle="No members" />);
    expect(screen.getByText("No members")).toBeInTheDocument();
  });

  it("selects rows and reports ids via onSelectionChange", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={rows.slice(0, 3)}
        selectable
        onSelectionChange={onSelectionChange}
      />,
    );
    await user.click(screen.getByRole("checkbox", { name: "Select row 2" }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["u2"], { allPages: false });

    await user.click(screen.getByRole("checkbox", { name: "Select all rows on this page" }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["u2", "u1", "u3"], { allPages: false });
  });

  it("menu mode: 'Select all' reports allPages and shows the banner", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={rows.slice(0, 5)}
        selectable
        selectionMode="menu"
        totalCount={25}
        onSelectionChange={onSelectionChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Selection options" }));
    await user.click(screen.getByText("Select all (25)"));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["u1", "u2", "u3", "u4", "u5"], {
      allPages: true,
    });
    expect(screen.getByText(/All\s*25\s*rows are selected/)).toBeInTheDocument();
  });

  it("paginates: footer status, page buttons, and slicing", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={rows}
        pagination
        defaultPageSize={10}
        onPageChange={onPageChange}
      />,
    );
    expect(screen.getByText(/Showing 1.10 of 25/)).toBeInTheDocument();
    expect(screen.getByText("User 1")).toBeInTheDocument();
    expect(screen.queryByText("User 11")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(screen.getByText("User 11")).toBeInTheDocument();
    expect(screen.getByText(/Showing 11.20 of 25/)).toBeInTheDocument();
  });

  it("sorts a sortable column asc → desc → off and reorders rows", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    const sortCols: DataTableColumn<Row>[] = [
      { id: "name", header: "Name", accessor: (r) => r.user.name, sortable: true },
      {
        id: "spend",
        header: "Spend",
        align: "right",
        sortable: true,
        sortAccessor: (r) => r.spend,
      },
    ];
    const three: Row[] = [
      { id: "a", user: { name: "Bob", email: "b@x.in" }, role: "Staff", spend: 300 },
      { id: "b", user: { name: "Ann", email: "a@x.in" }, role: "Staff", spend: 100 },
      { id: "c", user: { name: "Cy", email: "c@x.in" }, role: "Staff", spend: 200 },
    ];
    render(<DataTable columns={sortCols} data={three} onSortChange={onSortChange} />);

    const cellText = () =>
      screen
        .getAllByRole("row")
        .slice(1)
        .map((r) => r.querySelector("td")!.textContent);
    expect(cellText()).toEqual(["Bob", "Ann", "Cy"]); // original order

    await user.click(screen.getByRole("button", { name: "Spend" }));
    expect(onSortChange).toHaveBeenLastCalledWith({ id: "spend", dir: "asc" });
    expect(cellText()).toEqual(["Ann", "Cy", "Bob"]); // 100, 200, 300

    await user.click(screen.getByRole("button", { name: "Spend" }));
    expect(onSortChange).toHaveBeenLastCalledWith({ id: "spend", dir: "desc" });
    expect(cellText()).toEqual(["Bob", "Cy", "Ann"]); // 300, 200, 100

    await user.click(screen.getByRole("button", { name: "Spend" }));
    expect(onSortChange).toHaveBeenLastCalledWith(null);
    expect(cellText()).toEqual(["Bob", "Ann", "Cy"]); // back to original
  });

  it("marks the sorted column with aria-sort and does not reorder when manualSort", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    const sortCols: DataTableColumn<Row>[] = [
      { id: "name", header: "Name", accessor: (r) => r.user.name, sortable: true },
      { id: "role", header: "Role" },
    ];
    render(
      <DataTable
        columns={sortCols}
        data={rows.slice(0, 3)}
        manualSort
        onSortChange={onSortChange}
      />,
    );
    const nameHeader = screen.getAllByRole("columnheader")[0]!;
    expect(nameHeader).toHaveAttribute("aria-sort", "none");
    await user.click(screen.getByRole("button", { name: "Name" }));
    expect(onSortChange).toHaveBeenLastCalledWith({ id: "name", dir: "asc" });
    expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
    // manualSort: rows stay in the given order
    expect(
      screen
        .getAllByRole("row")
        .slice(1)
        .map((r) => r.querySelector("td")!.textContent),
    ).toEqual(["User 1", "User 2", "User 3"]);
  });

  it("changes the page size and resets to page 1", async () => {
    const user = userEvent.setup();
    const onPageSizeChange = vi.fn();
    function Host() {
      const [p, setP] = useState(2);
      return (
        <DataTable
          columns={columns}
          data={rows}
          pagination
          page={p}
          onPageChange={setP}
          defaultPageSize={10}
          onPageSizeChange={onPageSizeChange}
        />
      );
    }
    render(<Host />);
    await user.click(screen.getByRole("combobox", { name: "Rows per page" }));
    await user.click(screen.getByRole("option", { name: "25 / page" }));
    expect(onPageSizeChange).toHaveBeenCalledWith(25);
    expect(screen.getByText(/Showing 1.25 of 25/)).toBeInTheDocument();
  });

  it("renders a trailing actions column", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={rows.slice(0, 2)}
        actions={(r) => (
          <button type="button" onClick={() => onEdit(r.id)}>
            Edit
          </button>
        )}
        actionsHeader="Do"
      />,
    );
    expect(screen.getByText("Do")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]!);
    expect(onEdit).toHaveBeenCalledWith("u1");
  });

  it("applies variant / size classes", () => {
    render(<DataTable columns={columns} data={rows.slice(0, 1)} variant="bordered" size="lg" />);
    const table = screen.getByRole("table");
    expect(table).toHaveClass("[&_th]:border");
  });

  it("takes custom loading / error / empty states via props", () => {
    const { rerender } = render(
      <DataTable columns={columns} data={rows} loading loadingState={<div>Fetching…</div>} />,
    );
    expect(screen.getByText("Fetching…")).toBeInTheDocument();

    rerender(<DataTable columns={columns} data={[]} error="x" errorState={<div>Oops</div>} />);
    expect(screen.getByText("Oops")).toBeInTheDocument();

    rerender(<DataTable columns={columns} data={[]} emptyState={<div>Blank slate</div>} />);
    expect(screen.getByText("Blank slate")).toBeInTheDocument();
  });

  it("pins only the checkbox column left (and actions right) when selectable + stickyFirstColumn", () => {
    render(
      <DataTable
        columns={columns}
        data={rows.slice(0, 2)}
        selectable
        stickyFirstColumn
        stickyActions
        actions={() => <button>Go</button>}
      />,
    );
    const ths = within(screen.getAllByRole("row")[0]!).getAllByRole("columnheader");
    expect(ths[0]).toHaveClass("sticky", "left-0"); // checkbox column
    expect(ths[1]).not.toHaveClass("sticky"); // first data column is NOT pinned
    expect(ths[ths.length - 1]).toHaveClass("sticky", "right-0"); // actions
  });

  it("pins the first data column left when stickyFirstColumn and no selection", () => {
    render(<DataTable columns={columns} data={rows.slice(0, 2)} stickyFirstColumn />);
    const ths = within(screen.getAllByRole("row")[0]!).getAllByRole("columnheader");
    expect(ths[0]).toHaveClass("sticky", "left-0");
    expect(ths[1]).not.toHaveClass("sticky");
  });

  it("highlights rows that match the highlightBackgroundColor resolver", () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={rows.slice(0, 4)}
        highlightBackgroundColor={(r) => (r.role === "Manager" ? "rgb(254, 242, 242)" : undefined)}
      />,
    );
    const bodyRows = container.querySelectorAll("tbody tr");
    // rows 2 and 4 (index 1, 3) are Managers
    expect(bodyRows[0]).not.toHaveAttribute("data-highlighted");
    expect(bodyRows[1]).toHaveAttribute("data-highlighted", "true");
    expect(bodyRows[1]).toHaveStyle({ background: "rgb(254, 242, 242)" });
    expect(bodyRows[3]).toHaveAttribute("data-highlighted", "true");
  });

  it("pageRange: first/last two pages with the current page between ellipses", () => {
    expect(pageRange(1, 10)).toEqual([1, 2, "gap", 9, 10]);
    expect(pageRange(2, 10)).toEqual([1, 2, "gap", 9, 10]);
    expect(pageRange(3, 10)).toEqual([1, 2, "gap", 3, "gap", 9, 10]);
    expect(pageRange(4, 10)).toEqual([1, 2, "gap", 4, "gap", 9, 10]);
    expect(pageRange(9, 10)).toEqual([1, 2, "gap", 9, 10]);
    expect(pageRange(10, 10)).toEqual([1, 2, "gap", 9, 10]);
    expect(pageRange(3, 6)).toEqual([1, 2, 3, 4, 5, 6]); // small count -> every page
  });

  it("does not force column widths unless a column asks for one", () => {
    const { container } = render(
      <DataTable
        columns={[
          { id: "user", header: "M", accessor: (r) => r.user },
          { id: "role", header: "R" },
        ]}
        data={rows.slice(0, 1)}
      />,
    );
    // no width on any column -> no <colgroup> at all
    expect(container.querySelector("colgroup")).toBeNull();
  });

  it("maxHeight caps the scroll region; isFixedHeight makes it a fixed height + pins the header", () => {
    const { container, rerender } = render(
      <DataTable columns={columns} data={rows} maxHeight={300} />,
    );
    const scroll = () => container.querySelector<HTMLElement>('[data-slot="data-table-scroll"]')!;
    expect(scroll().style.maxHeight).toBe("300px");
    expect(scroll().style.height).toBe("");
    // header not pinned without stickyHeader / isFixedHeight
    expect(container.querySelector("thead th")).not.toHaveClass("sticky");

    rerender(<DataTable columns={columns} data={rows} maxHeight={300} isFixedHeight />);
    expect(scroll().style.height).toBe("300px");
    expect(scroll().style.maxHeight).toBe("");
    expect(scroll()).toHaveClass("overflow-y-auto");
    expect(container.querySelector("thead th")).toHaveClass("sticky", "top-0");
  });
});
