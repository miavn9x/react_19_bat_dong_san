//frontend/src/modules/suneditop/components/Detail.jsx
// mã dùng render chi tiết bài viết tái sử dụng từ SunEditor

export default function ArticleDetail({ article }) {
  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-semibold mb-4">{article.title}</h1>
      <SunContentPreview
        html={article.content} // HTML lưu từ SunEditor
        className="border border-gray-300 rounded p-3"
      />
    </div>
  );
}
