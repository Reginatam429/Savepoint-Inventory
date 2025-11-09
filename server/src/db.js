import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

console.log("DATABASE_URL:", process.env.DATABASE_URL); 

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // for heroku postgres in prod:
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});
