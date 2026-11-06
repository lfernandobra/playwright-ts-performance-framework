const { cleanupTestData } = require("./playwright/support/services/database");

module.exports = async () => {
  console.log("[Global Setup] Sanitizing test data prior to test execution...");
  await cleanupTestData();
  console.log("[Global Setup] Database cleanup completed successfully.");
};
