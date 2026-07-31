# 🎓 Federal University Dutse (FUD) Auction Management System

A real-time, secure, role-based campus auction platform designed to streamline student asset exchanges and institutional asset disposal.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#️-tech-stack)
- [Installation & Local Setup](#-installation--local-setup)
- [Deployment on Render](#-deployment-on-render)
- [API Endpoints](#-api-endpoints)
- [Project Documentation & Guidelines](#-project-documentation--guidelines)
- [Author & License](#-author--license)

---

## 🚀 Overview

The FUD Auction Management System addresses security, transparency, and verification vulnerabilities in campus trading at Federal University Dutse (FUD). By replacing unmonitored messaging channels with a centralized web platform, students and staff can trade hostel gear, textbooks, project hardware, and campus assets securely.

The platform:

- Eliminates **shill bidding** (self-bidding) at the backend level
- Provides **real-time price updates** via WebSockets
- Automates **auction settlement** using background cron jobs
- Generates unique **Exchange Pass Codes** for physical pickup verification
- Includes a capped **5-Admin Overwatch Console** for system administration

---

## ✨ Key Features

### 🔒 Advanced Authentication & Security

- Encrypted passwords using **bcryptjs** (salt factor 10)
- Stateless authentication via **JSON Web Tokens** (jsonwebtoken)
- Frontend password strength indicator (Weak, Medium, Strong)
- Confirm password validation and toggle-eye visibility
- Dedicated password reset recovery flow

### ⚡ Real-Time Bidding Engine

- Instant WebSocket price broadcasts using **Socket.IO**
- Dynamic live countdown timers (HH:MM:SS) on active listings
- Automatic validation ensuring bids are strictly higher than current leading prices
- Programmatic self-bidding block — returns `400 Bad Request` if a seller attempts to bid on their own item

### ⚙️ Automated Settlement & Exchange Pass Codes

- Background task scheduling using **node-cron** checking expired auctions every minute
- Automatic winner determination upon timer expiration
- Automated generation of cryptographic **Exchange Pass Codes** (`FUD-PASS-XXXX`) to verify safe physical handovers on campus

### 🛡️ Capped Admin Overwatch Console

- System stats dashboard (Total Users, Active Admins, Total Auctions, Live Auctions)
- Role management enabling administrators to promote/demote users with a strict **5-Admin maximum** limit
- Direct Virtual Wallet Top-Up modals to fund user balances
- Listing moderation capabilities

### 🔍 Discovery & Activity Alerts

- Keyword/title search bar and category filtering (Academic Books, Electronics, Hostel Appliances, Vehicles, Fashion)
- Activity Notification Center (`notifications.html`) tracking live bid events, outbid alerts, and winning passes

---

## 🛠️ Tech Stack

### Backend

| Technology       | Purpose                          |
|------------------|----------------------------------|
| Node.js          | Runtime                           |
| Express.js       | Framework                         |
| MongoDB Atlas    | Cloud Database                    |
| Mongoose ODM     | Object Data Modeling              |
| Socket.IO        | Real-Time WebSocket Layer         |
| Node-Cron        | Task Scheduler                    |
| jsonwebtoken     | JWT Authentication                |
| bcryptjs         | Password Hashing                  |
| CORS             | Cross-Origin Resource Sharing     |

### Frontend

| Technology           | Purpose                     |
|----------------------|-----------------------------|
| HTML5                | Markup                      |
| CSS3                 | Styling                     |
| Bootstrap 5          | UI Framework                |
| Bootstrap Icons      | Icon Library                |
| JavaScript (ES6+)    | Client-side Logic           |
| Fetch API            | HTTP Requests               |
| Socket.IO Client JS  | Real-Time Client            |

---

## 💻 Installation & Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/LUKMANCODECRAFT/fud-auction-system.git
cd fud-auction-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster0.mongodb.net/fud-auction?retryWrites=true&w=majority
JWT_SECRET=fud_super_secret_jwt_key_2026
```

### 4. Start Development Server

```bash
npm run dev
```

Or:

```bash
npm start
```

Open your browser and navigate to **http://localhost:5000**.

---

## 🌐 Deployment on Render

This project is optimized for deployment on [Render](https://render.com).

1. Connect your GitHub repository (`LUKMANCODECRAFT/fud-auction-system`)
2. Set the following environment details:

   | Setting        | Value            |
   |----------------|------------------|
   | Environment    | Node             |
   | Build Command  | `npm install`    |
   | Start Command  | `node server.js` |

3. Add Environment Variables:
   - `MONGO_URI`
   - `JWT_SECRET`

4. Trigger manual or automatic deployment

---

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint      | Description                     | Access  |
|--------|---------------|---------------------------------|---------|
| POST   | `/register`   | Register new user account       | Public  |
| POST   | `/login`      | Authenticate user & return JWT  | Public  |
| GET    | `/me`         | Fetch authenticated user profile| Private |
| GET/POST | `/seed-admin` | Seed default system admin account | Public |

### Auctions (`/api/auctions`)

| Method | Endpoint | Description                            | Access           |
|--------|----------|----------------------------------------|------------------|
| GET    | `/`      | Retrieve all active auction listings   | Public           |
| GET    | `/:id`   | Retrieve details for a single auction  | Public           |
| POST   | `/`      | Create a new auction listing           | Private (Seller) |
| POST   | `/bid`   | Submit a bid on an active auction      | Private (Bidder) |

### Admin Console (`/api/admin`)

| Method | Endpoint             | Description                              | Access |
|--------|----------------------|------------------------------------------|--------|
| GET    | `/stats`             | Retrieve system operational metrics      | Admin  |
| GET    | `/users`             | Fetch all registered user accounts       | Admin  |
| PUT    | `/users/:id/role`    | Update user role — Max 5 Admins          | Admin  |
| PUT    | `/users/:id/wallet`  | Top up user virtual wallet balance       | Admin  |
| DELETE | `/auctions/:id`      | Moderate/Delete an auction listing       | Admin  |

---

## 📋 Project Documentation & Guidelines

This software project was developed in accordance with the undergraduate research guidelines of the **Department of Software Engineering, Faculty of Computing, Federal University Dutse (FUD)**.

| Detail               | Value                                                |
|----------------------|------------------------------------------------------|
| Degree               | Bachelor of Science (B.Sc.) in Software Engineering  |
| Course Code          | CSE 499 (Research Project)                           |
| Approved Binding Color | Brown                                              |

---

## 👨‍💻 Author & License

| Role         | Name                              |
|--------------|-----------------------------------|
| **Developer**   | Ismail Yerima Lukman (Reg. No: FCP/CSE/22/1086) |
| **Supervisor**  | Buhari Hafizu Auwalu              |
| **Institution** | Federal University Dutse (FUD), Jigawa State, Nigeria |

### License

This project is licensed under the **MIT License**.
