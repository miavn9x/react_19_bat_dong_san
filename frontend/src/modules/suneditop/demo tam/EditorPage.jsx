// pages/EditorPage.jsx
//Trang soạn thảo (gửi lên BE)
import { useState } from "react";
import SunEditorComponent from "@/modules/suneditop/SunEditor";

export default function EditorPage() {
  const [html, setHtml] = useState("");

  const save = async () => {
    // Gửi html lên BE
    await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: html }),
    });
    // chuyển trang, toast, ...
  };

  return (
    <div>
      <SunEditorComponent value={html} onChange={setHtml} />
      <button onClick={save} className="mt-4 px-4 py-2 rounded bg-blue-600 text-white">
        Lưu
      </button>
    </div>
  );
}
