# BrewLite (khoảng 1: task 1 đến 3)

Ứng dụng đặt cà phê không dùng tiền mặt, bài tập môn Công nghệ phần mềm, Đại học Sài Gòn (2026–2027).

Công nghệ: **Next.js 14** (frontend), **NestJS 10** (backend), **PostgreSQL + Prisma**, Docker Compose.

Bản này là phần đầu của Assignment 1. Các tính năng sau (chi tiết món, giỏ hàng, đăng nhập, thanh toán, đơn hàng) được thêm ở các phần tiếp theo.

## Đã làm trong phần này

| Task | Nội dung | Trạng thái |
| ---- | -------- | ---------- |
| 1 | Khởi tạo monorepo, README, Git, `.env.example` | Xong |
| 2 | API `GET /products`, `GET /products/:id` | Xong |
| 3 | Trang menu: lưới sản phẩm, lọc theo danh mục, trạng thái loading, trống, lỗi | Xong |
| 4 | Chi tiết sản phẩm, chọn size và topping | Mới có logic tính giá, chưa có trang |

## Cấu trúc thư mục

```
apps/
├── backend/            NestJS, API tại http://localhost:4000/api
│   ├── src/modules/    mỗi tính năng một thư mục (hiện dùng: products)
│   ├── src/common/     phần dùng chung: decorator, filter, guard
│   ├── prisma/         schema, migration, seed
│   └── test/           test e2e
└── frontend/           Next.js (App Router), http://localhost:3000
    └── src/
        ├── app/        route: trang chủ, menu
        ├── components/ thành phần giao diện
        └── lib/        API client, tính giá, tiện ích
docs/scrum/             kế hoạch sprint, Definition of Done
docker/                 khởi tạo database test
docker-compose.yml
.env.example
```

Quy ước: route đặt trong `app/`, thành phần giao diện trong `components/`, mã nghiệp vụ của một tính năng trong `modules/` (backend).

## Chạy trên máy

Cần Node.js 20 trở lên và Docker.

```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
docker compose up -d db
npm run install:all
cd apps/backend && npx prisma migrate dev && npm run prisma:seed && cd ../..
npm run dev:backend      # http://localhost:4000/api
npm run dev:frontend     # http://localhost:3000
```

Frontend gọi API theo biến `NEXT_PUBLIC_API_URL` (mặc định `http://localhost:4000/api`). Đặt lại biến này trong `apps/frontend/.env.local` nếu backend chạy ở nơi khác.

## Cơ sở dữ liệu

Hai database nằm cùng một container Postgres:

| Biến | Database | Dùng cho |
| ---- | -------- | -------- |
| `DATABASE_URL` | `brewlite` | server dev, `prisma migrate`, seed |
| `DATABASE_URL_TEST` | `brewlite_test` | chỉ test e2e |

`brewlite_test` được tạo bởi `docker/postgres/init/01-create-test-db.sql` khi volume được tạo lần đầu. Nếu volume đã có từ trước, tạo tay một lần:

```bash
docker compose exec db psql -U brewlite -d brewlite -c "CREATE DATABASE brewlite_test OWNER brewlite;"
```

Xóa sạch dữ liệu dev: `cd apps/backend && npx prisma migrate reset`.

## Kiểm thử

```bash
cd apps/backend
npm test            # test đơn vị, không cần database
npm run test:e2e    # cần container db, tự migrate và seed brewlite_test
npm run build

cd ../frontend
npm test            # test đơn vị (vitest)
npm run build
```

## API

| Method | Đường dẫn | Mô tả |
| ------ | --------- | ----- |
| GET | `/api/products` | Danh sách sản phẩm. Lọc tùy chọn `?category=coffee\|tea\|pastry` (giá trị khác trả 400) |
| GET | `/api/products/:id` | Một sản phẩm, 404 nếu không có |

Ảnh menu lấy từ Unsplash, nguồn ghi trong [CREDITS.md](apps/frontend/public/images/menu/CREDITS.md).

## Chạy bằng Docker

```bash
cp .env.example .env
docker compose up --build
```

## Giao diện

Màu, font và token nằm trong `apps/frontend/src/app/globals.css` và `tailwind.config.ts` (Playfair Display + DM Sans, tông nâu espresso, hổ phách, kem).

## Quy trình Git

Mỗi task một nhánh (ví dụ `feat/task-02-products-api`), commit nhỏ bằng tiếng Việt theo dạng `feat:`, `fix:`, `docs:`, `chore:`, và được thành viên khác review trước khi merge vào `main`.
