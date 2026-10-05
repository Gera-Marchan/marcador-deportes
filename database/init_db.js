const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.log('ℹ️ No se detectó DATABASE_URL. Omitiendo migración remota (usando usuarios_db.json local).');
    return;
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('⚡ Conectado exitosamente a la base de datos PostgreSQL.');

    const sqlPath = path.join(__dirname, 'schema.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf-8');

    await client.query(sqlScript);
    console.log('✅ Tablas (usuarios, patrocinadores, estados_partido) verificadas/creadas correctamente.');

  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
