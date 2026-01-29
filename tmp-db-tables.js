/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config({ path: "./.env" });

const { Client } = require("pg");
const raw = process.env.DATABASE_URL || "";
const conn = raw.replace("postgresql://", "postgres://");
async function main() {
  if (!raw) {
    console.error("No DATABASE_URL env");
    process.exit(1);
  }
  const client = new Client({
    connectionString: conn,
    ssl: { rejectUnauthorized: true },
  });
  await client.connect();
  const { rows } = await client.query(
    "select table_name from information_schema.tables where table_schema='public' order by table_name",
  );
  console.log(rows.map((r) => r.table_name));
  await client.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
