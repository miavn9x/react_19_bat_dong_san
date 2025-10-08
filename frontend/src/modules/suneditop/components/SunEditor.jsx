// frontend/src/modules/suneditop/components/SunEditor.jsx
// component SunEditor với một số tuỳ chỉnh
// tham khảo: https://www.npmjs.com/package/suneditor-react

import { useState } from "react";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css"; // CSS bắt buộc

// Chỉ dùng nội bộ file (không export) để không phạm rule Fast Refresh
const PARA_STYLE_CLASSES = ["__se__p-spaced", "__se__p-bordered", "__se__p-neon"];

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

// ✅ File này CHỈ export 1 React component
export default function SunEditorComponent() {
  const [content, setContent] = useState("");

  const handleChange = (val) => {
    const raw = val || "";
    const cleaned = normalizeParagraphStyles(raw);
    if (cleaned !== content) setContent(cleaned);
  };

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
          audioTagAttrs: { controls: true, preload: "none" },

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

          // Auto-embed SoundCloud; ZingMP3 thì chèn <a> mở tab mới
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

      {/* KHÔNG render preview ở đây nữa.
          Cần demo tạm thời thì mở comment:
          <h2 className="mt-4">Kết quả:</h2>
          <SunContentPreview html={content} className="border border-gray-300 rounded p-3 mt-2" />
      */}
    </main>
  );
}
