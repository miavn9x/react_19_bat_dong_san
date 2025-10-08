import { useState } from "react";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css"; // CSS bắt buộc

export default function SunEditorComponent() {
  const [content, setContent] = useState("");

  const handleChange = (val) => {
    setContent(val);
    console.log("Nội dung:", val);
  };

  return (
    <main style={{ padding: 20 }}>
      <SunEditor
        height="300px"
        setOptions={{
          buttonList: [
            ["undo", "redo"],
            ["bold", "italic", "underline", "strike"],
            ["font", "fontSize", "formatBlock"],
            ["fontColor", "hiliteColor"],
            ["align", "list", "table"],
            ["link", "image", "video"],
            ["fullScreen", "showBlocks", "codeView"],
          ],
        }}
        onChange={handleChange}
      />
      <h2>Kết quả:</h2>
      <div
        style={{
          border: "1px solid #ddd",
          padding: "10px",
          marginTop: "10px",
          minHeight: "100px",
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </main>
  );
}
