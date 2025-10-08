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
