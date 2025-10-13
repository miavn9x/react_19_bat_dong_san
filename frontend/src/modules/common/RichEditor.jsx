// // // frontend/src/modules/common/RichEditor.jsx
// // import SunEditor from "suneditor-react";
// // import "suneditor/dist/css/suneditor.min.css"; // CSS bắt buộc
// // import { useMemo } from "react";

// // const PARA_STYLE_CLASSES = ["__se__p-spaced", "__se__p-bordered", "__se__p-neon"];

// // function normalizeParagraphStyles(html) {
// //   try {
// //     const doc = new DOMParser().parseFromString(html, "text/html");
// //     const selector = PARA_STYLE_CLASSES.map((c) => `.${c}`).join(",");
// //     doc.querySelectorAll(selector).forEach((el) => {
// //       const current = PARA_STYLE_CLASSES.filter((c) => el.classList.contains(c));
// //       if (current.length > 1) {
// //         const keep = current[current.length - 1];
// //         PARA_STYLE_CLASSES.forEach((c) => { if (c !== keep) el.classList.remove(c); });
// //       }
// //     });
// //     return doc.body.innerHTML;
// //   } catch {
// //     return html;
// //   }
// // }

// // export default function RichEditor({
// //   value = "",
// //   onChange,
// //   placeholder = "Nhập nội dung...",
// //   maxCharCount = 50000,
// // }) {
// //   const options = useMemo(() => ({
// //     mode: "classic",
// //     stickyToolbar: 0,
// //     resizingBar: true,
// //     showPathLabel: true,
// //     charCounter: true,
// //     maxCharCount,
// //     defaultTag: "p",
// //     placeholder,
// //     defaultStyle: `
// //       font-family: Inter, system-ui, Arial, sans-serif;
// //       line-height: 1.8;
// //     `,
// //     paragraphStyles: [
// //       { name: "Spaced", class: "__se__p-spaced" },
// //       { name: "Bordered", class: "__se__p-bordered" },
// //       { name: "Neon", class: "__se__p-neon" },
// //     ],

// //     // ====== BỔ SUNG CHO RADIO (AUDIO URL) ======
// //     linkNoPrefix: true,
// //     linkProtocol: "https://",
// //     audioUrlInput: true,
// //     audioTagAttrs: {
// //       controls: true,
// //       preload: "none",
// //     },

// //     // Không để no-unused-vars: chỉ dùng target/state
// //     onAudioUpload: (target, state) => {
// //       if (state === "create" && target?.tagName === "AUDIO") {
// //         if (!target.hasAttribute("controls")) target.setAttribute("controls", "");
// //         if (!target.hasAttribute("preload"))  target.setAttribute("preload", "none");
// //       }
// //     },

// //     onAudioUploadError: (msg) => {
// //       alert(`Audio error: ${msg}`);
// //       return false;
// //     },

// //     // Auto-embed SoundCloud, Zing link thì chèn <a>
// //     onPaste: (e, _cleanData, _maxChar, core) => {
// //       try {
// //         const text = (e.clipboardData && e.clipboardData.getData("text")) || "";
// //         if (/^https?:\/\/(www\.)?soundcloud\.com\/.+/i.test(text)) {
// //           e.preventDefault();
// //           const iframe = `
// //             <div class="se-audio-embed">
// //               <iframe
// //                 width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay"
// //                 src="https://w.soundcloud.com/player/?url=${encodeURIComponent(text)}&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=false">
// //               </iframe>
// //             </div>`;
// //           core.insertHTML(iframe, true, true);
// //           return false;
// //         }
// //         if (/^https?:\/\/(www\.)?zingmp3\.vn\/bai-hat\/.+/i.test(text)) {
// //           e.preventDefault();
// //           const a = `<p><a href="${text}" rel="noopener noreferrer" target="_blank">${text}</a></p>`;
// //           core.insertHTML(a, true, true);
// //           return false;
// //         }
// //       } catch { /* ignore */ }
// //       return true;
// //     },
// //     // ====== HẾT PHẦN BỔ SUNG ======

// //     imageResizing: true,
// //     imageRotation: true,
// //     imageFileInput: true,
// //     imageMultipleFile: false,
// //     imageAccept: ".jpg,.jpeg,.png,.gif,.webp",
// //     videoFileInput: true,
// //     videoAccept: ".mp4,.webm,.ogg",
// //     audioFileInput: true,
// //     audioAccept: ".mp3,.wav,.ogg",
// //     linkRelDefault: {
// //       default: "nofollow noopener noreferrer",
// //       check_new_window: "only:noreferrer noopener",
// //     },
// //     linkTargetNewWindow: true,
// //     buttonList: [
// //       ["undo","redo","removeFormat","preview","print","fullScreen","showBlocks","codeView"],
// //       ["formatBlock","paragraphStyle","blockquote","font","fontSize","align","lineHeight"],
// //       ["bold","underline","italic","strike","subscript","superscript","fontColor","hiliteColor","textStyle"],
// //       ["outdent","indent","list","horizontalRule","table","link","image","video","audio"],
// //     ],
// //   }), [placeholder, maxCharCount]);

// //   return (
// //     <SunEditor
// //       setContents={value}
// //       onChange={(val) => onChange?.(normalizeParagraphStyles(val || ""))}
// //       setOptions={options}
// //     />
// //   );
// // }

// // frontend/src/modules/common/RichEditor.jsx
// import SunEditor from "suneditor-react";
// import "suneditor/dist/css/suneditor.min.css";
// import { useMemo, useRef } from "react";
// import { uploadMany, deleteFile, listFiles } from "../admin/upload/services/adminUploads.service";
// import { toFileURL } from "../admin/upload/config/api";

// const PARA_STYLE_CLASSES = ["__se__p-spaced", "__se__p-bordered", "__se__p-neon"];

// // ==================== URL HELPERS ====================
// function toAbsoluteIfUploads(url) {
//   if (!url) return url;
//   if (url.startsWith("/uploads/")) return toFileURL(url);
//   if (url.startsWith("uploads/")) return toFileURL("/" + url);
//   return url;
// }

// function toRelativeUploads(url) {
//   if (!url) return url;
//   if (/^(blob:|data:)/i.test(url)) return url;
//   const idx = url.indexOf("/uploads/");
//   if (idx >= 0) return url.slice(idx);
//   const idx2 = url.indexOf("uploads/");
//   if (idx2 >= 0) return `/${url.slice(idx2)}`;
//   return url;
// }

// // ==================== MEDIA TRACKING ====================
// // Extract tất cả media URLs từ HTML
// function extractMediaUrls(html) {
//   const urls = new Set();
//   try {
//     const doc = new DOMParser().parseFromString(html || "", "text/html");
    
//     // Images
//     doc.querySelectorAll("img").forEach((img) => {
//       const src = img.getAttribute("src");
//       if (src && src.includes("/uploads/")) urls.add(toRelativeUploads(src));
//     });
    
//     // Videos
//     doc.querySelectorAll("video, video source").forEach((el) => {
//       const src = el.getAttribute("src");
//       if (src && src.includes("/uploads/")) urls.add(toRelativeUploads(src));
//     });
    
//     // Audios
//     doc.querySelectorAll("audio, audio source").forEach((el) => {
//       const src = el.getAttribute("src");
//       if (src && src.includes("/uploads/")) urls.add(toRelativeUploads(src));
//     });
//   } catch (e) {
//     console.error("Error extracting media URLs:", e);
//   }
//   return Array.from(urls);
// }

// // Tìm media files đã bị xóa khỏi content
// function findDeletedMedia(oldHtml, newHtml) {
//   const oldUrls = new Set(extractMediaUrls(oldHtml));
//   const newUrls = new Set(extractMediaUrls(newHtml));
//   const deleted = [];
  
//   oldUrls.forEach((url) => {
//     if (!newUrls.has(url)) deleted.push(url);
//   });
  
//   return deleted;
// }

// // Query media file từ storage theo URL
// async function findMediaByUrl(url, group) {
//   try {
//     // Parse URL để lấy thông tin
//     const match = url.match(/\/uploads\/([^/]+)\/(\d{4})\/(\d{2})\/(\d{2})\/(.+)$/);
//     if (!match) return null;
    
//     const [, bucket, year, month, day] = match;
    
//     // Query với group và thông tin từ URL
//     const result = await listFiles({
//       bucket,
//       group,
//       year: parseInt(year),
//       month: parseInt(month),
//       day: parseInt(day),
//       limit: 100 // Tăng limit để tìm đúng file
//     });
    
//     // Tìm file khớp với URL
//     const file = result.items.find((item) => item.url === url || item.relPath === url.replace(/^\//, ""));
//     return file;
//   } catch (e) {
//     console.error("Error finding media by URL:", e);
//     return null;
//   }
// }

// // Xóa media files khỏi storage
// async function deleteMediaFiles(urls, group) {
//   const deleted = [];
//   const failed = [];
  
//   for (const url of urls) {
//     try {
//       const file = await findMediaByUrl(url, group);
//       if (file && file._id) {
//         await deleteFile({ id: file._id });
//         deleted.push(url);
//         console.log(`✓ Deleted media: ${url} (order: ${file.order})`);
//       } else {
//         console.warn(`✗ Media not found in storage: ${url}`);
//         failed.push(url);
//       }
//     } catch (e) {
//       console.error(`✗ Failed to delete ${url}:`, e);
//       failed.push(url);
//     }
//   }
  
//   return { deleted, failed };
// }

// // ==================== HTML PROCESSING ====================
// function normalizeParagraphStyles(html) {
//   try {
//     const doc = new DOMParser().parseFromString(html, "text/html");
//     const selector = PARA_STYLE_CLASSES.map((c) => `.${c}`).join(",");
//     doc.querySelectorAll(selector).forEach((el) => {
//       const current = PARA_STYLE_CLASSES.filter((c) => el.classList.contains(c));
//       if (current.length > 1) {
//         const keep = current[current.length - 1];
//         PARA_STYLE_CLASSES.forEach((c) => { if (c !== keep) el.classList.remove(c); });
//       }
//     });
//     return doc.body.innerHTML;
//   } catch {
//     return html;
//   }
// }

// function rewriteAttrs(doc, mapper) {
//   const apply = (el, attr) => {
//     const v = el.getAttribute(attr);
//     if (!v) return;
//     const nv = mapper(v);
//     if (nv && nv !== v) el.setAttribute(attr, nv);
//   };
//   doc.querySelectorAll("img").forEach((el) => apply(el, "src"));
//   doc.querySelectorAll("video").forEach((el) => {
//     apply(el, "src");
//     el.querySelectorAll("source").forEach((s) => apply(s, "src"));
//   });
//   doc.querySelectorAll("audio").forEach((el) => {
//     apply(el, "src");
//     el.querySelectorAll("source").forEach((s) => apply(s, "src"));
//   });
//   doc.querySelectorAll("source").forEach((el) => apply(el, "src"));
//   doc.querySelectorAll("a").forEach((el) => apply(el, "href"));
//   return doc;
// }

// function makeDisplayHtml(html) {
//   try {
//     const doc = new DOMParser().parseFromString(html || "", "text/html");
//     rewriteAttrs(doc, toAbsoluteIfUploads);
//     return doc.body.innerHTML;
//   } catch {
//     return html;
//   }
// }

// function makeStorageHtml(html) {
//   try {
//     const doc = new DOMParser().parseFromString(html || "", "text/html");
//     rewriteAttrs(doc, toRelativeUploads);
//     return normalizeParagraphStyles(doc.body.innerHTML);
//   } catch {
//     return normalizeParagraphStyles(html || "");
//   }
// }

// // ==================== UPLOAD HELPERS ====================
// // Lấy order cao nhất hiện tại trong group
// async function getMaxOrder(group, bucket) {
//   try {
//     const result = await listFiles({ group, bucket, limit: 1, sort: "-order" });
//     return result.items.length > 0 ? result.items[0].order : 0;
//   } catch (e) {
//     console.error("Error getting max order:", e);
//     return 0;
//   }
// }

// function toSunResults(items = []) {
//   return (items || []).map((it) => ({
//     url: toFileURL(it.url),
//     name: it.originalName || it.label || "file",
//     size: it.size || 0,
//   }));
// }

// // ==================== MAIN COMPONENT ====================
// export default function RichEditor({
//   value = "",
//   onChange,
//   placeholder = "Nhập nội dung...",
//   maxCharCount = 50000,
//   uploadGroup = "",
// }) {
//   const previousContentRef = useRef(value);

//   // ===== AUTO-DELETE LOGIC =====
//   const handleContentChange = async (newHtml) => {
//     const oldHtml = previousContentRef.current;
//     const deletedUrls = findDeletedMedia(oldHtml, newHtml);
    
//     if (deletedUrls.length > 0 && uploadGroup) {
//       console.log(`🗑️  Detected ${deletedUrls.length} deleted media:`, deletedUrls);
      
//       // Xóa async, không block UI
//       deleteMediaFiles(deletedUrls, uploadGroup).then(({ deleted, failed }) => {
//         if (deleted.length > 0) {
//           console.log(`✓ Successfully deleted ${deleted.length} files from storage`);
//         }
//         if (failed.length > 0) {
//           console.warn(`✗ Failed to delete ${failed.length} files:`, failed);
//         }
//       });
//     }
    
//     previousContentRef.current = newHtml;
//   };

//   // ===== CUSTOM UPLOAD WITH AUTO ORDER =====
//   const handleImageBefore = async (files, _info, uploadHandler) => {
//     try {
//       const maxOrder = await getMaxOrder(uploadGroup, "images");
//       const resp = await uploadMany({
//         bucket: "images",
//         files,
//         group: uploadGroup,
//         startOrder: maxOrder + 1, // Auto increment từ max + 1
//       });
//       uploadHandler({ result: toSunResults(resp?.items || resp || []) });
//     } catch (err) {
//       alert(`Upload ảnh thất bại: ${err?.message || "Unknown error"}`);
//     }
//     return false;
//   };

//   const handleVideoBefore = async (files, _info, uploadHandler) => {
//     try {
//       const maxOrder = await getMaxOrder(uploadGroup, "videos");
//       const resp = await uploadMany({
//         bucket: "videos",
//         files,
//         group: uploadGroup,
//         startOrder: maxOrder + 1,
//       });
//       uploadHandler({ result: toSunResults(resp?.items || resp || []) });
//     } catch (err) {
//       alert(`Upload video thất bại: ${err?.message || "Unknown error"}`);
//     }
//     return false;
//   };

//   const handleAudioBefore = async (files, _info, uploadHandler) => {
//     try {
//       const maxOrder = await getMaxOrder(uploadGroup, "audios");
//       const resp = await uploadMany({
//         bucket: "audios",
//         files,
//         group: uploadGroup,
//         startOrder: maxOrder + 1,
//       });
//       uploadHandler({ result: toSunResults(resp?.items || resp || []) });
//     } catch (err) {
//       alert(`Upload audio thất bại: ${err?.message || "Unknown error"}`);
//     }
//     return false;
//   };

//   // ===== EDITOR OPTIONS =====
//   const options = useMemo(() => ({
//     mode: "classic",
//     stickyToolbar: 0,
//     resizingBar: true,
//     showPathLabel: true,
//     charCounter: true,
//     maxCharCount,
//     defaultTag: "p",
//     placeholder,
//     defaultStyle: `
//       font-family: Inter, system-ui, Arial, sans-serif;
//       line-height: 1.8;
//     `,
//     paragraphStyles: [
//       { name: "Spaced", class: "__se__p-spaced" },
//       { name: "Bordered", class: "__se__p-bordered" },
//       { name: "Neon", class: "__se__p-neon" },
//     ],
//     linkNoPrefix: true,
//     linkProtocol: "https://",
//     audioUrlInput: true,
//     audioTagAttrs: { controls: true, preload: "none" },
//     onAudioUpload: (target, state) => {
//       if (state === "create" && target?.tagName === "AUDIO") {
//         if (!target.hasAttribute("controls")) target.setAttribute("controls", "");
//         if (!target.hasAttribute("preload")) target.setAttribute("preload", "none");
//       }
//     },
//     onAudioUploadError: (msg) => { alert(`Audio error: ${msg}`); return false; },
//     onPaste: (e, _clean, _max, core) => {
//       try {
//         const text = (e.clipboardData && e.clipboardData.getData("text")) || "";
//         if (/^https?:\/\/(www\.)?soundcloud\.com\/.+/i.test(text)) {
//           e.preventDefault();
//           core.insertHTML(
//             `<div class="se-audio-embed"><iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay"
//             src="https://w.soundcloud.com/player/?url=${encodeURIComponent(text)}&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=false"></iframe></div>`,
//             true, true
//           );
//           return false;
//         }
//         if (/^https?:\/\/(www\.)?zingmp3\.vn\/bai-hat\/.+/i.test(text)) {
//           e.preventDefault();
//           core.insertHTML(`<p><a href="${text}" rel="noopener noreferrer" target="_blank">${text}</a></p>`, true, true);
//           return false;
//         }
//       } catch { /* ignore */ }
//       return true;
//     },
//     imageResizing: true,
//     imageRotation: true,
//     imageFileInput: true,
//     imageMultipleFile: true,
//     imageAccept: ".jpg,.jpeg,.png,.gif,.webp",
//     videoFileInput: true,
//     videoAccept: ".mp4,.webm,.ogg",
//     audioFileInput: true,
//     audioAccept: ".mp3,.wav,.ogg",
//     linkRelDefault: { default: "nofollow noopener noreferrer", check_new_window: "only:noreferrer noopener" },
//     linkTargetNewWindow: true,
//     buttonList: [
//       ["undo","redo","removeFormat","preview","print","fullScreen","showBlocks","codeView"],
//       ["formatBlock","paragraphStyle","blockquote","font","fontSize","align","lineHeight"],
//       ["bold","underline","italic","strike","subscript","superscript","fontColor","hiliteColor","textStyle"],
//       ["outdent","indent","list","horizontalRule","table","link","image","video","audio"],
//     ],
//   }), [placeholder, maxCharCount]);

//   const displayHtml = useMemo(() => makeDisplayHtml(value || ""), [value]);

//   return (
//     <SunEditor
//       setContents={displayHtml}
//       onChange={(val) => {
//         const stored = makeStorageHtml(val || "");
        
//         // Detect và xóa media đã bị remove
//         handleContentChange(stored);
        
//         // Callback về parent
//         onChange?.(stored);
//       }}
//       setOptions={options}
//       onImageUploadBefore={handleImageBefore}
//       onVideoUploadBefore={handleVideoBefore}
//       onAudioUploadBefore={handleAudioBefore}
//     />
//   );
// }

// frontend/src/modules/common/RichEditor.jsx
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";
import { useMemo, useRef } from "react";
import { uploadMany, deleteFile, listFiles } from "../admin/upload/services/adminUploads.service";
import { toFileURL } from "../admin/upload/config/api";

const PARA_STYLE_CLASSES = ["__se__p-spaced", "__se__p-bordered", "__se__p-neon"];

// ==================== URL HELPERS ====================
function toAbsoluteIfUploads(url) {
  if (!url) return url;
  if (url.startsWith("/uploads/")) return toFileURL(url);
  if (url.startsWith("uploads/")) return toFileURL("/" + url);
  return url;
}

function toRelativeUploads(url) {
  if (!url) return url;
  if (/^(blob:|data:)/i.test(url)) return url;
  const idx = url.indexOf("/uploads/");
  if (idx >= 0) return url.slice(idx);
  const idx2 = url.indexOf("uploads/");
  if (idx2 >= 0) return `/${url.slice(idx2)}`;
  return url;
}

// ==================== MEDIA TRACKING ====================
// Extract tất cả media URLs từ HTML
function extractMediaUrls(html) {
  const urls = new Set();
  try {
    const doc = new DOMParser().parseFromString(html || "", "text/html");
    
    // Images
    doc.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      if (src && src.includes("/uploads/")) urls.add(toRelativeUploads(src));
    });
    
    // Videos
    doc.querySelectorAll("video, video source").forEach((el) => {
      const src = el.getAttribute("src");
      if (src && src.includes("/uploads/")) urls.add(toRelativeUploads(src));
    });
    
    // Audios
    doc.querySelectorAll("audio, audio source").forEach((el) => {
      const src = el.getAttribute("src");
      if (src && src.includes("/uploads/")) urls.add(toRelativeUploads(src));
    });
  } catch (e) {
    console.error("Error extracting media URLs:", e);
  }
  return Array.from(urls);
}

// Tìm media files đã bị xóa khỏi content
function findDeletedMedia(oldHtml, newHtml) {
  const oldUrls = new Set(extractMediaUrls(oldHtml));
  const newUrls = new Set(extractMediaUrls(newHtml));
  const deleted = [];
  
  oldUrls.forEach((url) => {
    if (!newUrls.has(url)) deleted.push(url);
  });
  
  return deleted;
}

// Query media file từ storage theo URL
async function findMediaByUrl(url, group) {
  try {
    // Parse URL để lấy thông tin
    const match = url.match(/\/uploads\/([^/]+)\/(\d{4})\/(\d{2})\/(\d{2})\/(.+)$/);
    if (!match) return null;
    
    const [, bucket, year, month, day] = match;
    
    // Query với group và thông tin từ URL
    const result = await listFiles({
      bucket,
      group,
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      limit: 100 // Tăng limit để tìm đúng file
    });
    
    // Tìm file khớp với URL
    const file = result.items.find((item) => item.url === url || item.relPath === url.replace(/^\//, ""));
    return file;
  } catch (e) {
    console.error("Error finding media by URL:", e);
    return null;
  }
}

// Xóa media files khỏi storage
async function deleteMediaFiles(urls, group) {
  const deleted = [];
  const failed = [];
  
  for (const url of urls) {
    try {
      const file = await findMediaByUrl(url, group);
      if (file && file._id) {
        await deleteFile({ id: file._id });
        deleted.push(url);
        console.log(`✓ Deleted media: ${url} (order: ${file.order})`);
      } else {
        console.warn(`✗ Media not found in storage: ${url}`);
        failed.push(url);
      }
    } catch (e) {
      console.error(`✗ Failed to delete ${url}:`, e);
      failed.push(url);
    }
  }
  
  return { deleted, failed };
}

// ==================== HTML PROCESSING ====================
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
  } catch  {
    return html;
  }
}

function rewriteAttrs(doc, mapper) {
  const apply = (el, attr) => {
    const v = el.getAttribute(attr);
    if (!v) return;
    const nv = mapper(v);
    if (nv && nv !== v) el.setAttribute(attr, nv);
  };
  doc.querySelectorAll("img").forEach((el) => apply(el, "src"));
  doc.querySelectorAll("video").forEach((el) => {
    apply(el, "src");
    el.querySelectorAll("source").forEach((s) => apply(s, "src"));
  });
  doc.querySelectorAll("audio").forEach((el) => {
    apply(el, "src");
    el.querySelectorAll("source").forEach((s) => apply(s, "src"));
  });
  doc.querySelectorAll("source").forEach((el) => apply(el, "src"));
  doc.querySelectorAll("a").forEach((el) => apply(el, "href"));
  return doc;
}

function makeDisplayHtml(html) {
  try {
    const doc = new DOMParser().parseFromString(html || "", "text/html");
    rewriteAttrs(doc, toAbsoluteIfUploads);
    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

function makeStorageHtml(html) {
  try {
    const doc = new DOMParser().parseFromString(html || "", "text/html");
    rewriteAttrs(doc, toRelativeUploads);
    return normalizeParagraphStyles(doc.body.innerHTML);
  } catch {
    return normalizeParagraphStyles(html || "");
  }
}

// ==================== UPLOAD HELPERS ====================
// Lấy order cao nhất hiện tại trong group
async function getMaxOrder(group, bucket) {
  try {
    const result = await listFiles({ group, bucket, limit: 1, sort: "-order" });
    return result.items.length > 0 ? result.items[0].order : 0;
  } catch (e) {
    console.error("Error getting max order:", e);
    return 0;
  }
}

function toSunResults(items = []) {
  return (items || []).map((it) => ({
    url: toFileURL(it.url),
    name: it.originalName || it.label || "file",
    size: it.size || 0,
  }));
}

// ==================== MAIN COMPONENT ====================
export default function RichEditor({
  value = "",
  onChange,
  placeholder = "Nhập nội dung...",
  maxCharCount = 50000,
  uploadGroup = "",
}) {
  const previousContentRef = useRef(value);

  // ✅ Đồng bộ previousContentRef khi value prop thay đổi từ bên ngoài
  useMemo(() => {
    previousContentRef.current = value;
  }, [value]);

  // ===== AUTO-DELETE LOGIC =====
  const handleContentChange = async (newHtml) => {
    const oldHtml = previousContentRef.current || "";
    
    // ✅ Bỏ qua nếu đang load lần đầu (oldHtml giống newHtml)
    if (oldHtml === newHtml) {
      previousContentRef.current = newHtml;
      return;
    }
    
    const deletedUrls = findDeletedMedia(oldHtml, newHtml);
    
    if (deletedUrls.length > 0 && uploadGroup) {
      console.log(`🗑️  Detected ${deletedUrls.length} deleted media:`, deletedUrls);
      
      // Xóa async, không block UI
      deleteMediaFiles(deletedUrls, uploadGroup).then(({ deleted, failed }) => {
        if (deleted.length > 0) {
          console.log(`✓ Successfully deleted ${deleted.length} files from storage`);
        }
        if (failed.length > 0) {
          console.warn(`✗ Failed to delete ${failed.length} files:`, failed);
        }
      });
    }
    
    // ✅ Cập nhật previousContent SAU KHI xử lý xóa
    previousContentRef.current = newHtml;
  };

  // ===== CUSTOM UPLOAD WITH AUTO ORDER =====
  const handleImageBefore = async (files, _info, uploadHandler) => {
    try {
      const maxOrder = await getMaxOrder(uploadGroup, "images");
      const resp = await uploadMany({
        bucket: "images",
        files,
        group: uploadGroup,
        startOrder: maxOrder + 1, // Auto increment từ max + 1
      });
      uploadHandler({ result: toSunResults(resp?.items || resp || []) });
    } catch (err) {
      alert(`Upload ảnh thất bại: ${err?.message || "Unknown error"}`);
    }
    return false;
  };

  const handleVideoBefore = async (files, _info, uploadHandler) => {
    try {
      const maxOrder = await getMaxOrder(uploadGroup, "videos");
      const resp = await uploadMany({
        bucket: "videos",
        files,
        group: uploadGroup,
        startOrder: maxOrder + 1,
      });
      uploadHandler({ result: toSunResults(resp?.items || resp || []) });
    } catch (err) {
      alert(`Upload video thất bại: ${err?.message || "Unknown error"}`);
    }
    return false;
  };

  const handleAudioBefore = async (files, _info, uploadHandler) => {
    try {
      const maxOrder = await getMaxOrder(uploadGroup, "audios");
      const resp = await uploadMany({
        bucket: "audios",
        files,
        group: uploadGroup,
        startOrder: maxOrder + 1,
      });
      uploadHandler({ result: toSunResults(resp?.items || resp || []) });
    } catch (err) {
      alert(`Upload audio thất bại: ${err?.message || "Unknown error"}`);
    }
    return false;
  };

  // ===== EDITOR OPTIONS =====
  const options = useMemo(() => ({
    mode: "classic",
    stickyToolbar: 0,
    resizingBar: true,
    showPathLabel: true,
    charCounter: true,
    maxCharCount,
    defaultTag: "p",
    placeholder,
    defaultStyle: `
      font-family: Inter, system-ui, Arial, sans-serif;
      line-height: 1.8;
    `,
    paragraphStyles: [
      { name: "Spaced", class: "__se__p-spaced" },
      { name: "Bordered", class: "__se__p-bordered" },
      { name: "Neon", class: "__se__p-neon" },
    ],
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
    onPaste: (e, _clean, _max, core) => {
      try {
        const text = (e.clipboardData && e.clipboardData.getData("text")) || "";
        if (/^https?:\/\/(www\.)?soundcloud\.com\/.+/i.test(text)) {
          e.preventDefault();
          core.insertHTML(
            `<div class="se-audio-embed"><iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay"
            src="https://w.soundcloud.com/player/?url=${encodeURIComponent(text)}&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=false"></iframe></div>`,
            true, true
          );
          return false;
        }
        if (/^https?:\/\/(www\.)?zingmp3\.vn\/bai-hat\/.+/i.test(text)) {
          e.preventDefault();
          core.insertHTML(`<p><a href="${text}" rel="noopener noreferrer" target="_blank">${text}</a></p>`, true, true);
          return false;
        }
      } catch {
        // ignore paste errors
      }
      return true;
    },
    imageResizing: true,
    imageRotation: true,
    imageFileInput: true,
    imageMultipleFile: true,
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
  }), [placeholder, maxCharCount]);

  const displayHtml = useMemo(() => makeDisplayHtml(value || ""), [value]);

  return (
    <SunEditor
      setContents={displayHtml}
      onChange={(val) => {
        const stored = makeStorageHtml(val || "");
        
        // Detect và xóa media đã bị remove
        handleContentChange(stored);
        
        // Callback về parent
        onChange?.(stored);
      }}
      setOptions={options}
      onImageUploadBefore={handleImageBefore}
      onVideoUploadBefore={handleVideoBefore}
      onAudioUploadBefore={handleAudioBefore}
    />
  );
}