backend/
├─ .env                         # Nơi đặt biến môi trường (MONGODB_URI, JWT_SECRET, PORT, JWT_EXPIRES)
├─ package.json                 # Khai báo tên dự án, scripts (dev/start), dependencies (express, mongoose, cors, jsonwebtoken...)
└─ src/
   ├─ index.js                  # Điểm vào ứng dụng: load .env, connect MongoDB, mount middleware, gắn /api routes, lắng nghe PORT
   ├─ config/
   │  └─ db.js                  # Hàm connectDB(uri): cấu hình & kết nối Mongoose tới MongoDB (dbName, strictQuery...)
   ├─ middlewares/
   │  └─ auth.js                # Middleware xác thực JWT: đọc Bearer token, verify, set req.userId hoặc trả 401
   ├─ models/
   │  └─ User.js                # Mongoose model User: {name, email unique, password select:false}; pre-save hash mật khẩu, method comparePassword
   ├─ controllers/
   │  └─ auth.controller.js     # Bộ xử lý /auth: register (tạo user + trả token), login (verify + trả token), signToken()
   └─ routes/
      ├─ index.js               # Router gốc gắn các nhánh: /health, /auth, /users (bảo vệ bởi auth middleware)
      ├─ auth.routes.js         # Định nghĩa endpoint POST /auth/register, POST /auth/login -> gọi controller tương ứng
      └─ user.routes.js         # (Tùy chọn) Route test JWT, ví dụ GET /users/me trả thông tin user từ req.userId

