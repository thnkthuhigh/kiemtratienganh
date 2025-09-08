# 🚀 Hướng dẫn Deploy English Quiz App

## 📋 Tổng quan
- **Frontend**: Deploy lên Vercel
- **Backend**: Deploy lên Render
- **Database**: MongoDB Atlas (cloud)

---

## 🗄️ Bước 1: Chuẩn bị MongoDB Atlas

### 1.1 Tạo tài khoản MongoDB Atlas
1. Truy cập: https://www.mongodb.com/atlas
2. Đăng ký tài khoản miễn phí
3. Tạo cluster mới (chọn M0 Sandbox - Free)

### 1.2 Tạo Database User
1. Vào **Database Access** → **Add New Database User**
2. Tạo username/password (lưu lại để dùng sau)
3. Grant quyền **Read and write to any database**

### 1.3 Whitelist IP
1. Vào **Network Access** → **Add IP Address**
2. Chọn **Allow Access from Anywhere** (0.0.0.0/0)
3. Hoặc thêm IP cụ thể của Render

### 1.4 Lấy Connection String
1. Vào **Clusters** → **Connect** → **Connect your application**
2. Copy connection string có dạng:
```
mongodb+srv://username:password@cluster.mongodb.net/english-quiz?retryWrites=true&w=majority
```

---

## 🔧 Bước 2: Deploy Backend lên Render

### 2.1 Chuẩn bị repository
1. Tạo repository riêng cho backend hoặc sử dụng subfolder
2. Đảm bảo có file `server/package.json` đã được tạo

### 2.2 Deploy trên Render
1. Truy cập: https://render.com
2. Đăng ký/đăng nhập
3. **New** → **Web Service**
4. Connect GitHub repository
5. **Root Directory**: `server` (nếu dùng subfolder)
6. **Build Command**: `npm install`
7. **Start Command**: `npm start`

### 2.3 Cấu hình Environment Variables
Thêm các biến sau trong Render:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/english-quiz?retryWrites=true&w=majority

# Server
PORT=5000
NODE_ENV=production

# CORS (thay your-app-name bằng tên Vercel app thực tế)
CORS_ORIGIN=https://your-app-name.vercel.app

# Security
JWT_SECRET=your-super-secure-secret-key-here
```

### 2.4 Lưu URL Backend
Sau khi deploy thành công, lưu lại URL backend có dạng:
```
https://your-backend-app.onrender.com
```

---

## 🌐 Bước 3: Deploy Frontend lên Vercel

### 3.1 Chuẩn bị repository
Đảm bảo repository có:
- `package.json` đã được cập nhật
- `vercel.json` config file
- `.env.production` với URL backend

### 3.2 Deploy trên Vercel
1. Truy cập: https://vercel.com
2. Đăng ký/đăng nhập với GitHub
3. **New Project** → Import repository
4. **Framework Preset**: Vite
5. **Root Directory**: `.` (nếu frontend ở root) hoặc chỉ định thư mục

### 3.3 Cấu hình Environment Variables
Trong Vercel Settings → Environment Variables:

```bash
# Backend API URL (thay bằng URL Render thực tế)
VITE_API_URL=https://your-backend-app.onrender.com/api

# App info
VITE_APP_NAME=English Quiz App
VITE_APP_VERSION=1.0.0
```

### 3.4 Deploy
1. Nhấn **Deploy**
2. Chờ build hoàn thành
3. Lưu lại URL frontend có dạng:
```
https://your-app-name.vercel.app
```

---

## 🔄 Bước 4: Cập nhật CORS

### 4.1 Cập nhật Backend CORS
Trở lại Render dashboard, cập nhật environment variable:
```bash
CORS_ORIGIN=https://your-actual-vercel-url.vercel.app
```

### 4.2 Redeploy Backend
1. Vào Render dashboard → Your service
2. **Manual Deploy** → **Deploy latest commit**

---

## ✅ Bước 5: Test Production

### 5.1 Test Backend
```bash
curl https://your-backend-app.onrender.com/api/health
```

### 5.2 Test Frontend
1. Truy cập Vercel URL
2. Kiểm tra console browser (F12)
3. Test đăng ký/đăng nhập user
4. Test làm quiz và xem thống kê

---

## 🛠️ Troubleshooting

### Lỗi CORS
- Kiểm tra `CORS_ORIGIN` trong Render environment variables
- Đảm bảo URL chính xác (không có trailing slash)

### Backend không kết nối Database
- Kiểm tra `MONGODB_URI` 
- Verify MongoDB Atlas network access
- Check database user permissions

### Frontend không gọi được API
- Kiểm tra `VITE_API_URL` trong Vercel
- Verify backend URL accessible
- Check browser network tab cho lỗi chi tiết

### Build fails
- Check Node.js version compatibility
- Verify all dependencies in package.json
- Review build logs để tìm lỗi cụ thể

---

## 📝 Checklist Deploy

### Backend (Render):
- [ ] MongoDB Atlas setup hoàn thành
- [ ] Repository/folder có `package.json` đúng
- [ ] Environment variables được thiết lập
- [ ] Deploy thành công
- [ ] Health check API hoạt động
- [ ] CORS được cấu hình cho Vercel URL

### Frontend (Vercel):
- [ ] Repository có `vercel.json` và build config
- [ ] Environment variables có `VITE_API_URL`
- [ ] Build & deploy thành công
- [ ] App load được trên browser
- [ ] API calls hoạt động
- [ ] User system và quiz functionality work

### Final Tests:
- [ ] Đăng ký user mới
- [ ] Đăng nhập
- [ ] Làm quiz
- [ ] Xem thống kê
- [ ] Test trên mobile device

---

## 🎯 URLs Quan trọng

Sau khi deploy thành công, bạn sẽ có:

```bash
# Production URLs
Frontend: https://your-app-name.vercel.app
Backend:  https://your-backend-app.onrender.com
Database: MongoDB Atlas cluster

# Health checks
Backend API: https://your-backend-app.onrender.com/api/health
```

## 💡 Tips

1. **Free tier limitations**: Render free tier có thể "sleep" khi không dùng
2. **Cold starts**: Lần đầu load có thể chậm
3. **Monitoring**: Sử dụng Render/Vercel dashboards để theo dõi
4. **Updates**: Git push sẽ tự động trigger redeploy

🎉 **Chúc mừng! App của bạn đã được deploy thành công!**
