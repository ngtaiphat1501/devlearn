# DevLearn — Nền tảng học lập trình

> Full-stack web app bán & học khóa học lập trình cho cộng đồng.

## Tech Stack

| Layer      | Công nghệ                        |
|------------|----------------------------------|
| Frontend   | Next.js 14 (App Router) + TypeScript |
| Styling    | Tailwind CSS                     |
| State      | Zustand + React Query            |
| Backend    | Node.js + Express + TypeScript   |
| Database   | PostgreSQL + Prisma ORM          |
| Auth       | JWT (access + refresh tokens)    |
| Payment    | VNPay + Stripe                   |
| Upload     | Cloudinary (video/image)         |
| Email      | Nodemailer + Gmail SMTP          |
| Deploy FE  | Vercel                           |
| Deploy BE  | Railway / Render                 |

## Cấu trúc dự án

```
devlearn/
├── frontend/          # Next.js 14
│   └── src/
│       ├── app/       # App Router pages
│       ├── components/
│       ├── lib/       # API client, utils
│       ├── hooks/     # Custom hooks
│       └── types/     # TypeScript types
└── backend/           # Express API
    ├── prisma/        # Schema & migrations
    └── src/
        ├── controllers/
        ├── routes/
        ├── middleware/
        ├── services/
        └── utils/
```

## Cài đặt & Chạy

### 1. Clone & cài dependencies

```bash
git clone <repo>

# Backend
cd devlearn/backend
npm install
cp .env.example .env   # điền biến môi trường

# Frontend
cd ../frontend
npm install
cp .env.example .env.local
```

### 2. Setup database

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 3. Chạy development

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm run dev
```

## Tài khoản mặc định (sau seed)

| Role  | Email                | Password  |
|-------|----------------------|-----------|
| Admin | admin@devlearn.vn    | Admin@123 |
| User  | demo@devlearn.vn     | Demo@123  |

## Biến môi trường quan trọng

Xem file `.env.example` trong mỗi thư mục để biết đầy đủ các biến cần thiết.
