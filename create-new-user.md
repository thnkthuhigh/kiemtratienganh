# 🔧 Tạo User MongoDB Mới - Step by Step

## 🎯 Mục tiêu: Tạo user mới để khắc phục lỗi authentication

### Bước 1: Đăng nhập MongoDB Atlas
1. Vào https://cloud.mongodb.com/
2. Đăng nhập với tài khoản của bạn
3. Chọn đúng project/organization

### Bước 2: Tạo Database User Mới
1. **Click "Database Access"** (menu bên trái)
2. **Click "Add New Database User"**
3. **Điền thông tin:**
   ```
   Authentication Method: Password
   Username: quiz-admin
   Password: quiz123456
   ```
4. **Database User Privileges:**
   - Chọn "Built-in Role"
   - Chọn "Atlas admin"
5. **Click "Add User"**

### Bước 3: Kiểm tra Network Access
1. **Click "Network Access"** (menu bên trái)
2. **Kiểm tra có IP `0.0.0.0/0`** trong danh sách
3. **Nếu chưa có:**
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere"
   - Confirm

### Bước 4: Lấy Connection String Mới
1. **Click "Database"** (menu bên trái)
2. **Click "Connect"** trên cluster
3. **Chọn "Connect your application"**
4. **Copy connection string:**
   ```
   mongodb+srv://quiz-admin:quiz123456@cluster0.bpqowys.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```

### Bước 5: Test Connection
1. **Sửa file `quick-test.js`:**
   ```javascript
   const PASSWORD = 'quiz123456';
   const USERNAME = 'quiz-admin';
   ```

2. **Chạy test:**
   ```bash
   node quick-test.js
   ```

### Bước 6: Tạo file .env
```bash
# Tạo file .env trong thư mục gốc
MONGODB_URI=mongodb+srv://quiz-admin:quiz123456@cluster0.bpqowys.mongodb.net/examenglish?retryWrites=true&w=majority&appName=Cluster0
PORT=5000
NODE_ENV=development
```

### Bước 7: Chạy Migration
```bash
npm run migrate
```

### Bước 8: Chạy Ứng Dụng
```bash
npm run dev:full
```

---

## 🔍 Alternative: Kiểm tra User Hiện Tại

### Option A: Reset Password của `thankthuhigh`
1. **Database Access** → **Edit user `thankthuhigh`**
2. **Edit Password** → Tạo password mới
3. **Update User**
4. Test với password mới

### Option B: Xem Chi Tiết User
1. **Database Access** → **Click vào user `thankthuhigh`**
2. **Kiểm tra:**
   - Built-in Role có phải "Atlas admin"?
   - Database User Privileges đúng chưa?
   - User có bị disable không?

---

## ❓ Nếu Vẫn Lỗi

### Thử Cluster Khác (nếu có)
1. **Database** → **Browse Collections**
2. **Kiểm tra cluster có đang chạy không**
3. **Restart cluster** nếu cần

### Tạo Database Mới
1. **Database** → **Browse Collections**
2. **Create Database:**
   - Database name: `quiz-app`
   - Collection name: `exercises`

### Liên Hệ Support
1. MongoDB Atlas có free support
2. Check MongoDB Community Forums
3. Stack Overflow với tag `mongodb-atlas`

---

## 🎯 Expected Result

Sau khi làm đúng các bước trên, bạn sẽ thấy:
```
✅ CONNECTION SUCCESSFUL!
📊 Connected to database: examenglish
🚀 MongoDB version: 7.x.x
📁 Available collections: none
🎉 Database is ready to use!
```
