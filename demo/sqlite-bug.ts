import { Database } from "bun:sqlite";

const db = new Database(":memory:");

db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)");

// Discord-style snowflake ID — exceeds Number.MAX_SAFE_INTEGER (2^53 - 1)
const snowflakeId = 9007199254740993n; // MAX_SAFE_INTEGER + 2

db.exec(`INSERT INTO users VALUES (${snowflakeId}, 'Alice')`);

const row = db.query("SELECT id, name FROM users WHERE name = 'Alice'").get() as any;

console.log("Stored ID: ", snowflakeId.toString());
console.log("Retrieved: ", row.id);
console.log("Match:     ", BigInt(row.id) === snowflakeId);
