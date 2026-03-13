# GitHub Copilot Instructions — Stationery World

## Project Overview
**Stationery World** is a full-stack e-commerce web application for a stationery store.

- **Frontend**: React 19 + Vite + React Router v7 + Recharts (in `frontend/`)
- **Backend**: Node.js + Express 4 + Prisma ORM + PostgreSQL (in `backend/`)
- **Auth**: JWT (7-day tokens), bcrypt password hashing, role-based access (CUSTOMER / ADMIN)

---

## Repository Layout

```
stationery-world/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Prisma schema (PostgreSQL)
│   │   ├── client.js          # Prisma client singleton
│   │   ├── seed.js            # Database seeder
│   │   └── migrations/        # SQL migration history
│   └── src/
│       ├── app.js             # Express app entry point (port 5000)
│       └── modules/
│           ├── user/          # Auth: signup, login, profile, JWT middleware
│           ├── product/       # Product CRUD + inventory
│           ├── order/         # Orders (SELF / CUSTOMER / ADMIN types)
│           └── uploads/       # Multer file upload
└── frontend/
    └── src/
        ├── components/        # Shared layout: AdminLayout, Topbar, Sidebar, CustomerLayout
        ├── pages/
        │   ├── admin/         # Dashboard, Reports, Inventory, Orders, Users
        │   └── customer/      # Login, Signup, Cart, Wishlist, You (account)
        ├── mocks/             # Mock data for dev (?mock=true query param)
        ├── routes/            # AppRoutes.jsx (React Router)
        └── utils/             # reportExport (CSV/PDF)
```

---

## Conventions

### Backend
- **CommonJS** modules (`require` / `module.exports`) — do NOT use ES module `import/export`
- All controllers follow the pattern: `async (req, res) => { try { … } catch (error) { console.error(…); return res.status(500).json(…); } }`
- Responses always use `{ success: boolean, message: string, data?: any }` shape
- Auth: `authMiddleware` attaches `req.user`; `adminMiddleware` guards admin-only routes
- Database access only through the Prisma client singleton: `require('../../../prisma/client')`
- Environment variables loaded via `dotenv` in `src/app.js`

### Frontend
- **ES modules** with JSX (`.jsx` files)
- No TypeScript — plain JavaScript throughout
- Styling via plain CSS files co-located with components (no CSS-in-JS or Tailwind)
- API calls use the native `fetch` API (no Axios)
- Mock mode enabled with `?mock=true` query string — useful during local dev without a backend
- Recharts for all charts (BarChart, PieChart)
- React Router v7 for routing

### Database models (key ones)
- `User` — CUSTOMER or ADMIN role, optional `monthlyLimit Float`
- `Product` — categories: STATIONERY | BOOKS | TOYS
- `Order` — types: SELF | CUSTOMER | ADMIN; statuses: PENDING → PROCESSING → SHIPPED → DELIVERED | CANCELLED
- `ProfitLedger` — auto-created when order moves to DELIVERED
- `OrderAudit` — audit trail for every status change

---

## Dev URLs
| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5173 |
| Backend (Express) | http://localhost:5000 |
| Prisma Studio | http://localhost:5555 |

The Vite dev server proxies `/api/*` → `http://localhost:5000` (see `vite.config.js`), so frontend fetch calls to `/api/…` hit the backend automatically.

---

## Common Tasks

### Add a new backend endpoint
1. Add controller function in the relevant `*.controller.js`
2. Register the route in the corresponding `*.routes.js`
3. If a new DB field is needed, update `prisma/schema.prisma` and create a migration SQL file under `prisma/migrations/<timestamp>_<name>/migration.sql`

### Add a new admin page
1. Create the page component in `frontend/src/pages/admin/`
2. Add the route in `frontend/src/routes/AppRoutes.jsx` under the `/admin` parent
3. Add a sidebar link in `frontend/src/components/Sidebar.jsx`

### Add a new customer page
1. Create the page component in `frontend/src/pages/customer/`
2. Register in `AppRoutes.jsx`
3. Add a nav link in `frontend/src/components/CustomerSidebar.jsx`

---

## Security Notes
- Never commit real secrets — `.env` is git-ignored
- Always validate and sanitize user input before DB writes
- Use Prisma parameterised queries (never raw string interpolation in SQL)
- JWT secret must be changed in production
