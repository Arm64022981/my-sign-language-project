import { config } from 'dotenv';
config(); // โหลดไฟล์ .env

export const DATABASE_USERNAME = process.env.DATABASE_USERNAME || 'username';
export const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD || 'password';
export const DATABASE_HOST = process.env.DATABASE_HOST || 'localhost';
export const DATABASE_PORT = process.env.DATABASE_PORT || '5432';
export const DATABASE_TYPE = process.env.DATABASE_TYPE || 'postgres';
export const DATABASE_NAME = process.env.DATABASE_NAME || 'mydatabase';
