# Backend Phase 1

Phase 1 trong task được triển khai dưới dạng backend foundation tối thiểu:

- NestJS entry point cơ bản
- TypeORM datasource cho PostgreSQL
- Migration tạo toàn bộ schema Phase 1
- Docker Compose cho PostgreSQL (`pgvector`) và Redis

## Chạy local

```bash
cd backend
cp .env.example .env
docker compose up -d
npm install
npm run migration:run
npm run start:dev
```

Health check:

```bash
curl http://localhost:3000/api/health
```

## Ghi chú

- Tiền được lưu bằng `BIGINT` theo đơn vị đồng.
- Các bảng có `updated_at` dùng trigger để tự cập nhật timestamp.
- `transactions` là bảng ledger bất biến theo định hướng domain. Việc xóa transaction không nên được expose ở tầng ứng dụng.
