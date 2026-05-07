# 🌟 Vibe Learn - Interactive Education Platform

![Vibe Learn](https://img.shields.io/badge/Vibe_Learn-Education_Platform-1c1c1c?style=for-the-badge&logo=react&logoColor=30A138)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![MySQL](https://img.shields.io/badge/mysql-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white)

Vibe Learn is a modern, real-time, interactive education platform built to enhance the learning experience in classrooms and remote environments. It combines **Kahoot-style real-time quizzes** and **Padlet-style collaborative boards** into a unified, premium, dark-themed ("Zümrüt Yeşili") interface.

---

## ✨ Features

### 🎮 Real-Time Quizzes (Kahoot Alternative)
- **Live Participation:** Students join via QR codes or PIN. Real-time sync powered by Socket.io.
- **Bulk Question Import:** Teachers can easily upload questions in `.csv` or `.xlsx` format.
- **Global Time Management:** Apply time limits individually or globally across all questions.
- **Dynamic Leaderboards:** Real-time scoring, streaks, and animated ranking displays.
- **Strict Session Management:** Ensures sessions are valid, questions exist, and handles disconnections gracefully.

### 📌 Collaborative Boards (Padlet Alternative)
- **Real-Time Collaboration:** Multiple users can post, edit, and interact simultaneously.
- **Rich Media Attachments:** Support for images, videos, documents, and web links inside posts.
- **Engaging UI:** A high-density, full-width layout with real-time active participant lists and persistent QR codes.
- **Interactive Elements:** Real-time likes, dynamic animations, and responsive floating cards.

---

## 🎨 Theme & UI

Vibe Learn utilizes a custom **Emerald Green (Zümrüt Yeşili)** design system.
- Deep dark backgrounds (`#1c1c1c`, `#0a0a0a`)
- Vibrant emerald accents (`#30A138`)
- Modern micro-animations, glassmorphism, and responsive design using TailwindCSS.

---

## 🚀 Tech Stack

**Frontend (Client):**
- React + Vite
- TailwindCSS (Styling & Animations)
- Socket.io-client (Real-time events)
- PapaParse & XLSX (Bulk file handling)

**Backend (Server):**
- Node.js & Express.js
- Socket.io (WebSocket Management)
- MySQL2 (Database queries & Connection pooling)
- JWT (Authentication)
- Multer (File uploads)

---

## 🛠️ Installation & Setup

Follow these steps to set up the project locally.

### 1. Clone the Repository
```bash
git clone https://github.com/emreeakdag/web-bitirme.git
cd web-bitirme
```

### 2. Database Setup
Make sure you have MySQL/XAMPP/MAMP running.
Execute the database schema setup script located in the `database` folder, or use the built-in npm command:
```bash
cd server
npm run db:setup
```

### 3. Environment Variables
Inside the `server` directory, create a `.env` file based on the provided `.env.example`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=egitim_platformu
JWT_SECRET=your_super_secret_jwt_key_here
CLIENT_URL=http://localhost:5173
```

### 4. Install Dependencies
Install packages for both the server and the client:
```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 5. Start the Application
You can run the application using `npm run dev` in both directories for development mode with hot-reloading:

**Start Backend (Terminal 1):**
```bash
cd server
npm run dev
```

**Start Frontend (Terminal 2):**
```bash
cd client
npm run dev
```

The platform will now be accessible at `http://localhost:5173`. 
*Note: Due to the `host: true` configuration in Vite, you can access the platform on your phone by entering your local IP address (e.g., `192.168.1.x:5173`).*

---

## 🛡️ Security Note

Since this is a development project, the `.env` file containing sensitive database credentials and JWT secrets is purposefully ignored by Git. Please ensure your actual `.env` is never committed if you transition to production.

---

*Developed by Emre Akdağ for final graduation project.*
