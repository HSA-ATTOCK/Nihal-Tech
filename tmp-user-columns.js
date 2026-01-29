/* eslint-disable @typescript-eslint/no-require-imports */
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
    "select column_name, data_type, is_nullable from information_schema.columns where table_schema='public' and table_name='User' order by ordinal_position",
  );
  console.log(rows);
  await client.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
