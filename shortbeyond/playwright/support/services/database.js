const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

async function cleanupTestData(domain = "lfernandobra.dev") {
  const query = `                                                                                                
        WITH target_users AS (                                                                                       
          SELECT id                                                                                                  
          FROM users                                                                                                 
          WHERE email ILIKE $1                                                                                       
        ),                                                                                                           
        deleted_links AS (                                                                                           
          DELETE FROM links                                                                                          
          WHERE user_id IN (SELECT id FROM target_users)                                                             
        )                                                                                                            
        DELETE FROM users                                                                                            
        WHERE id IN (SELECT id FROM target_users);                                                                   
      `;

  try {
    const result = await pool.query(query, [`%${domain}%`]);
    console.log(
      `[Database Cleanup] Dados de teste limpos com sucesso! Usuários removidos: ${result.rowCount}`,
    );
    return result;
  } catch (error) {
    console.error(
      "[Database Cleanup] Erro ao executar cleanupTestData:",
      error,
    );
    throw error;
  }
}

async function closeDbPool() {
  await pool.end();
}

module.exports = { cleanupTestData, closeDbPool };

// Se o arquivo for chamado diretamente no terminal: `node playwright/support/services/database.js`
if (require.main === module) {
  cleanupTestData()
    .then(async () => {
      await closeDbPool();
      process.exit(0);
    })
    .catch(async () => {
      await closeDbPool();
      process.exit(1);
    });
}
