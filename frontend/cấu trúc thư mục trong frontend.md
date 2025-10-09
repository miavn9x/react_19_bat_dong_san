frontend/
├─ src/
│  ├─ index.jsx
│  ├─ App.jsx                        # Khai báo router, mount layout & routes
│  │
│  ├─ layouts/
│  │  ├─ MainLayout.jsx              # Header/Footer + <Outlet/> cho khu public/protected
│  │  └─ AuthLayout.jsx              # Khung riêng cho Login/Register
│  │
│  ├─ modules/
│  │  ├─ client/                     # 👈 TẤT CẢ phân hệ giao diện người dùng để trong đây
│  │  │  ├─ auth/
│  │  │  │  ├─ pages/
│  │  │  │  │  ├─ Login.jsx          # (di chuyển UI hiện có vào đây)
│  │  │  │  │  └─ Register.jsx       # (convert TSX -> JSX, giữ UI)
│  │  │  │  ├─ components/           # LoginForm, RegisterForm… (nếu tách nhỏ)
│  │  │  │  ├─ services/             # auth.js (login/register/logout/getMe)
│  │  │  │  ├─ hooks/                # useAuth.js (giữ nguyên)
│  │  │  │  └─ index.js              # export gọn (pages, hooks, services)
│  │  │  │
│  │  │  ├─ home/
│  │  │  │  ├─ pages/
│  │  │  │  │  └─ Home.jsx           # Trang dashboard/home sau đăng nhập
│  │  │  │  ├─ components/           # Hero, Stats, …
│  │  │  │  └─ index.js
│  │  │  │
│  │  │  ├─ posts/                   # (để sẵn mở rộng)
│  │  │  │  ├─ pages/
│  │  │  │  │  ├─ PostsList.jsx
│  │  │  │  │  └─ PostDetail.jsx
│  │  │  │  ├─ components/           # PostCard, PostEditor…
│  │  │  │  ├─ services/             # posts.js (CRUD)
│  │  │  │  ├─ hooks/                # usePosts
│  │  │  │  └─ index.js
│  │  │  │
│  │  │  └─ users/                   # khu người dùng phía client
│  │  │     ├─ pages/
│  │  │     │  ├─ Profile.jsx        # /profile (me)
│  │  │     │  └─ UsersList.jsx      # /admin/users (admin)
│  │  │     ├─ components/           # UserCard, ProfileForm, UsersTable…
│  │  │     ├─ services/             # user.js (getMe, updateMe, list, updateRole, delete)
│  │  │     ├─ hooks/                # useUsers (nếu cần)
│  │  │     └─ index.js
│  │  │
│  │  └─ admin/                      # (tuỳ chọn) nếu mai mốt tách khu admin riêng biệt
│  │
│  ├─ guards/
│  │  ├─ PrivateRoute.jsx            # check đăng nhập
│  │  └─ RoleRoute.jsx               # check role (vd: admin)
│  │
│  ├─ services/
│  │  ├─ http.js                     # Axios instance (từ api.js đổi tên rõ nghĩa)
│  │  └─ index.js
│  ├─ utils/
│  │  └─ storage.js
│  ├─ assets/
│  └─ styles/
└─ .env                              # VITE_API_URL=...

bổ sung src/upload/ dung up ảnh ...
├─ services/
│  └─ uploads.api.js
├─ hooks/
│  ├─ useAuthToken.js
│  ├─ useUploads.js
│  └─ useUploadFile.js
├─ components/
│  ├─ MediaViewer.jsx
│  ├─ UploadDropzone.jsx
│  ├─ FileCard.jsx
│  ├─ FiltersBar.jsx
│  └─ AdminActions.jsx
└─ pages/
   ├─ AdminUploadsPage.jsx        // (#1) Quản lý (CRUD) – tái sử dụng
   ├─ PublicGalleryPage.jsx       // (#2) Xem media: không login & có login
   └─ UserUploadTestPage.jsx      // (#3) Test upload cho user – tái sử dụng


{
  "_id": {
    "$oid": "68e7d5d841798fcf01e2c249"
  },
  "owner": {
    "$oid": "68e519a1b6846a0541fbafdd"
  },
  "bucket": "images",
  "type": "image/jpeg",
  "ext": ".jpg",
  "originalName": "mẫu 02 - Copy (3).jpg",
  "size": 810762,
  "relPath": "uploads/images/2025/10/09/mu_02_-_copy_3_mia_9x_20251009_223344_1760024024084_lcf9kdl0th.jpg",
  "url": "/uploads/images/2025/10/09/mu_02_-_copy_3_mia_9x_20251009_223344_1760024024084_lcf9kdl0th.jpg",
  "year": 2025,
  "month": 10,
  "day": 9,
  "label": "",
  "group": "post:test",
  "order": 0,
  "__v": 0,
  "createdAt": {
    "$date": "2025-10-09T15:33:44.096Z"
  },
  "updatedAt": {
    "$date": "2025-10-09T15:33:44.096Z"
  }
}

{
  "_id": {
    "$oid": "68e519a1b6846a0541fbafdd"
  },
  "name": "Mía 9X",
  "email": "miavn9x@gmail.com",
  "password": "$2b$10$Z.WoYFJNeXQXGlBYe0PTmO3Ib3jtoa2dy/wbpH.NXAt/Zl9QJ6PXm",
  "avatar": "https://m.yodycdn.com/blog/anh-dep-3d-yodyvn.jpg",
  "phone": "0987654321",
  "address": "ádfghj",
  "role": "admin",
  "createdAt": {
    "$date": "2025-10-07T13:46:09.522Z"
  },
  "updatedAt": {
    "$date": "2025-10-07T17:25:38.867Z"
  },
  "__v": 0
}