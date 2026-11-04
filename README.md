# CaterEase — Catering Management System

A **React + Laravel (PHP) + MySQL** full-stack application for an Information Management project. It features a modern, responsive Single Page Application (SPA) frontend and a secure REST API backend.

## What you can do

- **Customer:** Register, log in, browse active catering packages, submit an event booking, view booking statuses, and cancel pending requests.
- **Staff:** Access the Operations Center, view customer bookings, update event statuses, and record cash payments.
- **Admin:** Access a real-time dashboard (analytics, recent bookings, upcoming events), manage packages, and create/hide offerings.
- **Database:** `users`, `admins`, `staff`, `packages`, `bookings`, and `payments` tables.

## What to install

1. **PHP 8.3+**
2. **Composer** (PHP package manager)
3. **Node.js 20+** (comes with npm)
4. **MySQL Server 8.0.16+**
5. **MySQL Workbench**
6. **VS Code** and a web browser

## Step 1: Set up the Database

1. Open MySQL Workbench and connect to your **MySQL Server** instance.
2. Select **File → Open SQL Script…**, open `database/schema.sql`, and run it with the lightning ⚡ button.
3. Open `database/seed.sql` and run it to add sample packages.
4. Verify the tables:
```sql
USE catering_management;
SHOW TABLES;