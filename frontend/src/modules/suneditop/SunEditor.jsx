import { useMemo, useState } from "react";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css"; // CSS bắt buộc

export default function SunEditorComponent() {
  const [content, setContent] = useState("");

  const handleChange = (val) => setContent(val || "");

  const responsiveHtml = useMemo(() => {
    if (typeof window === "undefined" || !content) return content;
    try {
      const doc = new DOMParser().parseFromString(content, "text/html");

      // Xoá/ghi đè min-width, height, padding trong chuỗi style (mở rộng sanitize để tránh conflict với padding hack)
      const sanitizeStyles = (styleStr = "") =>
        styleStr
          .replace(/min-width\s*:\s*[^;]+;?/gi, "")
          .replace(/height\s*:\s*[^;]+;?/gi, "")
          .replace(/padding\s*:\s*[^;]+;?/gi, "")
          .replace(/padding-(top|bottom|left|right)\s*:\s*[^;]+;?/gi, "")
          .replace(/;;+/g, ";")
          .trim();

      // Lấy width% từ data-percentage / container / width attr / figure (thay đổi thứ tự ưu tiên: prefer data-percentage và container trước figure)
      const pickPercent = (el, fallback = "100%") => {
        const container =
          el.closest(".se-video-container, .se-image-container") || null;
        const figure = container?.querySelector("figure") || null;

        const dp = el.getAttribute("data-percentage") || "";
        const [dpW] = dp.split(",").map((s) => s?.trim());
        const fromDP = dpW ? (dpW.endsWith("%") ? dpW : `${dpW}%`) : "";

        const contW =
          (container?.getAttribute("style") || "").match(
            /width\s*:\s*([\d.]+%)/i
          )?.[1] || "";

        const attrW = el.getAttribute("width");
        const fromAttr = attrW && /%$/.test(attrW) ? attrW : "";

        const figW =
          (figure?.getAttribute("style") || "").match(
            /width\s*:\s*([\d.]+%)/i
          )?.[1] || "";

        return fromDP || (contW ? `${contW}%` : "") || fromAttr || (figW ? `${figW}%` : "") || fallback;
      };

      // Lấy height% từ data-percentage nếu có, fallback 56.25 (16/9)
      const pickHeightPercent = (el, fallback = "56.25%") => {
        const dp = el.getAttribute("data-percentage") || "";
        const parts = dp.split(",").map((s) => s?.trim());
        if (parts[1]) return parts[1].endsWith("%") ? parts[1] : `${parts[1]}%`;
        return fallback;
      };

      // Set width + margin cho figure theo align, sử dụng padding hack đầy đủ (height:0, position:relative, etc.)
      const shapeFigure = (container, align, percent, padPercent) => {
        const fig = container.querySelector("figure");
        if (!fig) return;

        let fOld = sanitizeStyles(fig.getAttribute("style") || "");
        const figBase = [
          "display:block",
          "position:relative",
          "overflow:hidden",
          "height:0",
          `padding-bottom:${padPercent}`,
          `width:${percent}`,
        ];

        if (align === "right") {
          figBase.push("margin-left:auto", "margin-right:0");
        } else if (align === "center") {
          figBase.push("margin-left:auto", "margin-right:auto");
        } else {
          // left/mặc định
          figBase.push("margin-left:0", "margin-right:auto");
        }

        fig.setAttribute(
          "style",
          fOld ? `${fOld};${figBase.join(";")}` : figBase.join(";")
        );
      };

      // Áp align + width cho container và figure; gỡ min-width 100%
      const applyContainerAlign = (el) => {
        const container =
          el.closest(".se-video-container") ||
          el.closest(".se-image-container") ||
          el.parentElement;
        if (!container) return;

        // Ưu tiên data-align trên media; fallback theo class container
        let align = (el.getAttribute("data-align") || "").toLowerCase();
        if (!align) {
          const cls = container.className || "";
          if (cls.includes("__se__float-right")) align = "right";
          else if (cls.includes("__se__float-left")) align = "left";
          else if (cls.includes("__se__float-center")) align = "center";
        }

        const percent = pickPercent(el, "100%");
        const padPercent = pickHeightPercent(el, "56.25%");

        // Container
        let cOld = sanitizeStyles(container.getAttribute("style") || "");
        const contBase = [
          "display:block",
          "float:none",
          "box-sizing:border-box",
          `width:${percent}`,
          "min-width:0",
        ];
        if (align === "right") {
          contBase.push("margin-left:auto", "margin-right:0");
        } else if (align === "center") {
          contBase.push("margin-left:auto", "margin-right:auto");
        } else {
          contBase.push("margin-left:0", "margin-right:auto");
        }
        container.setAttribute(
          "style",
          cOld ? `${cOld};${contBase.join(";")}` : contBase.join(";")
        );

        // Figure (luôn đồng bộ)
        shapeFigure(container, align, percent, padPercent);
      };

      // Media luôn fill figure với position:absolute cho padding hack
      const makeResponsive = (el) => {
        el.removeAttribute("width");
        el.removeAttribute("height");
        const mediaStyle = [
          "position:absolute",
          "top:0",
          "left:0",
          "width:100%",
          "height:100%",
          "border:0",
        ];
        const old = el.getAttribute("style") || "";
        el.setAttribute(
          "style",
          old ? `${old};${mediaStyle.join(";")}` : mediaStyle.join(";")
        );
      };

      // IFRAME
      doc.querySelectorAll("iframe").forEach((el) => {
        if (!el.hasAttribute("allowfullscreen"))
          el.setAttribute("allowfullscreen", "");
        makeResponsive(el);
        applyContainerAlign(el);
      });

      // VIDEO
      doc.querySelectorAll("video").forEach((el) => {
        el.setAttribute("controls", "");
        makeResponsive(el);
        applyContainerAlign(el);
      });

      return doc.body.innerHTML;
    } catch {
      return content;
    }
  }, [content]);

  return (
    <main className="p-5">
      <SunEditor
        onChange={handleChange}
        setOptions={{
          mode: "classic",
          toolbarSticky: true,
          resizingBar: true,
          showPathLabel: true,
          charCounter: true,
          maxCharCount: 50000,
          defaultTag: "p",
          placeholder: "Nhập nội dung...",
          defaultStyle: `
            body{ font-family: Inter, system-ui, Arial, sans-serif; }
            p{ line-height:1.8; margin:0 0 1em; }
            img{ max-width:100%; border-radius:12px; }
            pre, code{ background:#0f172a; color:#e2e8f0; border-radius:8px; padding:12px; display:block; overflow:auto; }
            blockquote{ border-left:4px solid #a78bfa; padding-left:12px; color:#334155; }
            table{ width:100%; border-collapse:collapse; }
            table td, table th{ border:1px solid #e5e7eb; padding:8px; }
          `,
          imageResizing: true,
          imageRotation: true,
          imageFileInput: true,
          imageMultipleFile: false,
          imageAccept: ".jpg,.jpeg,.png,.gif,.webp",
          videoFileInput: true,
          videoAccept: ".mp4,.webm,.ogg",
          audioFileInput: true,
          audioAccept: ".mp3,.wav,.ogg",
          linkRelDefault: { default: "noopener noreferrer" },
          linkTargetNewWindow: true,
          buttonList: [
            [
              "undo",
              "redo",
              "removeFormat",
              "preview",
              "print",
              "fullScreen",
              "showBlocks",
              "codeView",
            ],
            [
              "formatBlock",
              "paragraphStyle",
              "blockquote",
              "font",
              "fontSize",
              "align",
              "lineHeight",
            ],
            [
              "bold",
              "underline",
              "italic",
              "strike",
              "subscript",
              "superscript",
              "fontColor",
              "hiliteColor",
              "textStyle",
            ],
            [
              "outdent",
              "indent",
              "list",
              "horizontalRule",
              "table",
              "link",
              "image",
              "video",
              "audio",
            ],
          ],
        }}
      />

      {/* Preview CSS: KHÔNG ép width:100% để giữ center/left/right; thêm override để tránh conflict với position:absolute */}
      <style>{`
        .se-preview iframe,
        .se-preview video {
          max-width: 100%;
          height: auto;
          border: 0;
        }
        .se-preview .se-video-container figure,
        .se-preview .se-image-container figure {
          margin-bottom: 1em; /* Thêm spacing nếu cần */
        }
      `}</style>

      <h2 className="mt-4">Kết quả:</h2>
      <div
        className="se-preview border border-gray-300 rounded p-3 mt-2 min-h-[120px]"
        dangerouslySetInnerHTML={{ __html: responsiveHtml }}
      />
    </main>
  );
}