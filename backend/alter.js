const db = require('./src/config/db');

async function run() {
  try {
    const pool = await db.initDb();
    // await pool.query("ALTER TABLE attendance ADD COLUMN time_slot ENUM('08:30-11:00', '11:00-13:30', '13:30-16:00', '16:00-18:00') NOT NULL AFTER date"); // already done maybe?
    await pool.query("ALTER TABLE attendance ADD UNIQUE KEY unique_user_date_slot (user_id, date, time_slot)");
    await pool.query("ALTER TABLE attendance DROP INDEX unique_user_date");
    console.log("Success");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
run();
