const { insertTestUsers } = require("../playwright/support/services/database");

insertTestUsers()
  .then(() => {
    console.log("[Seeding] Test users seeded successfully into PostgreSQL.");
  })
  .catch((err) => {
    console.error("[Seeding] Error seeding test users:", err);
  })
  .finally(() => {
    process.exit();
  });
