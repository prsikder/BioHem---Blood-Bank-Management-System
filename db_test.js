// db_test.js
const { testConnection } = require('./config/database');

(async () => {
  try {
    await testConnection();
    console.log('✅ Database connection OK. You can proceed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database connection failed. See error above.');
    process.exit(1);
  }
})();
