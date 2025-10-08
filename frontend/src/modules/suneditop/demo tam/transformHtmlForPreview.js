// Không export component, chỉ export hàm tiện ích -> tránh cảnh báo Fast Refresh
const PARA_STYLE_CLASSES = ["__se__p-spaced", "__se__p-bordered", "__se__p-neon"];

export function transformHtmlForPreview(content) {
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
      const container = el.closest(".se-video-container, .se-image-container") || null;
      const figure = container ? container.querySelector("figure") : null;

      const dp = el.getAttribute("data-percentage") || "";
      const parts = dp.split(",").map((s) => (s ? s.trim() : ""));
      const dpW = parts[0];
      const fromDP = dpW ? (/%$/.test(dpW) ? dpW : `${dpW}%`) : "";

      const contW = ((container?.getAttribute("style") || "").match(/width\s*:\s*([\d.]+%)/i) || [])[1] || "";
      const attrW = el.getAttribute("width");
      const fromAttr = attrW && /%$/.test(attrW) ? attrW : "";
      const figW = ((figure?.getAttribute("style") || "").match(/width\s*:\s*([\d.]+%)/i) || [])[1] || "";

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
        "display:block","position:relative","overflow:hidden","height:0",
        `padding-bottom:${padPercent}`,`width:${percent}`,
      ];
      if (align === "right") figBase.push("margin-left:auto","margin-right:0");
      else if (align === "center") figBase.push("margin-left:auto","margin-right:auto");
      else figBase.push("margin-left:0","margin-right:auto");
      fig.setAttribute("style", fOld ? `${fOld};${figBase.join(";")}` : figBase.join(";"));
    };

    const applyContainerAlign = (el) => {
      const container =
        el.closest(".se-video-container") || el.closest(".se-image-container") || el.parentElement;
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
      const contBase = ["display:block","float:none","box-sizing:border-box",`width:${percent}`,"min-width:0"];
      if (align === "right") contBase.push("margin-left:auto","margin-right:0");
      else if (align === "center") contBase.push("margin-left:auto","margin-right:auto");
      else contBase.push("margin-left:0","margin-right:auto");
      container.setAttribute("style", cOld ? `${cOld};${contBase.join(";")}` : contBase.join(";"));
      shapeFigure(container, align, percent, padPercent);
    };

    const makeResponsive = (el) => {
      el.removeAttribute("width"); el.removeAttribute("height");
      const mediaStyle = ["position:absolute","top:0","left:0","width:100%","height:100%","border:0"];
      const old = el.getAttribute("style") || "";
      el.setAttribute("style", old ? `${old};${mediaStyle.join(";")}` : mediaStyle.join(";"));
    };

    // (1) Dọn <br> dư trong heading
    doc.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((h) => {
      while (h.firstChild && h.firstChild.nodeName === "BR") h.removeChild(h.firstChild);
      while (h.lastChild && h.lastChild.nodeName === "BR") h.removeChild(h.lastChild);
    });

    // (2) Paragraph styles độc quyền
    const selector = PARA_STYLE_CLASSES.map((c) => `.${c}`).join(",");
    doc.querySelectorAll(selector).forEach((el) => {
      const current = PARA_STYLE_CLASSES.filter((c) => el.classList.contains(c));
      if (current.length > 1) {
        const keep = current[current.length - 1];
        PARA_STYLE_CLASSES.forEach((c) => { if (c !== keep) el.classList.remove(c); });
      }
    });

    // (3) Iframe & Video responsive
    doc.querySelectorAll("iframe").forEach((el) => {
      if (!el.hasAttribute("allowfullscreen")) el.setAttribute("allowfullscreen", "");
      makeResponsive(el); applyContainerAlign(el);
    });
    doc.querySelectorAll("video").forEach((el) => {
      el.setAttribute("controls",""); makeResponsive(el); applyContainerAlign(el);
    });

    return doc.body.innerHTML;
  } catch {
    return content;
  }
}
