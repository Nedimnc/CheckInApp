-- database.sql

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('student', 'tutor')) NOT NULL,
    panther_id VARCHAR(20)
);

CREATE TABLE sessions (
    session_id SERIAL PRIMARY KEY,
    tutor_id INT REFERENCES users(user_id),
    student_id INT REFERENCES users(user_id),
    title VARCHAR(100),
    subject VARCHAR(50),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'open'
);

CREATE TABLE attendance (
    attendance_id SERIAL PRIMARY KEY,
    session_id INT REFERENCES sessions(session_id),
    student_id INT REFERENCES users(user_id),
    check_in_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    check_in_status VARCHAR(20) DEFAULT 'present'
);