// pages/ArticleDetail.jsx
//Trang hiển thị bài viết (lấy từ BE về và hiển thị)
import SunContentPreview from "@/modules/suneditop/SunContentPreview";

export default function ArticleDetail({ article }) {
  // article.content lấy từ API
  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-semibold mb-4">{article.title}</h1>
      <SunContentPreview html={article.content} className="border border-gray-300 rounded p-3" />
    </div>
  );
}
