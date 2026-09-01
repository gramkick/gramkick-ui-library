import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FileUpload } from "./file-upload";

const makeFile = (
  name: string,
  { type = "text/plain", size = 4, lastModified = 1_700_000_000_000 } = {},
) => new File(["x".repeat(size)], name, { type, lastModified });

const zone = () => screen.getByRole("button", { name: /drag & drop/i });
const filledZone = () => screen.getByRole("button", { name: "Replace file" });

describe("FileUpload", () => {
  it("wires label / hint and opens the dialog from the zone", async () => {
    const user = userEvent.setup();
    render(<FileUpload label="Attachment" hint="Max 5 MB" />);
    const input = screen.getByLabelText("Attachment");
    expect(input).toHaveAttribute("type", "file");
    expect(input.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("Max 5 MB")).toBeInTheDocument();

    const clickSpy = vi.spyOn(input as HTMLInputElement, "click");
    await user.click(zone());
    expect(clickSpy).toHaveBeenCalled();
  });

  it("shows the picked single file inside the zone with its size", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FileUpload label="Attachment" onChange={onChange} />);
    await user.upload(screen.getByLabelText("Attachment"), makeFile("invoice.pdf", { size: 2048 }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]![0]).toHaveLength(1);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    const filled = filledZone();
    expect(within(filled).getByText("invoice.pdf")).toBeInTheDocument();
    expect(within(filled).getByText(/2 KB/)).toBeInTheDocument();
  });

  it("clicking the filled zone re-opens the picker to replace the file", async () => {
    const user = userEvent.setup();
    render(<FileUpload label="A" />);
    await user.upload(screen.getByLabelText("A"), makeFile("one.txt"));
    await user.upload(screen.getByLabelText("A"), makeFile("two.txt"));
    expect(screen.getByText("two.txt")).toBeInTheDocument();
    expect(screen.queryByText("one.txt")).not.toBeInTheDocument();

    const clickSpy = vi.spyOn(screen.getByLabelText("A") as HTMLInputElement, "click");
    await user.click(filledZone());
    expect(clickSpy).toHaveBeenCalled();
  });

  it("renders view + delete actions; view calls onView, delete drops the file", async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    const onChange = vi.fn();
    render(<FileUpload label="A" onView={onView} onChange={onChange} />);
    const file = makeFile("photo.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("A"), file);

    await user.click(screen.getByRole("button", { name: "View photo.png" }));
    expect(onView).toHaveBeenCalledWith(file, expect.any(String));

    await user.click(screen.getByRole("button", { name: "Delete photo.png" }));
    expect(screen.queryByText("photo.png")).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("lets renderActions replace the default buttons", async () => {
    const user = userEvent.setup();
    render(
      <FileUpload
        label="A"
        renderActions={({ file, remove }) => (
          <button type="button" onClick={remove}>
            Drop {file.name}
          </button>
        )}
      />,
    );
    await user.upload(screen.getByLabelText("A"), makeFile("a.txt"));
    expect(screen.queryByRole("button", { name: /Delete/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Drop a.txt" }));
    expect(screen.queryByText("a.txt")).not.toBeInTheDocument();
  });

  it("appends fresh files when multiple and ignores duplicates", async () => {
    const user = userEvent.setup();
    render(<FileUpload label="A" multiple />);
    await user.upload(screen.getByLabelText("A"), makeFile("three.txt"));
    await user.upload(screen.getByLabelText("A"), makeFile("four.txt"));
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    await user.upload(screen.getByLabelText("A"), makeFile("four.txt"));
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("removes a file from the multi list", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FileUpload label="A" multiple onChange={onChange} />);
    await user.upload(screen.getByLabelText("A"), makeFile("doc.txt"));
    await user.click(screen.getByRole("button", { name: "Delete doc.txt" }));
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("rejects files over maxSize and shows the reason", async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();
    render(<FileUpload label="A" maxSize={10} onReject={onReject} />);
    await user.upload(screen.getByLabelText("A"), makeFile("huge.txt", { size: 50 }));

    expect(screen.queryByRole("button", { name: "Replace file" })).not.toBeInTheDocument();
    expect(onReject).toHaveBeenCalledWith([expect.objectContaining({ reason: "size" })]);
    expect(screen.getByText(/larger than/i)).toBeInTheDocument();
    expect(zone()).toHaveAttribute("aria-invalid", "true");
  });

  it("enforces accept on drag-and-drop and toggles the drag state", async () => {
    const onReject = vi.fn();
    render(<FileUpload label="A" accept="image/*" onReject={onReject} />);
    const target = zone();

    fireEvent.dragEnter(target, { dataTransfer: { files: [], types: ["Files"] } });
    expect(target).toHaveAttribute("data-drag-active", "true");
    fireEvent.dragLeave(target, { dataTransfer: { files: [], types: ["Files"] } });
    expect(target).not.toHaveAttribute("data-drag-active");

    fireEvent.drop(target, { dataTransfer: { files: [makeFile("note.txt")], types: ["Files"] } });
    expect(onReject).toHaveBeenCalledWith([expect.objectContaining({ reason: "type" })]);
    expect(screen.queryByRole("button", { name: "Replace file" })).not.toBeInTheDocument();

    fireEvent.drop(target, {
      dataTransfer: { files: [makeFile("pic.png", { type: "image/png" })], types: ["Files"] },
    });
    expect(within(filledZone()).getByText("pic.png")).toBeInTheDocument();
  });

  it("caps the count with maxFiles", async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();
    render(<FileUpload label="A" multiple maxFiles={2} onReject={onReject} />);
    await user.upload(screen.getByLabelText("A"), [
      makeFile("a.txt"),
      makeFile("b.txt"),
      makeFile("c.txt"),
    ]);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(onReject).toHaveBeenCalledWith([expect.objectContaining({ reason: "count" })]);
  });

  it("applies size and variant classes to the zone", () => {
    const { rerender } = render(<FileUpload label="A" size="lg" variant="filled" />);
    expect(zone()).toHaveClass("py-8", "bg-mint");
    rerender(<FileUpload label="A" size="sm" />);
    expect(zone()).toHaveClass("py-4");
  });

  it("is inert when disabled", () => {
    render(<FileUpload label="A" disabled defaultValue={[makeFile("x.txt")]} />);
    expect(screen.getByLabelText("A")).toBeDisabled();
    const filled = filledZone();
    expect(filled).toHaveAttribute("aria-disabled", "true");
    expect(filled).toHaveAttribute("tabindex", "-1");
    expect(screen.queryByRole("button", { name: /Delete/ })).not.toBeInTheDocument();
  });

  it("supports a controlled value", async () => {
    const user = userEvent.setup();
    function Host() {
      const [files, setFiles] = useState<File[]>([]);
      return (
        <>
          <FileUpload label="A" multiple value={files} onChange={setFiles} />
          <span data-testid="count">{files.length}</span>
        </>
      );
    }
    render(<Host />);
    await user.upload(screen.getByLabelText("A"), makeFile("one.txt"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByRole("listitem")).toHaveTextContent("one.txt");
  });

  it("dropdown variant renders picked files as a scrollable chip row (no list)", async () => {
    const user = userEvent.setup();
    render(<FileUpload label="A" variant="dropdown" multiple placeholder="Add files" />);
    await user.upload(screen.getByLabelText("A"), [makeFile("a.txt"), makeFile("b.txt")]);

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    const row = screen.getByText("a.txt").closest("div");
    expect(row).toHaveClass("overflow-x-auto", "flex-nowrap");
    expect(screen.getByText("b.txt")).toBeInTheDocument();
  });

  it("dropdown variant: chip ✕ removes one, clear-all empties, the field re-opens the picker", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FileUpload
        label="A"
        variant="dropdown"
        multiple
        placeholder="Add files"
        onChange={onChange}
      />,
    );
    await user.upload(screen.getByLabelText("A"), [makeFile("a.txt"), makeFile("b.txt")]);

    await user.click(screen.getByRole("button", { name: "Remove a.txt" }));
    expect(screen.queryByText("a.txt")).not.toBeInTheDocument();
    expect(screen.getByText("b.txt")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear all files" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(screen.getByText("Add files")).toBeInTheDocument();

    const clickSpy = vi.spyOn(screen.getByLabelText("A") as HTMLInputElement, "click");
    await user.click(screen.getByRole("button", { name: "Add files" }));
    expect(clickSpy).toHaveBeenCalled();
  });

  it("dropdown chip has view + remove; default view opens the preview Dialog", async () => {
    const user = userEvent.setup();
    render(<FileUpload label="A" variant="dropdown" multiple placeholder="Add files" />);
    await user.upload(screen.getByLabelText("A"), makeFile("photo.png", { type: "image/png" }));

    expect(screen.getByRole("button", { name: "Remove photo.png" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "View photo.png" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("photo.png")).toBeInTheDocument();
  });

  it("showDelete={false} hides the delete / remove action", async () => {
    const user = userEvent.setup();
    render(
      <FileUpload
        label="A"
        variant="dropdown"
        multiple
        placeholder="Add files"
        showDelete={false}
      />,
    );
    await user.upload(screen.getByLabelText("A"), makeFile("a.txt"));
    expect(screen.queryByRole("button", { name: "Remove a.txt" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View a.txt" })).toBeInTheDocument();
  });

  it("onView overrides the built-in preview Dialog", async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    render(
      <FileUpload label="A" variant="dropdown" multiple placeholder="Add files" onView={onView} />,
    );
    await user.upload(screen.getByLabelText("A"), makeFile("a.txt"));
    await user.click(screen.getByRole("button", { name: "View a.txt" }));
    expect(onView).toHaveBeenCalledWith(expect.any(File), expect.any(String));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
