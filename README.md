# Ứng Dụng Kiểm Tra Tiếng Anh

Ứng dụng web kiểm tra tiếng Anh được xây dựng bằng ReactJS với Vite và Tailwind CSS.

## 🚀 Tính Năng

### Quiz Features
- **3 loại bài tập**: Reading Comprehension, Listening và Cloze Test
- **Reading**: Hiển thị toàn bộ đoạn văn và tất cả câu hỏi cùng lúc
- **Listening**: Trình phát audio với điều khiển phát/tạm dừng/đặt lại
- **Cloze Test**: Điền từ vào chỗ trống với format truyền thống
- **Nhiều dạng câu hỏi**: Multiple choice, True/False, Fill in the blanks
- **Tùy chọn số lượng bài tập**: 1, 2, 3 hoặc 4 bài
- **Audio player**: Điều khiển âm thanh hoàn chỉnh cho bài listening
- **Kết quả chi tiết**: Hiển thị điểm số và tỷ lệ đúng

### Admin Features
- **🎛️ Admin Dashboard**: Quản lý tất cả bài tập
- **📊 Thống kê**: Hiển thị số lượng bài tập theo từng loại
- **➕ Thêm bài tập**: Form tạo bài tập mới với đầy đủ tính năng
- **✏️ Chỉnh sửa**: Cập nhật bài tập đã có
- **🗑️ Xóa bài tập**: Soft delete (ẩn bài tập)
- **🔍 Lọc và tìm kiếm**: Lọc theo category và trạng thái

### Technical Features
- **MongoDB Atlas**: Lưu trữ dữ liệu trên cloud
- **REST API**: Backend Express.js với đầy đủ CRUD operations
- **React Router**: Navigation giữa Quiz và Admin
- **Responsive**: Tương thích với mọi thiết bị
- **Real-time**: Cập nhật dữ liệu ngay lập tức

## 📁 Cấu Trúc Dự Án

```
kiemtratienganh/
├── public/
│   ├── images/          # Thư mục chứa hình ảnh câu hỏi
│   ├── audio/           # Thư mục chứa file âm thanh
│   └── questions.json   # File JSON gốc (để migration)
├── src/
│   ├── components/      # React components
│   │   ├── AdminDashboard.jsx      # Trang quản lý
│   │   └── AdminAddExercise.jsx    # Form thêm/sửa bài tập
│   ├── services/        # API services
│   │   └── api.js       # Axios API calls
│   ├── App.jsx         # Component chính với routing
│   ├── index.css       # CSS tùy chỉnh
│   └── main.jsx        # Entry point
├── server/              # Backend Express.js
│   ├── config/
│   │   └── database.js  # MongoDB connection
│   ├── models/
│   │   └── Exercise.js  # Mongoose schema
│   ├── routes/
│   │   └── exercises.js # API routes
│   ├── scripts/
│   │   └── migrate-data.js # Migration script
│   └── index.js         # Server entry point
├── package.json
└── README.md
```

## 🛠️ Cài Đặt và Chạy

### Yêu cầu hệ thống
- Node.js (phiên bản 14 trở lên)
- npm hoặc yarn
- MongoDB Atlas account (hoặc MongoDB local)

### Cài đặt dependencies
```bash
npm install
```

### Thiết lập Database
1. Tạo file `.env` trong thư mục gốc:
```bash
MONGODB_URI=mongodb+srv://examenglish:xamenglish@cluster0.bpqowys.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
PORT=5000
NODE_ENV=development
```

2. Chuyển dữ liệu từ JSON sang MongoDB:
```bash
npm run migrate
```

### Chạy ứng dụng

#### Chạy cả Frontend và Backend:
```bash
npm run dev:full
```

#### Hoặc chạy riêng biệt:

**Backend API (port 5000):**
```bash
npm run server
```

**Frontend (port 3000):**
```bash
npm run dev
```

Ứng dụng sẽ chạy tại:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Admin Dashboard: `http://localhost:3000/admin`

### Build production
```bash
npm run build
```

## 📋 Cách Sử Dụng

### 1. Màn hình chính
- Chọn số lượng bài tập (1, 2, 3, hoặc 4 bài)
- Chọn loại bài tập:
  - **Reading Comprehension**: Đọc đoạn văn và trả lời câu hỏi
  - **Listening**: Nghe audio và làm bài tập
  - **Cloze Test**: Điền từ vào chỗ trống

### 2. Làm bài kiểm tra

#### Reading Comprehension:
- Đọc toàn bộ đoạn văn
- Trả lời tất cả câu hỏi liên quan
- Các câu hỏi multiple choice hiển thị cùng lúc

#### Listening:
- Nhấn nút "Nghe" để phát audio
- Sử dụng các nút điều khiển: Phát/Tạm dừng/Đặt lại
- Làm 3 dạng bài tập:
  - **Fill in the blanks**: Điền từ vào chỗ trống
  - **True/False**: Chọn đúng hoặc sai
  - **Multiple choice**: Chọn đáp án A, B, C, D

#### Cloze Test:
- Trả lời từng câu hỏi điền từ
- Format truyền thống với 4 lựa chọn

### 3. Nộp bài và xem kết quả
- Nhấn nút "Nộp Bài" khi hoàn thành
- Xem điểm số và tỷ lệ đúng
- Đánh giá tổng quả
- Nút "Làm Bài Mới" để bắt đầu lại

## 📄 Định Dạng File JSON

File `public/questions.json` chứa dữ liệu câu hỏi theo cấu trúc:

```json
{
  "reading": [
    {
      "id": "reading-1",
      "title": "My Daily Routine",
      "passage": "Đoạn văn hoàn chỉnh...\n\nĐoạn thứ hai...",
      "questions": [
        {
          "id": 1,
          "question": "What time does the writer wake up?",
          "options": ["6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM"],
          "correct": "B"
        }
      ]
    }
  ],
  "listening": [
    {
      "id": "listening-1",
      "title": "Family Introduction",
      "audioUrl": "/audio/family-intro.mp3",
      "transcript": "Transcript của audio...",
      "questions": [
        {
          "id": 1,
          "type": "fill-blank",
          "question": "My name is _____ and I live with my _____.",
          "blanks": ["Sarah", "family"]
        },
        {
          "id": 2,
          "type": "true-false",
          "question": "Sarah's father is a doctor.",
          "correct": "false"
        },
        {
          "id": 3,
          "type": "multiple-choice",
          "question": "How old is Sarah's brother?",
          "options": ["8 years old", "10 years old", "12 years old", "15 years old"],
          "correct": "B"
        }
      ]
    }
  ],
  "clozetext": [
    {
      "id": 6,
      "question": "Fill in the blank: 'I _____ to school every day.'",
      "options": ["go", "went", "going", "gone"],
      "correct": "A"
    }
  ]
}
```

### Thêm bài tập mới:

#### Reading Comprehension:
1. Thêm object với `id`, `title`, `passage`, và `questions`
2. Mỗi question có `id`, `question`, `options`, và `correct`
3. Đáp án đúng: A, B, C, D

#### Listening:
1. Thêm object với `id`, `title`, `audioUrl`, `transcript`, và `questions`
2. Đặt file audio vào `public/audio/`
3. Ba loại câu hỏi:
   - `fill-blank`: có `blanks` array
   - `true-false`: có `correct` "true"/"false"
   - `multiple-choice`: có `options` và `correct`

#### Cloze Test:
1. Thêm câu hỏi individual với format cũ
2. Có `question`, `options`, và `correct`

### Thêm file audio:
1. Đặt file MP3/WAV/OGG vào `public/audio/`
2. Cập nhật `audioUrl` trong JSON
3. Transcript giúp hiển thị nội dung audio (demo)

## 🎨 Tùy Chỉnh Giao Diện

### CSS tùy chỉnh
File `src/index.css` chứa các style tùy chỉnh:
- Animations cho đáp án đúng/sai
- Responsive design
- Loading states
- Custom hover effects

### Tailwind CSS
Sử dụng các class utility của Tailwind để styling:
- Layout: `flex`, `grid`, `container`
- Colors: `bg-indigo-500`, `text-white`
- Spacing: `p-8`, `m-4`, `gap-6`
- Border: `rounded-xl`, `shadow-lg`

## 🚀 Tính Năng Nâng Cao

### Responsive Design
- Desktop: Full layout với sidebar
- Tablet: Responsive grid
- Mobile: Stack layout, optimized touch

### Accessibility
- Keyboard navigation
- Screen reader support
- High contrast colors
- Focus indicators

### Performance
- Lazy loading images
- Optimized bundle size
- Fast refresh during development

## 🐛 Xử Lý Lỗi

### Lỗi tải hình ảnh
- Hình ảnh lỗi sẽ được ẩn tự động
- Placeholder hiển thị khi đang tải

### Lỗi tải dữ liệu
- Loading spinner trong quá trình tải
- Error handling cho fetch requests

## 📱 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🤝 Đóng Góp

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📝 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

## 📞 Hỗ Trợ

Nếu gặp vấn đề, vui lòng tạo issue trên GitHub repository.

---

**Chúc bạn học tập hiệu quả! 📚✨**
