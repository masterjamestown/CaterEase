require('dotenv').config();
const db = require('../src/db');

async function main() {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  const role = String(process.argv[3] || '').trim().toLowerCase();
  if (!email || !['customer', 'staff', 'admin'].includes(role)) {
    console.error('Usage: npm run set-role -- person@example.com admin|staff|customer');
    process.exitCode = 1;
    return;
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.execute('SELECT user_id FROM users WHERE email = ? FOR UPDATE', [email]);
    if (!users.length) throw new Error('Account not found. Register it from the website first.');
    const userId = users[0].user_id;
    await connection.execute('DELETE FROM admins WHERE user_id = ?', [userId]);
    await connection.execute('DELETE FROM staff WHERE user_id = ?', [userId]);
    await connection.execute('UPDATE users SET role = ? WHERE user_id = ?', [role, userId]);
    if (role === 'admin') await connection.execute('INSERT INTO admins (user_id) VALUES (?)', [userId]);
    if (role === 'staff') await connection.execute('INSERT INTO staff (user_id) VALUES (?)', [userId]);
    await connection.commit();
    console.log(`${email} is now ${role}. Log out and log back in to update the website.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.end());
