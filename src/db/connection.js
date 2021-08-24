import pg from "pg";
// pools will use environment variables
// for connection information
const { Pool } = pg;

const sslConfig =
  process.env.NODE_ENV !== "development"
    ? {
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {};

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...sslConfig,
});

export default db;
