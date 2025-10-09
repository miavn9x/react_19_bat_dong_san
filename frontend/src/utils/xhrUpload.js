// frontend/src/utils/xhrUpload.js
/**
 * xhrUpload
 * -----------------------------------------
 * Nhiệm vụ:
 * - Gửi POST multipart/form-data bằng XMLHttpRequest (để có % tiến trình).
 * - Gọi onProgress(%) theo tổng dung lượng request (0 → 100).
 * - Hỗ trợ AbortController (cancel upload).
 * - Trả về JSON từ server (201/200/207…), vẫn resolve cả khi có partial errors.
 *
 * Lưu ý:
 * - KHÔNG set "Content-Type" để browser tự gán boundary cho FormData.
 * - Nếu server trả JSON không hợp lệ, fallback sang responseText.
 * - Trả lỗi có cấu trúc: { message, status, body, responseText }.
 */
export function xhrUpload({ url, formData, headers = {}, onProgress, signal }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Để nhận JSON trực tiếp nếu server trả header JSON (không bắt buộc)
    try {
      xhr.responseType = "json";
    } catch (err) {
      // Một số môi trường cũ không hỗ trợ responseType=json
      void err; // dùng biến để tránh no-unused-vars & có statement để tránh no-empty
    }

    xhr.open("POST", url);

    // Header (ví dụ: Authorization). Không set Content-Type cho FormData.
    Object.entries(headers).forEach(([k, v]) => {
      if (v != null && v !== "") xhr.setRequestHeader(k, v);
    });

    // Upload progress: 0 → 100
    xhr.upload.onprogress = (e) => {
      if (e && e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress?.(percent);
      }
    };

    // Đảm bảo kết thúc luôn là 100%
    xhr.onloadend = () => {
      onProgress?.(100);
    };

    // Hỗ trợ AbortController (cancel)
    if (signal) {
      if (signal.aborted) {
        try {
          xhr.abort();
        } catch (err) {
          void err;
        }
      } else {
        signal.addEventListener("abort", () => {
          try {
            xhr.abort();
          } catch (err) {
            void err;
          }
        });
      }
    }

    // Hoàn tất thành công (2xx)
    xhr.onload = () => {
      const ok = xhr.status >= 200 && xhr.status < 300;
      if (!ok) {
        const body =
          xhr.responseType === "json" ? xhr.response : safeParse(xhr.responseText);
        const err = new Error(`HTTP ${xhr.status}`);
        err.status = xhr.status;
        err.body = body;
        err.responseText = xhr.responseText;
        return reject(err);
      }

      // Trả JSON (hoặc text)
      if (xhr.responseType === "json" && xhr.response != null) {
        return resolve(xhr.response);
      }
      try {
        return resolve(JSON.parse(xhr.responseText));
      } catch {
        return resolve(xhr.responseText);
      }
    };

    // Lỗi mạng
    xhr.onerror = () => {
      const err = new Error("Network error");
      err.status = xhr.status || 0;
      err.responseText = xhr.responseText;
      return reject(err);
    };

    // Người dùng hủy
    xhr.onabort = () => {
      const err = new Error("Upload aborted");
      err.status = 0;
      err.aborted = true;
      return reject(err);
    };

    xhr.send(formData);
  });
}

/** Thử parse JSON an toàn; lỗi thì trả null */
function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
