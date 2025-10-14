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




Quy trình & luồng xử lý (paste vào note.ms)
1) Vai trò & ràng buộc

User: tạo/sửa bài nháp → “Gửi duyệt”.

Admin: duyệt (approve) hoặc từ chối (reject) kèm lý do; khi duyệt mới trừ 1 lượt trong quota của user.

Quota:

Mặc định: dùng thử 3 bài (mỗi user 1 lần).

Khi hết quota: user cần mua gói (Plan) để có thêm lượt.

Tính phí: chỉ là phí đăng tin (không phải mua bán BĐS).

Bảo mật:

Không lưu refresh token ở localStorage (đã dùng HttpOnly cookie sẵn rồi) .

Access token chỉ tạm thời (TTL ngắn) — có thể giữ trong memory ở FE; khi hết hạn, FE gọi /api/auth/refresh (đã có CSRF) để lấy token mới .

RBAC & session revoke giữ nguyên (đang rất ổn) .

2) Trạng thái bài viết

status (giữ nguyên): draft|published|archived.

Thêm moderation:

moderation.state: draft|pending|approved|rejected.

moderation.by, moderation.at, moderation.notes.

Hiển thị công khai chỉ khi:
status = "published" và moderation.state = "approved".

3) Dòng đời bài viết

User tạo draft → chỉnh sửa.

User bấm Gửi duyệt → moderation.state = pending.

Admin xem hàng đợi →

Approve: hệ thống trừ 1 lượt trong các order đã trả tiền / gói còn hạn (nếu không đủ lượt → báo “User hết quota; yêu cầu mua gói”). Nếu đủ, set moderation.state="approved", đồng thời status="published" (tự gán publishedAt nếu trống).

Reject: moderation.state="rejected", lưu notes lý do, không trừ quota.

User có thể sửa & gửi lại nếu bị từ chối.

4) Kinh doanh gói đăng bài

Plan (do Admin cấu hình): code, name, priceVND, postCount, durationDays (tuỳ chọn), active.

Coupon: code (unique), % giảm hoặc amountOff, ngày hiệu lực, giới hạn số lần, giới hạn theo plan.

Order (mua gói): userId, planId, status (pending|paid|failed|cancelled), postsGranted, postsLeft, finalAmount, couponCode, paidAt…

Quota = trial (3) + tổng postsLeft của các Order paid & còn hạn.

5) Tìm kiếm & SEO BĐS

Giữ text index sẵn có (title/summary/contentText/tags) .

Thêm attrs cho BĐS + index để lọc:

dealType (sell|rent), propertyType, price, area, bedrooms, bathrooms, location { provinceCode, districtCode, wardCode }.

Index gợi ý: { "attrs.location.provinceCode":1, "attrs.location.districtCode":1, status:1, "moderation.state":1, publishedAt:-1 }, cộng thêm index theo price và area.

Public GET /api/posts mở rộng query: dealType, propertyType, minPrice, maxPrice, minArea, maxArea, province, district, ward, q, tag, category.
