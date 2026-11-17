# Burndown

> Số liệu lấy từ lịch sử git, không phải ghi chép hằng ngày của nhóm. Git chỉ cho biết khi nào commit được tạo,
> không cho biết nhóm chia sprint theo ngày nào. Cột "ngày" dưới đây là ngày commit thật, không phải ngày sprint
> dựng lại. Kế hoạch sprint xem tại [sprint-plan.md](sprint-plan.md).

Đơn vị: story point. Mỗi task trong 10 task được tính 1 point.

## Tổng hợp theo sprint

| Sprint | Mục tiêu | Task | Point kế hoạch | Point hoàn thành | Còn lại |
|---|---|---|---|---|---|
| 1 | Nền tảng và menu | 1-4 | 4 | 4 | 0 |
| 2 | Giỏ hàng, đơn hàng, đăng nhập | 5-7 | 3 | 3 | 0 |
| 3 | Thanh toán, bàn giao, nghiệp vụ backend | 8-10 | 3 | 3 | 0 |
| **Tổng** | | 1-10 | **10** | **10** | **0** |

"Hoàn thành" nghĩa là code của task có trong `main`, build và test chạy thành công. Mục review chéo trong
[definition-of-done.md](definition-of-done.md) được tích riêng sau khi có PR được review.

## Nhật ký theo ngày commit

### Repo làm việc ban đầu (`BrewLite`)

| Ngày | Số commit | Còn lại (point) | Ghi chú |
|---|---|---|---|
| 2026-10-24 | 82 | 0 | Code task 1-10: API, giao diện, test, docker, voucher và điểm thưởng |
| 2026-10-30 | 8 | 0 | Hoàn thiện, sửa lỗi, giao diện (màu, chế độ tối) |
| 2026-11-06 | 2 | 0 | Merge PR #1 và PR #4 (trang menu) |

Tổng 92 commit trong 14 ngày (2026-10-24 đến 2026-11-06).

### Repo bàn giao Assignment 1 (`BrewLite_Assign1`)

| Ngày | Số commit | Ghi chú |
|---|---|---|
| 2026-10-24 | 15 | Phần 1: task 1-3 và logic tính giá, giữ ngày tạo commit gốc |
| 2026-11-17 | 25 | Các thành viên đưa phần 2 và phần 3 vào repo, kèm README và tài liệu |

Repo này được dựng ngày 2026-11-17 từ code đã làm ở repo ban đầu, nên ngày commit của phần sau là ngày đưa vào repo,
không phải ngày viết code.

## Hạn chế của số liệu

- 82/92 commit của repo ban đầu nằm trong một ngày, nên không dựng được đường burndown dốc dần theo từng ngày sprint.
- Phần lớn commit do một tài khoản tạo. Cột "hoàn thành" thể hiện việc đã xong, không thể hiện phân công giữa các thành viên.
- Nếu nhóm có ghi chép sprint riêng (bảng, ảnh chụp board), hãy thay bảng trên bằng số thật của nhóm.
