# Backend Phase 9

Backend hiện đã có deployment stack cơ bản cho Phase 9:

- NestJS production image bằng multi-stage Docker build
- Docker Compose chạy `api`, PostgreSQL (`pgvector`) và Redis
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
docker compose up -d postgres redis
npm install
npm run migration:run
npm run start:dev
```

## Ghi chú

- `docker compose up --build -d` sẽ build image mới và tự apply migrations từ `dist/database/migrations/*.js`.
- Trong compose, API dùng host nội bộ `postgres` và `redis`; khi chạy local ngoài Docker có thể giữ `localhost` trong `.env`.
- Upload ảnh mặc định dùng Cloudinary nếu cấu hình đủ biến môi trường; nếu chưa cấu hình thì backend sẽ fallback sang thư mục local `uploads/`.
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

## Payment QR

Repo hiện hỗ trợ song song:

- `momo_qr`: user quét QR MoMo, bấm xác nhận, admin duyệt thủ công.
- `vcb_qr`: user quét VietQR Vietcombank, SePay gửi webhook về backend để auto cộng ví.
- `ocb_qr`: user quét VietQR OCB, SePay gửi webhook về backend để auto cộng ví.

Cấu hình tối thiểu cho `vcb_qr` trong `backend/.env`:

```bash
VCB_QR_BANK_CODE=970436
VCB_QR_BANK_NAME=Vietcombank
VCB_QR_ACCOUNT_NUMBER=0123456789
VCB_QR_ACCOUNT_NAME=NGUYEN VAN A
VCB_QR_TEMPLATE=compact2

OCB_QR_BANK_CODE=970448
OCB_QR_BANK_NAME=OCB
OCB_QR_ACCOUNT_NUMBER=0123456789
OCB_QR_ACCOUNT_NAME=NGUYEN VAN A
OCB_QR_TEMPLATE=compact2

SEPAY_API_KEY=your-sepay-api-key
```

Webhook SePay cần trỏ về:

```bash
POST https://your-domain.com/api/payment/webhook/sepay
```

Backend sẽ đọc API key ở header:

```bash
Authorization: Apikey <SEPAY_API_KEY>
```

Bạn không cần cấu hình Casso nếu chỉ muốn dùng SePay.
