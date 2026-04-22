# MTAC — Project Management API

A REST API for managing workspaces, projects, and tasks with role-based access control (RBAC).

Built with **Node.js**, **TypeScript**, **Express 5**, and **MongoDB**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Language | TypeScript |
| Framework | Express 5 |
| Database | MongoDB + Mongoose 9 |
| Validation | Zod |
| Auth | JWT (access + refresh tokens) |
| Testing | Vitest + Supertest + mongodb-memory-server |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)

### Setup

```bash
npm install
```

Create a `.env` file in the project root:

```env
PORT=3000
MONGO_CONNECTION_URL=mongodb://localhost:27017/mtac
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
ALLOWED_ORIGINS=http://localhost:3000
```

### Run

```bash
# Development (with hot reload)
npm run dev

# Seed default permissions (run once)
npm run seed:permissions
```

---

## API Reference

All authenticated routes require:
```
Authorization: Bearer <access_token>
```

### Auth — `/api/auth`

| Method | Path | Description |
|---|---|---|
| POST | `/register` | Register a new user |
| POST | `/login` | Login (rate limited: 10 req / 15 min) |
| POST | `/refresh` | Get a new access token via refresh token |

### User — `/api/user`

| Method | Path | Description |
|---|---|---|
| GET | `/profile` | Get current user profile |
| PATCH | `/profile` | Update name / email |
| PATCH | `/password` | Change password |

### Workspace — `/api/workspace`

| Method | Path | Description |
|---|---|---|
| POST | `/` | Create a workspace |
| GET | `/` | List all workspaces for current user |
| GET | `/:workspace_id` | Get a workspace |
| DELETE | `/:workspace_id` | Delete a workspace (owner only) |

### Workspace Members — `/api/workspace-member/:workspace_id`

| Method | Path | Description |
|---|---|---|
| POST | `/add` | Add a member |
| GET | `/list` | List all members |
| PATCH | `/update` | Update a member's role |
| DELETE | `/remove` | Remove a member |

### Projects — `/api/workspace/:workspace_id/project`

| Method | Path | Description |
|---|---|---|
| POST | `/` | Create a project |
| GET | `/` | List projects (paginated) |
| GET | `/:project_id` | Get a project |
| PATCH | `/:project_id` | Update a project |
| DELETE | `/:project_id` | Delete a project |

### Tasks — `/api/workspace/:workspace_id/project/:project_id/task`

| Method | Path | Description |
|---|---|---|
| POST | `/` | Create a task |
| GET | `/` | List tasks (paginated) |
| GET | `/:task_id` | Get a task |
| PATCH | `/:task_id` | Update a task |
| DELETE | `/:task_id` | Delete a task |
| PATCH | `/:task_id/assign` | Assign a task to a member |

### Roles — `/api/workspace/:workspace_id/role`

| Method | Path | Description |
|---|---|---|
| GET | `/` | List roles and their permissions |
| PATCH | `/:role_id/permissions` | Update a role's permissions |

---

## RBAC

Three default roles are seeded per workspace:

| Role | Level | Key Permissions |
|---|---|---|
| `admin` | 0 | Full access |
| `manager` | 1 | Create/update/delete projects and tasks, assign tasks |
| `member` | 2 | View only |

**Hierarchy rule:** A member can only manage users with a higher level number than themselves (lower-level = more privileged). Admins (level 0) can manage everyone.

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

Tests use an in-memory MongoDB instance — no external database required.

---

## Project Structure

```
src/
├── config/         # env validation, db connection, roles config
├── errors/         # AppError class
├── middlewares/    # auth, workspace, permission, error handling
├── modules/        # feature modules (auth, user, workspace, project, task, role)
│   └── <module>/
│       ├── *.model.ts
│       ├── *.service.ts
│       ├── *.controller.ts
│       ├── *.route.ts
│       └── *.validation.ts
├── routes/         # top-level router
├── tests/          # integration tests
├── types/          # Express type augmentation
└── utils/          # jwt helpers, logger, objectId validation
```
