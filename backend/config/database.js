import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  connectionString: process.env.DATABASE_URL,
};

export const pool = new pg.Pool(config);
