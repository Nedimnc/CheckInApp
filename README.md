# CheckIn

![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-20232A?logo=react&logoColor=61DAFB)

CheckIn is a mobile attendance and check-in system for Georgia State University students and tutors.
It provides a lightweight workflow for creating tutoring sessions, booking appointments, and tracking attendance from a phone.
The backend is a Node.js/Express API with a PostgreSQL database, while the mobile app runs on React Native with Expo for rapid development and on-device testing.

## Prerequisites
All of these are required:
- **Node.js**
- **npm**
- **Docker** (for running the database)
- **Expo Go** app (on your phone)
## Installation & Setup

1. Clone the repository
```bash
    git clone https://github.com/Nedimnc/CheckInApp.git
    cd CheckInApp
```
2. Backend Setup
- Install dependencies:
```bash
  cd backend && npm install
```
- Create a file called `.env` in the `backend` folder with the following contents (file is ignored by Git):
```bash
  PORT=3000
  DATABASE_URL=postgres://admin:password@localhost:5432/checkin_db
  JWT_SECRET=your_super_secret_random_string_here
```
3. Mobile Setup
- Install dependencies:
```bash
  cd ../mobile && npm install
```
- Create a copy of the `config.example.js` file in the `mobile` folder, set your IPV4 address, and rename it to `config.js`

## Local Development
To get the full system running, you'll need three terminal tabs:
1. Database (Docker)
```bash
  docker-compose up
```
2. Backend API:
```bash
  cd mobile
  npx expo start
```
3. Mobile App (Expo):
```bash
  cd backend
  npm run dev
```
4. Scan the QR code in the `mobile` terminal with your phone and open with **Expo Go**. Ensure your phone and computer are on the same Wi-Fi network.
- To stop the processes, use `Ctrl + C` in the `mobile` and `backend` terminals and use the following command to view current containers and to close the container
```bash
  docker ps
  docker stop checkin_db_container
```
