// frontend/src/utils/xhrUpload.js
/**

 */
export function xhrUpload({ url, formData, headers = {}, onProgress, signal }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    // Header (Auth, v.v.)
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

    // Tiến trình
    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const percent = Math.round((e.loaded / e.total) * 100);
      onProgress?.(percent);
    };

    // Hỗ trợ AbortController
    if (signal) {
      if (signal.aborted) {
        xhr.abort();
      } else {
        signal.addEventListener("abort", () => xhr.abort());
      }
    }

    xhr.onload = () => {
      const ok = xhr.status >= 200 && xhr.status < 300;
      if (!ok) return reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText}`));
      try {
        resolve(JSON.parse(xhr.responseText));
      } catch {
        resolve(xhr.responseText);
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(formData);
  });
}
