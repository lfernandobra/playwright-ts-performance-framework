const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const { ulid } = require("ulid");
const { faker } = require("@faker-js/faker");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Configure database connection
const pool = new Pool({
  user: process.env.DB_USER || "dba",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "ShortDB",
  password: process.env.DB_PASS || "dba",
  port: Number(process.env.DB_PORT) || 5432,
});

async function cleanupTestData(domain = "lfernandobra.dev") {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const query = `
      WITH users_to_delete AS (
        SELECT id FROM users WHERE email LIKE $1 OR email LIKE '%@qa.dev.com'
      ),
      delete_links AS (
        DELETE FROM links
        WHERE user_id IN (SELECT id FROM users_to_delete)
           OR user_id NOT IN (SELECT id FROM users)
           OR user_id IS NULL
      )
      DELETE FROM users
      WHERE id IN (SELECT id FROM users_to_delete);
    `;

    await client.query(query, [`%@${domain}`]);
    await client.query("COMMIT");
    console.log("✅ Test users and associated links removed successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error removing test data:", err);
    throw err;
  } finally {
    client.release();
  }
}

async function insertTestUsers(
  totalUsers = 4000,
  batchSize = 500,
  domain = "lfernandobra.dev",
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const plainPassword = "pwd123";
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const csvRows = [];

    for (let i = 0; i < totalUsers; i += batchSize) {
      const users = [];

      for (let j = i; j < i + batchSize && j < totalUsers; j++) {
        const id = ulid();
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const name = `${firstName} ${lastName}`;

        // Ensure unique email addresses
        const email = faker.internet
          .email({ firstName, lastName, provider: domain })
          .toLowerCase()
          .replace(/[^a-z0-9@.]/g, "")
          .replace(`@${domain}`, `${j}@${domain}`);

        users.push([id, name, email, passwordHash]);
        csvRows.push(`"${name}","${email}","${plainPassword}"`);
      }

      const query = `
        INSERT INTO users (id, name, email, password)
        VALUES ${users
          .map(
            (_, idx) =>
              `($${idx * 4 + 1}, $${idx * 4 + 2}, $${idx * 4 + 3}, $${idx * 4 + 4})`,
          )
          .join(", ")}
      `;
      const values = users.flat();
      await client.query(query, values);
    }

    await client.query("COMMIT");
    console.log(`✅ ${totalUsers} test users inserted successfully in batches.`);

    // Generate CSV for load testing scenarios
    const csvContent = "name,email,password\n" + csvRows.join("\n");
    const targetDir = path.resolve(__dirname, "../../../performance/data");
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const csvPath = path.join(targetDir, "usuarios.csv");
    fs.writeFileSync(csvPath, csvContent);
    console.log(`✅ CSV generated at: ${csvPath}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error inserting test users:", err);
    throw err;
  } finally {
    client.release();
  }
}

// Main execution entry point
async function main() {
  await cleanupTestData();
  await insertTestUsers(2000);
  await pool.end();
}

module.exports = { cleanupTestData, insertTestUsers, main };

// Run if called directly via CLI
if (require.main === module) {
  const command = process.argv[2];

  (async () => {
    try {
      if (command === "cleanup" || command === "clean") {
        await cleanupTestData();
      } else if (command === "seed" || command === "insert") {
        const count = Number(process.argv[3]) || 2000;
        await insertTestUsers(count);
      } else {
        await main();
      }
    } catch (err) {
      process.exitCode = 1;
    } finally {
      await pool.end();
    }
  })();
}
