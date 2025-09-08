# Hệ Thống Thống Kê và Luyện Tập Ưu Tiên

## Tính năng mới đã được thêm vào:

### 1. **Theo dõi chi tiết hiệu suất câu hỏi**
- Lưu trữ từng câu trả lời (đúng/sai) của người dùng
- Theo dõi thời gian làm bài cho từng câu hỏi
- Tính toán tỷ lệ thành công cho từng câu hỏi
- Phân tích điểm yếu và câu hỏi cần ôn tập

### 2. **Database Schema mở rộng**
- **answerHistory**: Lịch sử trả lời chi tiết với thời gian
- **questionPerformance**: Thống kê hiệu suất từng câu hỏi
- **isWeakPoint**: Đánh dấu câu hỏi yếu (success rate < 50%)
- **needsReview**: Đánh dấu câu hỏi cần ôn tập

### 3. **API Endpoints mới**
- `GET /api/users/priority-questions/:userId` - Lấy câu hỏi ưu tiên
- `GET /api/users/performance/:userId` - Thống kê hiệu suất chi tiết
- `GET /api/users/history/:userId` - Lịch sử trả lời
- `GET /api/users/weak-points/:userId` - Phân tích điểm yếu

### 4. **Giao diện Thống kê (UserStats Component)**
- **Tab Tổng quan**: Thống kê tổng thể và theo danh mục
- **Tab Câu hỏi ưu tiên**: Danh sách câu hỏi cần luyện tập
- **Tab Điểm yếu**: Phân tích các câu hỏi làm sai nhiều
- **Tab Lịch sử**: Xem lại các câu đã làm

### 5. **Hệ thống ưu tiên câu hỏi**
- Tự động xếp hạng câu hỏi theo độ ưu tiên
- Câu hỏi yếu có độ ưu tiên cao nhất
- Câu hỏi cần ôn tập (sai gần đây hoặc chưa làm lâu)
- Có thể lọc theo danh mục

### 6. **Theo dõi thời gian**
- Đo thời gian làm từng câu hỏi
- Tính thời gian trung bình cho từng loại câu hỏi
- Hiển thị trong lịch sử và thống kê

## Cách sử dụng:

### 1. Xem thống kê
1. Đăng nhập vào tài khoản
2. Nhấn nút "📊 Thống kê" ở góc phải trên
3. Xem các tab khác nhau để phân tích hiệu suất

### 2. Luyện tập ưu tiên
1. Trong giao diện thống kê, chọn "Luyện tập điểm yếu"
2. Hoặc chọn tab "Câu hỏi ưu tiên" và nhấn "Luyện tập"
3. Hệ thống sẽ tạo quiz với các câu hỏi cần cải thiện

### 3. Phân tích điểm yếu
1. Vào tab "Điểm yếu" để xem câu hỏi làm sai nhiều
2. Xem tỷ lệ thành công và số lần làm
3. Tập trung luyện tập các câu hỏi này

### 4. Xem lịch sử
1. Tab "Lịch sử" hiển thị các câu đã làm gần đây
2. Xem được đáp án đã chọn và đáp án đúng
3. Biết thời gian làm từng câu

## Thuật toán ưu tiên:

### Tiêu chí sắp xếp câu hỏi (theo thứ tự ưu tiên):
1. **Câu hỏi yếu** (isWeakPoint = true): success rate < 50% và đã làm ≥ 2 lần
2. **Câu hỏi cần ôn tập** (needsReview = true): sai gần đây hoặc chưa làm > 7 ngày
3. **Success rate thấp**: Ưu tiên câu có tỷ lệ đúng thấp
4. **Lần làm gần đây**: Ưu tiên câu chưa làm lâu

### Database Methods mới:
- `updateQuestionPerformance()`: Cập nhật hiệu suất câu hỏi
- `getPriorityQuestions()`: Lấy câu hỏi ưu tiên
- `getPerformanceStats()`: Lấy thống kê tổng quan

## Lợi ích:

1. **Học tập có mục tiêu**: Tập trung vào điểm yếu thay vì làm ngẫu nhiên
2. **Theo dõi tiến bộ**: Xem được sự cải thiện qua thời gian
3. **Tối ưu thời gian**: Luyện tập những gì cần thiết nhất
4. **Phân tích chi tiết**: Hiểu rõ điểm mạnh/yếu của bản thân
5. **Động lực học tập**: Gamification thông qua thống kê và tiến bộ

## Cấu trúc dữ liệu:

```javascript
// questionPerformance schema
{
  questionId: String,
  exerciseId: String,
  category: String,
  questionType: String,
  question: String,
  totalAttempts: Number,
  correctAttempts: Number,
  wrongAttempts: Number,
  successRate: Number, // Phần trăm
  averageTimeSpent: Number, // Giây
  lastAttempt: Date,
  isWeakPoint: Boolean,
  needsReview: Boolean
}

// answerHistory schema
{
  questionId: String,
  exerciseId: String,
  category: String,
  questionType: String,
  question: String,
  selectedAnswer: String,
  correctAnswer: String,
  isCorrect: Boolean,
  timeSpent: Number, // Giây
  timestamp: Date
}
```

Hệ thống này giúp người dùng học tập hiệu quả hơn bằng cách tập trung vào những gì họ cần cải thiện nhất, thay vì luyện tập một cách mù quáng.
