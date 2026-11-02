# CaterEase — Catering Management System

A **React + Node.js/Express + MySQL** starter website for an Information Management project, using **MySQL Workbench** to manage the database. **No PHP files or PHP server are needed.**

## What you can do

- **Customer:** register and log in, browse packages loaded from MySQL, submit an event booking, and view booking statuses.
- **Staff:** view customers' bookings and change their status.
- **Admin:** everything staff can do, plus create and show/hide catering packages.
- **Database:** `users`, `admins`, `staff`, `packages`, `bookings`, and `payments` tables. The `payments` table is a **placeholder**; the website does not accept payments.

> This is a local educational starter, not a production application. Booking totals are estimates based on the current package price. No online payments are processed.

## What to install

1. **Node.js 20+** (comes with npm)
2. **MySQL Server 8.0.16+**
3. **MySQL Workbench** (visual interface for MySQL Server)
4. **VS Code** and a web browser

**Important:** MySQL Workbench is not a database server. MySQL Server must be installed and running. You don't need XAMPP or PHP for this project.

## Step 1: Set up MySQL Workbench

1. Open Workbench and connect to your **MySQL Server** instance (usually `localhost:3306`).
2. Select **File → Open SQL Script…**, open `database/schema.sql`, and run it with the lightning ⚡ button. This creates the `catering_management` database and six tables.
3. Open `database/seed.sql` and run it. This adds three sample catering packages.
4. Run this to verify:

```sql
USE catering_management;
SHOW TABLES;
SELECT * FROM packages;
```

You should see `users`, `admins`, `staff`, `packages`, `bookings`, `payments`, and three sample packages.

## Step 2: Start the backend in VS Code

Open the project folder in VS Code, then open a terminal:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edit **`backend/.env`**, especially `DB_PASSWORD` (your MySQL Server password). **Change `JWT_SECRET` to your own random secret string of at least 32 characters.** Don't put secrets in frontend files or push `.env` to GitHub.

```powershell
npm run dev
```

The backend runs at **http://localhost:4000**.

Check **http://localhost:4000/api/health** in your browser. You should see:

```json
{"status":"ok","database":"connected"}
```

If it fails, check your MySQL Server, `backend/.env`, database name, and whether `schema.sql` was run.

## Step 3: Start the frontend

**Keep the backend terminal open.** Open a **second** VS Code terminal from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173**. The homepage loads the three catering packages from MySQL through the Express API.

You don't have to create a `frontend/.env` file if you use ports 4000 and 5173. If those change, copy `frontend/.env.example` to `frontend/.env` and update `VITE_API_URL`; also update backend `FRONTEND_URL`.

## Step 4: Test the full booking flow

1. On the website, select **Create account** and register a customer.
2. From the homepage, click **Book now** on a package.
3. Fill in date, time, guests (meeting the package minimum), and venue.
4. Submit. You should see your request under **My bookings**, initially `pending`.
5. To see what was saved in Workbench:

```sql
SELECT * FROM catering_management.users;
SELECT * FROM catering_management.bookings;
```

## Step 5: Test staff and admin roles

Registration always creates a **customer** account. For testing staff/admin access, first register another account, then use the **backend terminal**:

```powershell
npm run set-role -- staff@example.com staff
npm run set-role -- admin@example.com admin
```

Use the actual email addresses you registered. **Log out and log back in.**

- Staff and admin accounts can open **Operations** and update booking status.
- Admin accounts can also open **Manage packages** and add new packages.
- Only the local CLI script changes roles; customers cannot set their own role in signup.

## Project structure

```text
catering-management-system-react-mysql/
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── ERD.md
├── backend/
│   ├── src/
│   │   ├── db.js
│   │   ├── auth.js
│   │   └── server.js
│   ├── scripts/set-role.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── AuthContext.jsx
│   │   ├── api.js
│   │   └── styles.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## How the pieces communicate

```text
React website (localhost:5173)
          |
          | HTTP requests, JSON
          v
Node.js / Express API (localhost:4000)
          |
          | mysql2 prepared queries
          v
MySQL Server (localhost:3306)
          ^
          |
MySQL Workbench (manage tables, run SQL)
```

**MySQL Workbench manages the database; React does not connect to Workbench directly.** The Node.js backend connects to **MySQL Server** using `mysql2`.

For academic demos, passwords are hashed with bcrypt, API routes are separated by role, and SQL uses placeholders. JWTs are held in browser session storage for this local demo. Before real-world deployment, add secure HTTP-only cookie sessions, CSRF defenses, rate limiting, stronger authorization workflows, audit logs, email verification, password resets, backups, and HTTPS.

## Troubleshooting

- **Backend error `ER_ACCESS_DENIED_ERROR`:** wrong `DB_USER` or `DB_PASSWORD` in `backend/.env`.
- **`ECONNREFUSED 127.0.0.1:3306`:** MySQL Server is not running, or its port is different.
- **`Unknown database 'catering_management'`:** execute `database/schema.sql` in Workbench.
- **Website can't connect to backend:** keep `npm run dev` running in both terminals and check that ports 4000 and 5173 are free.
- **No packages displayed:** execute `database/seed.sql`, then refresh.

## Validation status

The JavaScript backend files were syntax-checked. Running a live end-to-end MySQL test requires your local MySQL Server and its credentials; verify using the `/api/health` endpoint and the booking flow above.
