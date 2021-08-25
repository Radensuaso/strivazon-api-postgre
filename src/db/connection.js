import pg from "pg";
// pools will use environment variables
// for connection information
const { Pool } = pg;

const db = new Pool({});

export default db;
