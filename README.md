# CheckIn

A mobile attendance and check-in system for Georgia State University students and tutors

## Prerequisites
All of these are required:
- **Node.js**
- **npm**
- **Docker** (for running the database)
- **Expo Go** app (on your phone)
## Installation & Setup

1. Clone the repository
```bash
    git clone https://github.com/Nedimnc/CheckInApp
    cd CheckInApp
```
2. Backend Setup
- Install dependencies:
```bash
  cd backend && npm install
```
- Create a file called `.env` in the `backend` folder with the following contents (file is ignored by Git):
```bash
  PORT = 3000
  DATABASE_URL = postgres://admin:password@localhost:5432/checkin_db
```
3. Mobile Setup
- Install dependencies:
```bash
  cd ../mobile && npm install
```
- Create a copy of the `config.example.js` file in the `mobile` folder, set your IPV4 address, and rename it to `config.js`

## Deployment
1. Start the PostgreSQL container while in the `CheckInApp` folder
```bash
  docker-compose up
```
2. Start the app while in the `mobile` folder in a new terminal:
```bash
  cd mobile
  npx expo start
```
3. Start the backend while in the `backend` folder in a new terminal:
```bash
  cd backend
  npm run dev
```
4. Scan the QR code in the `mobile` terminal with your phone and open with **Expo Go**
- To stop the processes, use `Ctrl + C` in the `mobile` and `backend` terminals and use the following command to view current containers and to close the container
```bash
  docker ps
  docker stop checkin_db_container
```
