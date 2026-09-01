const { insertTestUsers } = require("../playwright/support/services/database");

insertTestUsers()
  .then(() => {
    console.log("Usuários de teste inseridos com sucesso.");
  })
  .catch((err) => {
    console.error("Erro ao inserir usuários de teste:", err);
  })
  .finally(() => {
    process.exit();
  });
