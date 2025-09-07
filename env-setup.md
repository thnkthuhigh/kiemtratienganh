# 🔐 MongoDB Setup Instructions

## Bước 1: Lấy mật khẩu MongoDB

1. **Đăng nhập MongoDB Atlas**: https://cloud.mongodb.com/
2. **Vào Database Access** (menu bên trái)
3. **Tìm user `thankthuhigh`** 
4. **Copy mật khẩu** hoặc tạo mật khẩu mới

## Bước 2: Tạo file .env

Tạo file `.env` trong thư mục gốc với nội dung:

```bash
MONGODB_URI=mongodb+srv://thankthuhigh:YOUR_ACTUAL_PASSWORD@cluster0.bpqowys.mongodb.net/examenglish?retryWrites=true&w=majority&appName=Cluster0
PORT=5000
NODE_ENV=development
```

**⚠️ Thay `YOUR_ACTUAL_PASSWORD` bằng mật khẩu thực tế!**

## Bước 3: Kiểm tra Network Access

1. **Vào Network Access** trong MongoDB Atlas
2. **Add IP Address**: `0.0.0.0/0` (Allow access from anywhere)
3. **Hoặc thêm IP hiện tại** của bạn

## Bước 4: Test Connection

```bash
npm run test-db
```

## Bước 5: Chạy ứng dụng

```bash
npm run dev:full
```

---

## 🔧 Nếu vẫn lỗi:

### Option 1: Tạo user mới
1. **Database Access** → **Add New Database User**
2. **Username**: `quiz-user`  
3. **Password**: Tự tạo (ví dụ: `quiz123456`)
4. **Database User Privileges**: `Atlas admin`

### Option 2: Reset mật khẩu user hiện tại
1. **Database Access** → **Edit user `thankthuhigh`**
2. **Edit Password** → Tạo mật khẩu mới
3. **Update User**

## 🎯 Connection String Examples:

```bash
# Với user mới
MONGODB_URI=mongodb+srv://quiz-user:quiz123456@cluster0.bpqowys.mongodb.net/examenglish?retryWrites=true&w=majority&appName=Cluster0

# Với user hiện tại (reset password)
MONGODB_URI=mongodb+srv://thankthuhigh:NEW_PASSWORD@cluster0.bpqowys.mongodb.net/examenglish?retryWrites=true&w=majority&appName=Cluster0
```
