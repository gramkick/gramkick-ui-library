import { cn } from "../../lib/cn";

/**
 * The red " *" after a required field's label — the same mark every field component (`Input`, `Dropdown`,
 * `Autosuggest`, `FileUpload`, the date / time pickers) draws when given `required` or `isRequired`. Exported for a
 * custom label composition, e.g. a label followed by an info icon, where the mark has to sit before the icon.
 */
export function RequiredMark({ className }: { className?: string }) {
  return <span className={cn("text-danger", className)}> *</span>;
}
