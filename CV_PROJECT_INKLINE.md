# Inkline - Project Summary for CV

> Note: this document is written from a `Full-stack Developer` perspective because the repository includes both frontend and backend code. If you only worked on one side, update the `Role` and `Responsibilities` sections accordingly.

## 1. Project Overview

**Project name:** Inkline  
**Project type:** Full-stack blog platform  
**Suggested duration field:** `[Add project duration]`  
**Demo / source:** `[Add link if needed]`

Inkline is a full-stack blogging platform that allows authors to create and publish articles, engage with readers through free comments and paid questions, and track earnings through an internal wallet and author dashboard. The platform also includes an admin panel, real-time notifications, social login, email verification, image upload, QR-based payments, and AI-powered Q&A based on article context.

## 2. Suggested Role

**Full-stack Developer**

## 3. Responsibilities

- Built the frontend with Next.js App Router for the main user flows, including the article feed, article detail pages, author dashboard, wallet, notifications, profile pages, authentication, and admin dashboard.
- Developed REST APIs with NestJS for authentication, users, posts, comments, questions, wallet, payments, notifications, uploads, admin operations, and AI features.
- Designed and implemented the platform monetization flow, including paid questions to authors or AI, transaction logging, internal wallet balance management, deposits, and withdrawals.
- Integrated QR-based payment methods such as MoMo QR and bank VietQR flows, combined with webhook-based confirmation for semi-automated or automated deposit handling.
- Implemented real-time notifications with Socket.IO and background processing with BullMQ + Redis for AI answering, notifications, payment callbacks, content indexing, and refund jobs.
- Designed the data model with PostgreSQL + TypeORM and used `pgvector` to support vector storage and retrieval for AI context lookup.
- Set up development, staging, and production environments, and containerized the backend with Docker and Docker Compose.

## 4. Key Features

- Authentication and user management: email OTP verification, login, refresh token flow, forgot password, password reset, social login, and profile management.
- Content platform: create, edit, and publish posts; rich text editing; article feed; tag/filter support; author profiles; comment section; sitemap, robots, and Open Graph metadata for basic SEO.
- Author dashboard: earnings overview, top-performing posts, pending paid questions, and transaction history.
- Monetization: readers can submit paid questions to either authors or AI; the platform manages wallet balance flow and supports refunds for overdue author questions.
- Wallet and payments: QR-based deposits, transaction history, withdrawal requests, and admin review workflows.
- Admin console: dashboard metrics, deposit and withdrawal review, post management, transaction monitoring, and user ban/unban controls.
- AI Q&A: context-aware question answering based on posts or author documents, including content indexing and retrieval before prompting the AI model.
- Real-time notifications: instant updates for relevant events such as new questions or status changes.

## 5. Technologies

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- TanStack Query
- Zustand
- React Hook Form
- Zod
- TipTap Editor
- Radix UI
- Recharts
- Socket.IO Client
- Axios

### Backend

- NestJS 11
- TypeScript
- TypeORM
- PostgreSQL
- pgvector
- Redis
- BullMQ
- Socket.IO
- JWT / Passport
- Nodemailer
- Cloudinary

### DevOps / Deployment

- Docker
- Docker Compose
- Environment-based configuration for development, staging, and production

## 6. Technical Highlights

- Built a modular full-stack architecture with separate `frontend` and `backend` applications for easier scaling and maintenance.
- Used queue-based background processing for asynchronous tasks such as AI answering, notifications, deposit expiration, and refund handling.
- Designed a structured payment and wallet workflow for deposits, withdrawals, and paid-question transactions to reduce balance inconsistencies.
- Combined retrieval-based context lookup with PostgreSQL/pgvector storage to improve the relevance of AI-generated answers.
- Added technical SEO foundations including `sitemap`, `robots`, and dynamic Open Graph images for site pages and article pages.

## 7. CV-Ready Version

### Short Description

Developed `Inkline`, a full-stack blogging platform with article publishing, commenting, paid Q&A for authors or AI, an internal wallet, QR-based payments, and an admin dashboard. Built the frontend with Next.js/React and the backend with NestJS/PostgreSQL, while integrating real-time notifications, background job processing, and AI retrieval workflows.

### Bullet Points for CV

- Built a full-stack blogging platform with content publishing, commenting, premium Q&A, wallet-based payments, and an admin dashboard.
- Developed the frontend with Next.js, React, TypeScript, Tailwind CSS, TanStack Query, and Zustand for content, authentication, dashboard, and wallet experiences.
- Built modular backend APIs with NestJS, TypeORM, and PostgreSQL for authentication, posts, comments, questions, payments, notifications, and admin operations.
- Implemented real-time notifications with Socket.IO and background job processing with Redis + BullMQ.
- Integrated QR-based payment flows and wallet transaction handling, including deposit confirmation, withdrawal review, and refund scenarios.
- Added an AI Q&A workflow with context retrieval from post and author document data using `pgvector`.

## 8. Optional Customization

You can adjust the following items before adding this project to your CV:

- Change `Role` to `Frontend Developer` or `Backend Developer` if you did not work across the full stack.
- Add `team size`, `project duration`, `demo link`, or `GitHub link` if your CV format includes detailed project information.
- If you want to emphasize backend work, keep the strongest points around payments, wallet logic, queues, notifications, AI, and Docker.
- If you want to emphasize frontend work, focus on Next.js App Router, rich text editing, dashboard UX, authentication flows, and real-time updates.
