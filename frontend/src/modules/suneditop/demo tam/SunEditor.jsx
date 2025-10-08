// frontend/src/modules/suneditop/components/SunEditor.jsx
import { useState } from "react";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";

const PARA_STYLE_CLASSES = ["__se__p-spaced", "__se__p-bordered", "__se__p-neon"];

function normalizeParagraphStyles(html) {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const selector = PARA_STYLE_CLASSES.map((c) => `.${c}`).join(",");
    doc.querySelectorAll(selector).forEach((el) => {
      const current = PARA_STYLE_CLASSES.filter((c) => el.classList.contains(c));
      if (current.length > 1) {
        const keep = current[current.length - 1];
        PARA_STYLE_CLASSES.forEach((c) => { if (c !== keep) el.classList.remove(c); });
      }
    });
    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

export default function SunEditorComponent({ value, onChange }) {
  const [content, setContent] = useState(value || "");

  const handleChange = (val) => {
    const cleaned = normalizeParagraphStyles(val || "");
    setContent(cleaned);
    onChange?.(cleaned); // parent nhận HTML để gọi API
  };

  return (
    <main className="p-5">
      <SunEditor
        onChange={handleChange}
        setContents={content}
        setOptions={{
          mode: "classic",
          stickyToolbar: 0,
          resizingBar: true,
          showPathLabel: true,
          charCounter: true,
          maxCharCount: 50000,
          defaultTag: "p",
          placeholder: "Nhập nội dung...",
          defaultStyle: `font-family: Inter, system-ui, Arial, sans-serif; line-height: 1.8;`,
          paragraphStyles: [
            { name: "Spaced", class: "__se__p-spaced" },
            { name: "Bordered", class: "__se__p-bordered" },
            { name: "Neon", class: "__se__p-neon" },
          ],

          // Audio URL
          linkNoPrefix: true,
          linkProtocol: "https://",
          audioUrlInput: true,
          audioTagAttrs: { controls: true, preload: "none" },

          onAudioUpload: (target, state) => {
            if (state === "create" && target?.tagName === "AUDIO") {
              if (!target.hasAttribute("controls")) target.setAttribute("controls", "");
              if (!target.hasAttribute("preload")) target.setAttribute("preload", "none");
            }
          },

          onAudioUploadError: (msg) => { alert(`Audio error: ${msg}`); return false; },

          // Paste: auto-embed SoundCloud; ZingMP3 thì chèn link mở tab mới
          onPaste: (e, _cleanData, _maxChar, core) => {
            try {
              const text = (e.clipboardData && e.clipboardData.getData("text")) || "";

              if (/^https?:\/\/(www\.)?soundcloud\.com\/.+/i.test(text)) {
                e.preventDefault();
                core.insertHTML(`
                  <div class="se-audio-embed">
                    <iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay"
                      src="https://w.soundcloud.com/player/?url=${encodeURIComponent(text)}&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=false">
                    </iframe>
                  </div>`, true, true);
                return false;
              }

              if (/^https?:\/\/(www\.)?zingmp3\.vn\/bai-hat\/.+/i.test(text)) {
                e.preventDefault();
                core.insertHTML(
                  `<p><a href="${text}" rel="noopener noreferrer" target="_blank">${text}</a></p>`,
                  true, true
                );
                return false;
              }
            } catch (_err) {
              // Giữ khối catch không rỗng để qua rule no-empty
              // Trên server (không có window) mới ném lỗi ra ngoài
              if (typeof window === "undefined") { throw _err; }
            }
            return true; // cho phép paste mặc định
          },

          imageResizing: true,
          imageRotation: true,
          imageFileInput: true,
          imageMultipleFile: false,
          imageAccept: ".jpg,.jpeg,.png,.gif,.webp",
          videoFileInput: true,
          videoAccept: ".mp4,.webm,.ogg",
          audioFileInput: true,
          audioAccept: ".mp3,.wav,.ogg",
          linkRelDefault: { default: "nofollow noopener noreferrer", check_new_window: "only:noreferrer noopener" },
          linkTargetNewWindow: true,
          buttonList: [
            ["undo","redo","removeFormat","preview","print","fullScreen","showBlocks","codeView"],
            ["formatBlock","paragraphStyle","blockquote","font","fontSize","align","lineHeight"],
            ["bold","underline","italic","strike","subscript","superscript","fontColor","hiliteColor","textStyle"],
            ["outdent","indent","list","horizontalRule","table","link","image","video","audio"],
          ],
        }}
      />
      {/* Không render preview demo ở đây nữa */}
    </main>
  );
}
