src/
├─ lib/
│  └─ api.js                  # cấu hình axios (baseURL, interceptors)
├─ services/
│  └─ auth.js                 # gọi API auth (login, register, logout)
├─ hooks/
│  └─ useAuth.js              # state auth, tiện ích dùng trong UI
├─ auth/
│  ├─ login/
│  │  └─ Login.jsx            # UI form đăng nhập
│  └─ register/
│     └─ Register.jsx         # UI form đăng ký
├─ routes/
│  └─ PrivateRoute.jsx        # route yêu cầu đăng nhập (ví dụ)
├─ App.jsx
└─ main.jsx
