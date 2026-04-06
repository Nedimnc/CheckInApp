import bcrypt from 'bcryptjs';
import { pool } from './database.js';

const dropTablesSql = `
  DROP TABLE IF EXISTS attendance CASCADE;
  DROP TABLE IF EXISTS sessions CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
`;

const createTablesSql = `
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
    check_in_status VARCHAR(20) DEFAULT 'present',
    offline_uuid UUID UNIQUE
  );
`;

const seedUsers = async () => {
  const users = [
    {
      name: 'Dev Student',
      email: 'student@gsu.edu',
      password: 'student',
      role: 'student',
      panther_id: 'P00000001',
    },
    {
      name: 'Dev Tutor',
      email: 'tutor@gsu.edu',
      password: 'tutor',
      role: 'tutor',
      panther_id: 'P00000002',
    },
    {
      name: 'Alex Johnson',
      email: 'alex@gsu.edu',
      password: 'password',
      role: 'student',
      panther_id: 'P00000003',
    },
    {
      name: 'Morgan Lee',
      email: 'morgan@gsu.edu',
      password: 'password',
      role: 'tutor',
      panther_id: 'P00000004',
    },
  ];

  const insertSql = `
    INSERT INTO users (name, email, password_hash, role, panther_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING user_id, name, role;
  `;

  const results = [];
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    const result = await pool.query(insertSql, [
      user.name,
      user.email,
      passwordHash,
      user.role,
      user.panther_id,
    ]);
    results.push(result.rows[0]);
  }

  return results;
};

const seedSessions = async (tutorId, studentId) => {
  const now = new Date();
  const oneHour = 60 * 60 * 1000;
  const twoHours = 2 * oneHour;
  const threeHours = 3 * oneHour;

  const sessions = [
    {
      tutor_id: tutorId,
      student_id: null,
      title: 'Intro to CS',
      subject: 'CS',
      start_time: new Date(now.getTime() + oneHour).toISOString(),
      end_time: new Date(now.getTime() + twoHours).toISOString(),
      location: 'Library Room 101',
      status: 'open',
    },
    {
      tutor_id: tutorId,
      student_id: studentId,
      title: 'Calculus I Review',
      subject: 'Math',
      start_time: new Date(now.getTime() + twoHours).toISOString(),
      end_time: new Date(now.getTime() + threeHours).toISOString(),
      location: 'Science Hall 2B',
      status: 'booked',
    },
  ];

  const insertSql = `
    INSERT INTO sessions (tutor_id, student_id, title, subject, start_time, end_time, location, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
  `;

  for (const session of sessions) {
    await pool.query(insertSql, [
      session.tutor_id,
      session.student_id,
      session.title,
      session.subject,
      session.start_time,
      session.end_time,
      session.location,
      session.status,
    ]);
  }
};

const main = async () => {
  try {
    await pool.query('BEGIN');
    await pool.query(dropTablesSql);
    await pool.query(createTablesSql);

    const users = await seedUsers();
    const tutor = users.find((user) => user.role === 'tutor');
    const student = users.find((user) => user.role === 'student');

    if (tutor && student) {
      await seedSessions(tutor.user_id, student.user_id);
    }

    await pool.query('COMMIT');
    console.log('Database reset and seeded successfully.');
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Database reset failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

main();
