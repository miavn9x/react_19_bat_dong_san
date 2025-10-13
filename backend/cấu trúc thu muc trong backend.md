backend/
├─ src/
│  ├─ index.js                  # (ENTRY) Khởi động app:
│  │                             # - nạp .env
│  │                             # - gắn middleware nền tảng (CORS, JSON, morgan)
│  │                             # - connect MongoDB
│  │                             # - mount prefix /api -> routes.js
│  │                             # - listen PORT
│  │                             # + phục vụ static thư mục /uploads (express.static) để FE truy cập file đã upload
│  ├─ config/
│  │  └─ db.js                  # Kết nối Mongoose (connectDB), set strictQuery, log & thoát khi lỗi.
│  ├─ middlewares/
│  │  └─ auth.js                # Middleware bảo mật:
│  │                             # - auth(req,res,next): đọc Bearer token, verify JWT, set req.userId/req.userRole
│  │                             # - requireRole(...roles): chặn 403 nếu role không hợp lệ.
│  ├─ routes.js                 # Router gốc của app:
│  │                             # - /health (check sống)
│  │                             # - router.use('/auth', modules/auth)
│  │                             # - router.use('/users', modules/users)
│  │                             # -> gom toàn bộ route từ các module theo prefix chuẩn REST.
│  │                             # + router.use('/uploads', modules/uploads)  # mount API upload (images/videos/audios)
│  ├─ modules/
│  │  ├─ auth/
│  │  │  ├─ controllers/
│  │  │  │  └─ auth.controller.js
│  │  │  │     # Controller lớp “HTTP” cho Auth:
│  │  │  │     # - register(req,res): validate sơ bộ, tạo user role 'user', ký JWT, trả {token,user}
│  │  │  │     # - login(req,res): tìm user theo email, so sánh mật khẩu (model.comparePassword), ký JWT, trả {token,user}
│  │  │  ├─ services/
│  │  │  │  └─ auth.service.js  # (Để mở rộng) Business logic thuần cho Auth: refresh token, forgot/reset password, v.v.
│  │  │  ├─ validators/
│  │  │  │  └─ auth.validator.js
│  │  │  │     # (Tùy chọn) Schema Joi cho body register/login nếu bạn bật validate.
│  │  │  ├─ routes/
│  │  │  │  └─ auth.routes.js   # Định tuyến Auth (PUBLIC):
│  │  │  │                      # - POST /auth/register -> controllers.register
│  │  │  │                      # - POST /auth/login    -> controllers.login
│  │  │  └─ index.js            # Export gọn: module.exports = { routes }
│  │  └─ users/
│  │     ├─ controllers/
│  │     │  └─ user.controller.js
│  │     │     # Controller lớp “HTTP” cho Users:
│  │     │     # - getMe: trả hồ sơ user hiện tại (dựa req.userId do auth gắn)
│  │     │     # - updateMe: user tự sửa name/avatar/phone/address (không cho đổi role)
│  │     │     # - listUsers (admin): phân trang, filter q theo name/email/phone
│  │     │     # - updateRole (admin): đổi role user; chặn tự giáng cấp admin cuối cùng
│  │     │     # - deleteUser (admin): xóa user; chặn tự xóa chính mình
│  │     ├─ models/
│  │     │  └─ user.model.js    # Mongoose Model:
│  │     │                      # - Schema: name, email(unique,lowercase,trim), password(select:false), avatar, phone, address, role
│  │     │                      # - pre('save') hash password bằng bcrypt
│  │     │                      # - methods.comparePassword(plain)
│  │     ├─ services/
│  │     │  └─ user.service.js  # Lớp truy cập dữ liệu (DAL):
│  │     │                      # - findById / updateMe / list / count / countAdmins / updateRole / deleteById
│  │     │                      # -> giúp controller mỏng, dễ test & tái dùng.
│  │     ├─ validators/
│  │     │  └─ user.validator.js
│  │     │     # (Tùy chọn) Schema Joi cho updateMe, listUsers, updateRole nếu cần.
│  │     ├─ routes/
│  │     │  └─ user.routes.js   # Định tuyến Users (PROTECTED):
│  │     │                      # - router.use(auth) -> tất cả /users yêu cầu JWT hợp lệ
│  │     │                      # - GET  /users/me
│  │     │                      # - PUT  /users/me
│  │     │                      # - GET  /users           (requireRole('admin'))
│  │     │                      # - PATCH /users/:id/role (requireRole('admin'))
│  │     │                      # - DELETE /users/:id     (requireRole('admin'))
│  │     └─ index.js            # Export gọn: module.exports = { routes, models: { User } }
└─ .env                         # Biến môi trường:
                                # - PORT, MONGODB_URI, JWT_SECRET, JWT_EXPIRES
                                # - CORS_ORIGIN (frontend origin)




# UPLOAD (HÌNH ẢNH, VIDEOS, AUDIO)
│  ├─ modules/
│  │  └─ uploads/               # MODULE MỚI: quản lý upload lưu trực tiếp trên máy chủ
│  │     ├─ controllers/
│  │     │  └─ upload.controller.js  # Controller HTTP: CREATE (user); LIST/GET/PATCH/PUT/DELETE (admin). Xoá file vật lý khi replace/remove.
│  │     ├─ models/
│  │     │  └─ file.model.js         # Mongoose Model "File" (collection: "uploads"): owner, bucket, type, size, relPath, url, year/month/day, label.
│  │     ├─ routes/
│  │     │  └─ upload.routes.js      # Định tuyến + Multer: lưu vào uploads/<bucket>/<YYYY>/<MM>/<DD>/; phân quyền auth/requireRole.
│  │     ├─ services/
│  │     │  └─ storage.service.js    # Tạo cây thư mục ngày-tháng-năm + sinh tên file an toàn (timestamp + nanoid) + trả URL/relPath.
│  │     ├─ validators/
│  │     │  └─ upload.validator.js   # assertBucket(images|videos|audios), whitelist MIME theo từng bucket.
│  │     └─ index.js                 # Export gọn: module.exports = { routes, models: { File } }
│  └─ uploads/                       # THƯ MỤC LƯU FILE (được serve tĩnh). Tự tạo khi upload:
│        ├─ images/ YYYY/MM/DD/...
│        ├─ videos/ YYYY/MM/DD/...
│        └─ audios/ YYYY/MM/DD/...


Quyền (nhắc lại – đã đúng trong code)
| Hành động          | Khách | User (login) | Admin |
| ------------------ | :---: | :----------: | :---: |
| Truy cập file tĩnh |   ✅   |       ✅      |   ✅   |
| List / Detail meta |   ✅   |       ✅      |   ✅   |
| Upload (1/nhiều)   |   ❌   |       ✅      |   ✅   |
| Sửa meta (PATCH)   |   ❌   |       ❌      |   ✅   |
| Thay file (PUT)    |   ❌   |       ❌      |   ✅   |
| Xoá (DELETE)       |   ❌   |       ❌      |   ✅   |


{
  "_id": {
    "$oid": "68eca303a54e2ca9685e962b"
  },
  "title": "Full 1 - 37 | Sư Tôn Vô Địch Nhưng Giả Vờ Phế Vật | Đại Sư Huynh ohioih oiho   ohoh",
  "summary": "Full 1 - 37 | Sư Tôn Vô Địch Nhưng Giả Vờ Phế Vật | Đại Sư Huynhhiohoihhi \n",
  "contentHtml": "<div class=\"se-component se-image-container __se__float-none\" style=\"width: 30%\"><figure style=\"width: 100%;\"><img src=\"/uploads/images/2025/10/13/mu_02_mia_9x_20251013_143809_1760341089796_dxdj39863e.jpg\" alt=\"\" data-rotate=\"\" data-proportion=\"true\" data-size=\"30%,auto\" data-align=\"none\" data-percentage=\"30%,auto\" data-file-name=\"mẫu 02.jpg\" data-file-size=\"810762\" data-origin=\",\" origin-size=\"2048,2048\" style=\"width: 100%; height: auto;\"></figure></div><p><br></p><div class=\"se-component se-video-container __se__float-center\" style=\"width: 50%; min-width: 100%\"><figure style=\"width: 50%; height: 56.25%; padding-bottom: 28.13%;\"><video controls=\"true\" src=\"/uploads/videos/2025/10/13/2025-09-17_00-04-38_-_copy_-_copy_-_copy_-_copy_-_copy_-_copy_mia_9x_20251013_143842_1760341122018_wq7tktszu9.mp4\" data-proportion=\"true\" data-percentage=\"50,56.25%\" data-size=\"50%,56.25%\" data-align=\"center\" data-file-name=\"2025-09-17 00-04-38 - Copy - Copy - Copy - Copy - Copy - Copy.mp4\" data-file-size=\"14142128\" data-origin=\"100%,56.25%\" data-rotate=\"\" style=\"width: 100%; height: 100%;\"></video></figure></div><div class=\"se-component se-video-container __se__float-none\" style=\"width: 50%\"><figure style=\"width: 100%; height: 56.25%; padding-bottom: 56.25%;\"><iframe frameborder=\"0\" allowfullscreen=\"\" src=\"https://www.youtube.com/embed/_Ng1_CLCSkM?si=WcM2dffWyg6O4aZy\" data-proportion=\"true\" data-percentage=\"50,56.25%\" data-size=\"50%,56.25%\" data-align=\"none\" data-file-name=\"_Ng1_CLCSkM?si=WcM2dffWyg6O4aZy\" data-file-size=\"0\" data-origin=\"100%,56.25%\" data-rotate=\"\" style=\"width: 100%; height: 100%;\"></iframe></figure></div>",
  "contentText": "241.422 lượt xem 19 thg 9, 2025 ✪ Ưu tiên hội viên xem trước vào ngày 19 tháng 9, 2025 #tutien #cochannhan #anime (Ủng Hộ AD Ly Cafe - Momo: 0332791850)Cảnh Giới Tu Luyện: Luyện Thể → Khí Hải → Quy Nguyên → Địa Linh → Thiên Linh → Càn Khôn → Niết Bàn → Không Hư → Chân Tổ #gaukinhdi #gauhaihuoc #gauhaihuocvlog #gaucute #vietsub #hoathinh #tutien #xuhuong #xuyenkhong #anime #nopevietsub #gorygory #reviewanimehay #hoathinh #kiemquan #cochannhan #cổchânnhân #daisuhuynh #tutienreview Người được đề cập 1 người Ngô Tôn Bản chép lời Theo dõi nội dung video bằng bản chép lời. Hiện bản chép lời",
  "status": "draft",
  "author": {
    "$oid": "68e519a1b6846a0541fbafdd"
  },
  "category": {
    "id": null,
    "slug": "",
    "name": "aaa"
  },
  "tags": [
    {
      "name": "ugu",
      "slug": "ugu"
    },
    {
      "name": "gjf",
      "slug": "gjf"
    }
  ],
  "coverFile": {
    "$oid": "68eca581a54e2ca9685e96fe"
  },
  "galleryGroup": "post:68eca303a54e2ca9685e962b",
  "viewCount": 0,
  "likeCount": 0,
  "seo": {
    "title": "",
    "description": "",
    "canonical": ""
  },
  "slug": "full-1-37-su-ton-vo-dich-nhung-gia-vo-phe-vat-dai-su-huynh-ohioih-oiho-ohoh",
  "createdAt": {
    "$date": "2025-10-13T06:58:11.556Z"
  },
  "updatedAt": {
    "$date": "2025-10-13T07:40:42.087Z"
  },
  "__v": 0
}