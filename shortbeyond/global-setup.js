const { cleanupTestData } = require("./playwright/support/services/database");

module.exports = async () => {
  console.log("Limpando os dados de teste antes da execução...");
  await cleanupTestData();
  console.log("Limpesa concluída com sucesso.");
};
