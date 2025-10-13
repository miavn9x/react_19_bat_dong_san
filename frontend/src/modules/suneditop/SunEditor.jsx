// frontend/src/modules/suneditop/SunEditor.jsx
import { useMemo, useState } from "react";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css"; // CSS bắt buộc

// Nhóm lớp cho Paragraph Styles (độc quyền, chỉ giữ 1 trong 3)
const PARA_STYLE_CLASSES = ["__se__p-spaced", "__se__p-bordered", "__se__p-neon"];

// Chuẩn hoá nội dung: đảm bảo 1 đoạn chỉ có 1 paragraph-style class
function normalizeParagraphStyles(html) {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const selector = PARA_STYLE_CLASSES.map((c) => `.${c}`).join(",");
    doc.querySelectorAll(selector).forEach((el) => {
      const current = PARA_STYLE_CLASSES.filter((c) => el.classList.contains(c));
      if (current.length > 1) {
        const keep = current[current.length - 1];
        PARA_STYLE_CLASSES.forEach((c) => {
          if (c !== keep) el.classList.remove(c);
        });
      }
    });
    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

export default function SunEditorComponent() {
  const [content, setContent] = useState("");

  // Luôn normalize để mỗi đoạn chỉ giữ 1 paragraph-style class
  const handleChange = (val) => {
    const raw = val || "";
    const cleaned = normalizeParagraphStyles(raw);
    if (cleaned !== content) setContent(cleaned);
  };

  const responsiveHtml = useMemo(() => {
    if (typeof window === "undefined" || !content) return content;
    try {
      const doc = new DOMParser().parseFromString(content, "text/html");

      const sanitizeStyles = (styleStr = "") =>
        styleStr
          .replace(/min-width\s*:\s*[^;]+;?/gi, "")
          .replace(/height\s*:\s*[^;]+;?/gi, "")
          .replace(/padding\s*:\s*[^;]+;?/gi, "")
          .replace(/padding-(top|bottom|left|right)\s*:\s*[^;]+;?/gi, "")
          .replace(/;;+/g, ";")
          .trim();

      const pickPercent = (el, fallback = "100%") => {
        const container =
          el.closest(".se-video-container, .se-image-container") || null;
        const figure = container ? container.querySelector("figure") : null;

        const dp = el.getAttribute("data-percentage") || "";
        const parts = dp.split(",").map((s) => (s ? s.trim() : ""));
        const dpW = parts[0];
        const fromDP = dpW ? (/%$/.test(dpW) ? dpW : `${dpW}%`) : "";

        const contW =
          ((container && container.getAttribute("style")) || "").match(
            /width\s*:\s*([\d.]+%)/i
          )?.[1] || "";

        const attrW = el.getAttribute("width");
        const fromAttr = attrW && /%$/.test(attrW) ? attrW : "";

        const figW =
          ((figure && figure.getAttribute("style")) || "").match(
            /width\s*:\s*([\d.]+%)/i
          )?.[1] || "";

        return fromDP || contW || fromAttr || figW || fallback;
      };

      const pickHeightPercent = (el, fallback = "56.25%") => {
        const dp = el.getAttribute("data-percentage") || "";
        const parts = dp.split(",").map((s) => (s ? s.trim() : ""));
        if (parts[1]) return /%$/.test(parts[1]) ? parts[1] : `${parts[1]}%`;
        return fallback;
      };

      const shapeFigure = (container, align, percent, padPercent) => {
        const fig = container.querySelector("figure");
        if (!fig) return;

        const fOld = sanitizeStyles(fig.getAttribute("style") || "");
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
          figBase.push("margin-left:0", "margin-right:auto");
        }

        fig.setAttribute(
          "style",
          fOld ? `${fOld};${figBase.join(";")}` : figBase.join(";")
        );
      };

      const applyContainerAlign = (el) => {
        const container =
          el.closest(".se-video-container") ||
          el.closest(".se-image-container") ||
          el.parentElement;
        if (!container) return;

        let align = (el.getAttribute("data-align") || "").toLowerCase();
        if (!align) {
          const cls = container.className || "";
          if (cls.includes("__se__float-right")) align = "right";
          else if (cls.includes("__se__float-left")) align = "left";
          else if (cls.includes("__se__float-center")) align = "center";
        }
        if (!align) align = "left";

        const percent = pickPercent(el, "100%");
        const padPercent = pickHeightPercent(el, "56.25%");

        const cOld = sanitizeStyles(container.getAttribute("style") || "");
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

        shapeFigure(container, align, percent, padPercent);
      };

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

      // Gỡ <br> thừa ở đầu/cuối heading
      doc.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((h) => {
        while (h.firstChild && h.firstChild.nodeName === "BR")
          h.removeChild(h.firstChild);
        while (h.lastChild && h.lastChild.nodeName === "BR")
          h.removeChild(h.lastChild);
      });

      // Độc quyền paragraph styles khi render (phòng content từ nguồn khác)
      const selector = PARA_STYLE_CLASSES.map((c) => `.${c}`).join(",");
      doc.querySelectorAll(selector).forEach((el) => {
        const current = PARA_STYLE_CLASSES.filter((c) =>
          el.classList.contains(c)
        );
        if (current.length > 1) {
          const keep = current[current.length - 1];
          PARA_STYLE_CLASSES.forEach((c) => {
            if (c !== keep) el.classList.remove(c);
          });
        }
      });

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
          stickyToolbar: 0,
          resizingBar: true,
          showPathLabel: true,
          charCounter: true,
          maxCharCount: 50000,
          defaultTag: "p",
          placeholder: "Nhập nội dung...",
          defaultStyle: `
            font-family: Inter, system-ui, Arial, sans-serif;
            line-height: 1.8;
          `,
          paragraphStyles: [
            { name: "Spaced", class: "__se__p-spaced" },
            { name: "Bordered", class: "__se__p-bordered" },
            { name: "Neon", class: "__se__p-neon" },
          ],

          // ====== BỔ SUNG CHO RADIO (AUDIO URL) ======
          linkNoPrefix: true,
          linkProtocol: "https://",
          audioUrlInput: true,
          audioTagAttrs: {
            controls: true,
            preload: "none",
          },

          // Chỉ dùng 2 tham số để tránh no-unused-vars
          onAudioUpload: (target, state) => {
            if (state === "create" && target?.tagName === "AUDIO") {
              if (!target.hasAttribute("controls")) target.setAttribute("controls", "");
              if (!target.hasAttribute("preload"))  target.setAttribute("preload", "none");
            }
          },

          onAudioUploadError: (msg) => {
            alert(`Audio error: ${msg}`);
            return false;
          },

          // Auto-embed SoundCloud, Zing link thì chèn <a>
          onPaste: (e, _cleanData, _maxChar, core) => {
            try {
              const text = (e.clipboardData && e.clipboardData.getData("text")) || "";
              if (/^https?:\/\/(www\.)?soundcloud\.com\/.+/i.test(text)) {
                e.preventDefault();
                const iframe = `
                  <div class="se-audio-embed">
                    <iframe
                      width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay"
                      src="https://w.soundcloud.com/player/?url=${encodeURIComponent(text)}&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=false">
                    </iframe>
                  </div>`;
                core.insertHTML(iframe, true, true);
                return false;
              }
              if (/^https?:\/\/(www\.)?zingmp3\.vn\/bai-hat\/.+/i.test(text)) {
                e.preventDefault();
                const a = `<p><a href="${text}" rel="noopener noreferrer" target="_blank">${text}</a></p>`;
                core.insertHTML(a, true, true);
                return false;
              }
            } catch {
              /* ignore paste errors */
            }
            return true;
          },
          // ====== HẾT PHẦN BỔ SUNG ======

          imageResizing: true,
          imageRotation: true,
          imageFileInput: true,
          imageMultipleFile: false,
          imageAccept: ".jpg,.jpeg,.png,.gif,.webp",
          videoFileInput: true,
          videoAccept: ".mp4,.webm,.ogg",
          audioFileInput: true,
          audioAccept: ".mp3,.wav,.ogg",
          linkRelDefault: {
            default: "nofollow noopener noreferrer",
            check_new_window: "only:noreferrer noopener",
          },
          linkTargetNewWindow: true,
          buttonList: [
            ["undo","redo","removeFormat","preview","print","fullScreen","showBlocks","codeView"],
            ["formatBlock","paragraphStyle","blockquote","font","fontSize","align","lineHeight"],
            ["bold","underline","italic","strike","subscript","superscript","fontColor","hiliteColor","textStyle"],
            ["outdent","indent","list","horizontalRule","table","link","image","video","audio"],
          ],
        }}
      />

      <h2 className="mt-4">Kết quả:</h2>
      <div
        className="sun-editor-editable se-preview border border-gray-300 "
        dangerouslySetInnerHTML={{ __html: responsiveHtml }}
      />
    </main>
  );
}
