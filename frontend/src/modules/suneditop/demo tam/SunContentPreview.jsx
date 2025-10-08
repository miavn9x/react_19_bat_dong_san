import { useMemo } from "react";
import { transformHtmlForPreview } from "./transformHtmlForPreview";

export default function SunContentPreview({ html, className = "" }) {
  const safeHtml = useMemo(() => transformHtmlForPreview(html), [html]);

  return (
    <>
      <style>{`
        .sun-editor-editable p { margin: 0 0 1em; }
        .sun-editor-editable img { max-width: 100%; border-radius: 12px; }
        .sun-editor-editable pre,
        .sun-editor-editable code {
          background: #0f172a; color: #e2e8f0; border-radius: 8px; padding: 12px; display: block; overflow: auto;
        }
        .sun-editor-editable blockquote { border-left: 4px solid #a78bfa; padding-left: 12px; color: #334155; }
        .sun-editor-editable table { width: 100%; border-collapse: collapse; }
        .sun-editor-editable td, .sun-editor-editable th { border: 1px solid #e5e7eb; padding: 8px; }
        .se-preview .se-video-container figure,
        .se-preview .se-image-container figure { margin-bottom: 1em; }
        .se-preview iframe, .se-preview video { max-width: 100%; border: 0; }
      `}</style>

      <div
        className={`sun-editor-editable se-preview ${className}`}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </>
  );
}
