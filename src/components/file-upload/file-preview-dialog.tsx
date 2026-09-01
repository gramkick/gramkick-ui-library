import type { ReactNode } from "react";
import { Dialog } from "../dialog/dialog";

export interface FilePreviewDialogProps {
  file: File | null;
  /** Object URL for the file. */
  url: string;
  /** Small line under the title (usually the formatted size). */
  subtext?: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Default target for the "view" action — previews the file in the library `Dialog`. */
export function FilePreviewDialog({
  file,
  url,
  subtext,
  open,
  onOpenChange,
}: FilePreviewDialogProps) {
  if (!file) return null;

  const type = file.type;
  let body: ReactNode;

  if (url && type.startsWith("image/")) {
    body = (
      <img
        src={url}
        alt={file.name}
        className="mx-auto max-h-[70vh] w-auto max-w-full rounded-gk-sm object-contain"
      />
    );
  } else if (url && type === "application/pdf") {
    body = (
      <iframe
        src={url}
        title={file.name}
        className="h-[70vh] w-full rounded-gk-sm border border-line"
      />
    );
  } else if (url && type.startsWith("video/")) {
    body = (
      <video src={url} controls className="mx-auto max-h-[70vh] w-full rounded-gk-sm bg-ink" />
    );
  } else if (url && type.startsWith("audio/")) {
    body = <audio src={url} controls className="w-full" />;
  } else {
    body = (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm text-muted">No inline preview for this file type.</p>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-leaf hover:underline"
          >
            Open in a new tab
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={file.name} subtext={subtext} size="lg">
      {body}
    </Dialog>
  );
}
