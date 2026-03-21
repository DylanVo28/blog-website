# Backend Phase 9

Backend hiện đã có deployment stack cơ bản cho Phase 9:

- NestJS production image bằng multi-stage Docker build
- Docker Compose chạy đủ `api`, PostgreSQL (`pgvector`), Redis và MinIO
- API tự chạy migrations trước khi start container
- Health check tại `/api/health`

## Chạy bằng Docker

```bash
cd backend
cp .env.example .env
docker compose up --build -d
```

Kiểm tra trạng thái:

```bash
docker compose ps
docker compose logs -f api
curl http://localhost:3000/api/health
```

Tắt stack:

```bash
docker compose down
```

Xóa luôn volumes:

```bash
docker compose down -v
```

## Chạy local không dùng Docker cho API

```bash
cd backend
cp .env.example .env
docker compose up -d postgres redis minio
npm install
npm run migration:run
npm run start:dev
```

## Ghi chú

- `docker compose up --build -d` sẽ build image mới và tự apply migrations từ `dist/database/migrations/*.js`.
- Trong compose, API dùng host nội bộ `postgres` và `redis`; khi chạy local ngoài Docker có thể giữ `localhost` trong `.env`.
- Tiền được lưu bằng `BIGINT` theo đơn vị đồng và mọi giao dịch nên tiếp tục đi qua transaction log.

## SMTP / Email

Backend đã có `MailService` dùng SMTP qua `nodemailer`. Để bật email forgot/reset password, hãy cấu hình các biến sau trong `backend/.env`:

```bash
FRONTEND_URL=http://localhost:3001
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-user
SMTP_PASS=your-password
SMTP_FROM_NAME=Inkline
SMTP_FROM_EMAIL=no-reply@example.com
SMTP_REQUIRE_TLS=false
SMTP_IGNORE_TLS=false
```

Nếu chưa cấu hình SMTP, backend sẽ bỏ qua việc gửi mail và vẫn trả dev token khi chạy ngoài production để bạn test flow reset password.
