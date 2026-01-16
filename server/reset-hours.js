const { getDatabase } = require('./database');

const db = getDatabase();

console.log('🔄 Zerando todas as horas de estudo...');

db.run('UPDATE study_sessions SET hours = 0, minutes = 0', (err) => {
  if (err) {
    console.error('❌ Erro ao zerar horas:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Todas as horas de estudo foram zeradas com sucesso!');
    db.close((err) => {
      if (err) {
        console.error('Erro ao fechar banco:', err.message);
      }
      process.exit(0);
    });
  }
});
