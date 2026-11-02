# TaskFlow

A focused task manager with a React interface and a TypeScript REST API. Add, edit, and organize tasks, with data stored locally in a JSON file—no database setup required.

**React · TypeScript · Vite · Tailwind CSS · Express**

## Features

- Add, edit, complete, delete, and filter tasks; clear completed tasks in one step.
- Browse longer lists with cursor-based pagination and live task counts.
- Use light or dark mode, with the preference saved in the browser.
- Keep tasks in a local file, with serialized writes and atomic file replacement.

## Getting started

Install Node.js 20 or newer, then run:

```sh
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API runs at `http://localhost:5001`. Task data is created automatically at `backend/data/todos.json`; this file is ignored by Git.

```sh
npm run build         # Type-check and build both apps
npm run test:backend  # API, pagination, concurrency, and storage tests
npm run test:frontend # Filtered task interactions and rollback
```

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/todos` | List tasks; accepts `filter`, `limit`, `page`, or `cursor` |
| POST | `/api/todos` | Create a task with `{ "title": "..." }` |
| GET | `/api/todos/:id` | Get one task |
| PUT | `/api/todos/:id` | Update its title or completion status |
| PATCH | `/api/todos/:id/toggle` | Toggle completion |
| DELETE | `/api/todos/:id` | Delete a task |
| DELETE | `/api/todos/completed` | Clear completed tasks |

List responses include tasks, counts, `nextCursor`, and `hasMore`. The default page size is 50; the maximum is 500.

## Sample data

To generate 10,000 sample tasks for trying pagination, run:

```sh
npm run seed --workspace=backend
```

The command refuses to replace an existing data file. To deliberately replace it, use `npm run seed --workspace=backend -- --force`; this deletes the current tasks.

## Project layout

- `frontend/` — React UI and API client
- `backend/` — Express routes, task logic, and file storage
- `shared/` — TypeScript types shared by both apps

This is a local, single-server application. The file lock coordinates requests within one Node.js process; it does not provide multi-process locking, user accounts, or production-grade storage.
