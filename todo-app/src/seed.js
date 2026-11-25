const db = require('./db');

const categories = ['Công việc', 'Học tập', 'Cá nhân', 'Sức khỏe', 'Mua sắm'];
const tasks = [
  ['Hoàn thiện bản đề xuất quý IV', 'Tổng hợp số liệu và gửi bản nháp cho team.', 'high', 'Công việc', 'doing', -1],
  ['Họp với nhóm thiết kế', 'Thống nhất wireframe cho trang chủ mới.', 'medium', 'Công việc', 'done', -2],
  ['Gửi hóa đơn cho khách hàng An Bình', 'Kiểm tra lại thông tin thanh toán trước khi gửi.', 'high', 'Công việc', 'todo', 0],
  ['Cập nhật tài liệu onboarding', 'Bổ sung hướng dẫn cho thành viên mới.', 'low', 'Công việc', 'todo', 2],
  ['Lên kế hoạch nội dung tháng 12', 'Chốt chủ đề và lịch đăng bài với team.', 'medium', 'Công việc', 'doing', 1],
  ['Ôn chương 5 môn Marketing', 'Đọc lại slide và ghi chú các mô hình chính.', 'medium', 'Học tập', 'todo', 0],
  ['Nộp bài tập lớn', 'Kiểm tra định dạng và trích dẫn trước khi nộp.', 'high', 'Học tập', 'doing', 1],
  ['Học 20 từ vựng tiếng Anh', 'Ôn theo chủ đề giao tiếp công sở.', 'low', 'Học tập', 'done', -3],
  ['Đăng ký lớp học UX', 'Tìm hiểu lịch học cuối tuần và học phí.', 'medium', 'Học tập', 'todo', 4],
  ['Đọc 30 trang sách', 'Tiếp tục cuốn sách đang đọc dở.', 'low', 'Cá nhân', 'todo', 0],
  ['Gọi điện hỏi thăm bố mẹ', 'Gọi sau bữa tối, khoảng 20 phút.', 'medium', 'Cá nhân', 'done', -1],
  ['Dọn góc làm việc', 'Sắp xếp lại dây sạc và giấy tờ.', 'low', 'Cá nhân', 'todo', 3],
  ['Đặt lịch khám răng', 'Tìm khung giờ phù hợp vào cuối tuần.', 'high', 'Sức khỏe', 'todo', 2],
  ['Đi bộ 30 phút', 'Đi dạo quanh công viên sau giờ làm.', 'medium', 'Sức khỏe', 'done', -1],
  ['Chuẩn bị bữa trưa lành mạnh', 'Mua rau xanh và ức gà cho tuần này.', 'low', 'Sức khỏe', 'doing', 0],
  ['Mua nước giặt và giấy ăn', 'Kiểm tra đồ dùng trong nhà trước khi đi siêu thị.', 'medium', 'Mua sắm', 'todo', 1],
  ['Đổi bóng đèn phòng khách', 'Mua bóng đèn ánh sáng vàng.', 'low', 'Mua sắm', 'todo', 5],
  ['Thanh toán tiền điện', 'Hạn thanh toán vào ngày 28 hàng tháng.', 'high', 'Cá nhân', 'todo', 0],
  ['Rà soát ngân sách cá nhân', 'Cập nhật các khoản chi trong tuần.', 'medium', 'Cá nhân', 'done', -4],
  ['Chuẩn bị slide thuyết trình', 'Chỉnh lại biểu đồ và phần kết luận.', 'high', 'Học tập', 'doing', -2],
  ['Phản hồi email đối tác', 'Trả lời về thời gian bàn giao dự kiến.', 'medium', 'Công việc', 'todo', -3],
  ['Tập yoga buổi sáng', 'Thử bài tập giãn cơ 20 phút.', 'low', 'Sức khỏe', 'done', -5],
  ['Mua quà sinh nhật cho Linh', 'Chọn một cuốn sách hoặc cây để bàn.', 'medium', 'Mua sắm', 'todo', 6],
  ['Sao lưu ảnh điện thoại', 'Chuyển ảnh cũ lên ổ lưu trữ.', 'low', 'Cá nhân', 'todo', 7],
  ['Hoàn thành bài nghe tiếng Anh', 'Làm bài nghe số 12 trong ứng dụng.', 'medium', 'Học tập', 'todo', -6],
  ['Chốt báo cáo tuần', 'Tổng hợp tiến độ và các vướng mắc.', 'high', 'Công việc', 'done', -1],
  ['Kiểm tra lịch tiêm nhắc lại', 'Xem lại sổ sức khỏe cá nhân.', 'low', 'Sức khỏe', 'todo', -7],
  ['Mua cà phê và yến mạch', 'Bổ sung đồ ăn sáng cho tuần mới.', 'low', 'Mua sắm', 'done', -2],
  ['Viết nhật ký cuối ngày', 'Ghi lại một điều vui trong hôm nay.', 'low', 'Cá nhân', 'todo', 0],
  ['Chuẩn bị họp sprint', 'Đọc trước ticket và cập nhật tiến độ.', 'high', 'Công việc', 'doing', 0],
  ['Ôn từ vựng bài 8', 'Ôn flashcard trong 15 phút.', 'low', 'Học tập', 'done', -8],
  ['Đặt mua giá đỡ laptop', 'Chọn loại có thể điều chỉnh độ cao.', 'medium', 'Mua sắm', 'todo', 3],
  ['Tập gym buổi tối', 'Lịch tập thân trên, khoảng 45 phút.', 'medium', 'Sức khỏe', 'todo', -2],
  ['Gửi lời cảm ơn sau buổi phỏng vấn', 'Viết email ngắn gọn và chân thành.', 'high', 'Công việc', 'done', -6],
  ['Sắp xếp tủ quần áo', 'Phân loại quần áo cần giặt và cần cho tặng.', 'low', 'Cá nhân', 'todo', 2],
  ['Làm bài kiểm tra thử', 'Canh giờ 45 phút như bài thi thật.', 'high', 'Học tập', 'todo', -1],
  ['Mua trái cây cho cả tuần', 'Chọn táo, chuối và cam.', 'medium', 'Mua sắm', 'doing', 0],
  ['Thiền 10 phút trước khi ngủ', 'Tắt thông báo và thư giãn.', 'low', 'Sức khỏe', 'todo', 1],
  ['Cập nhật portfolio cá nhân', 'Thêm dự án mới và chỉnh phần giới thiệu.', 'medium', 'Công việc', 'todo', 5],
  ['Kiểm tra hạn đăng ký khóa học', 'Xác nhận ưu đãi kết thúc trong tuần này.', 'high', 'Học tập', 'todo', 4]
];

function seedDatabase() {
  const insert = db.prepare(`
    INSERT INTO tasks
      (title, description, due_date, due_time, priority, category, status, completed_at, created_at, updated_at)
    VALUES
      (@title, @description, @due_date, @due_time, @priority, @category, @status, @completed_at, @created_at, @updated_at)
  `);
  const insertAll = db.transaction(() => {
    db.prepare('DELETE FROM tasks').run();
    const now = new Date();
    for (const [index, item] of tasks.entries()) {
      const [title, description, priority, category, status, dayOffset] = item;
      const due = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
      const dueDate = [
        due.getFullYear(),
        String(due.getMonth() + 1).padStart(2, '0'),
        String(due.getDate()).padStart(2, '0')
      ].join('-');
      const created = new Date(now.getTime() - (index % 14) * 86400000);
      const createdAt = created.toISOString().slice(0, 19).replace('T', ' ');
      insert.run({
        title,
        description,
        due_date: dueDate,
        due_time: index % 4 === 0 ? null : `${String(8 + (index % 9)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`,
        priority,
        category: categories.includes(category) ? category : 'Cá nhân',
        status,
        completed_at: status === 'done' ? created.toISOString() : null,
        created_at: createdAt,
        updated_at: createdAt
      });
    }
  });
  insertAll();
}

if (require.main === module) {
  seedDatabase();
  console.log(`Đã tạo ${tasks.length} công việc mẫu.`);
  db.close();
}

module.exports = { seedDatabase };
