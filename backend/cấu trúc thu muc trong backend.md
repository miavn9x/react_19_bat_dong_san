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

# BỔ SUNG (KHÔNG THAY ĐỔI GỐC)
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
