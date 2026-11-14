import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing from your .env file.');
}

const pool = new Pool({ connectionString });

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash('Demo@12345', 12);

    const demoUsers = [
      ['alice@demo.com', 'alice1', 'Alice'],
      ['bob@demo.com', 'bob1', 'Bob'],
      ['charlie@demo.com', 'charlie1', 'Charlie'],
    ];

    const userIds = [];

    // Create demo users
    for (const [email, username, name] of demoUsers) {
      const result = await client.query(
        `INSERT INTO users
          ("email", "username", "name", "passwordHash", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT ("email") DO UPDATE
         SET "username" = EXCLUDED."username",
             "name" = EXCLUDED."name",
             "passwordHash" = EXCLUDED."passwordHash",
             "updatedAt" = NOW()
         RETURNING "id"`,
        [email, username, name, passwordHash]
      );

      userIds.push(result.rows[0].id);
    }

    const [aliceId, bobId, charlieId] = userIds;

    // Find previous demo group
    const existingGroup = await client.query(
      `SELECT "id" FROM groups
       WHERE "name" = $1 AND "createdById" = $2`,
      ['SplitTab Demo Group', aliceId]
    );

    // Delete previous demo group's data
    if (existingGroup.rowCount > 0) {
      const oldGroupId = existingGroup.rows[0].id;

      await client.query(
        `DELETE FROM expense_splits
         WHERE "expenseId" IN (
           SELECT "id" FROM expenses WHERE "groupId" = $1
         )`,
        [oldGroupId]
      );

      await client.query(
        'DELETE FROM expenses WHERE "groupId" = $1',
        [oldGroupId]
      );

      await client.query(
        'DELETE FROM settlement WHERE "groupId" = $1',
        [oldGroupId]
      );

      await client.query(
        'DELETE FROM group_members WHERE "groupId" = $1',
        [oldGroupId]
      );

      await client.query(
        'DELETE FROM groups WHERE "id" = $1',
        [oldGroupId]
      );
    }

    // Create group
    const groupResult = await client.query(
      `INSERT INTO groups
        ("name", "createdAt", "updatedAt", "createdById")
       VALUES ($1, NOW(), NOW(), $2)
       RETURNING "id"`,
      ['SplitTab Demo Group', aliceId]
    );

    const groupId = groupResult.rows[0].id;

    // Add group members
    await client.query(
      `INSERT INTO group_members
        ("groupId", "userId", "role", "joinedAt")
       VALUES
        ($1, $2, 'ADMIN', NOW()),
        ($1, $3, 'MEMBER', NOW()),
        ($1, $4, 'MEMBER', NOW())`,
      [groupId, aliceId, bobId, charlieId]
    );

    // Create first expense
    const expense1 = await client.query(
      `INSERT INTO expenses
        ("groupId", "paidBy", "amount", "description", "createdAt")
       VALUES ($1, $2, 1200, 'Groceries', NOW())
       RETURNING "id"`,
      [groupId, aliceId]
    );

    // Create second expense
    const expense2 = await client.query(
      `INSERT INTO expenses
        ("groupId", "paidBy", "amount", "description", "createdAt")
       VALUES ($1, $2, 600, 'Dinner', NOW())
       RETURNING "id"`,
      [groupId, bobId]
    );

    // Create expense splits
    await client.query(
      `INSERT INTO expense_splits
        ("expenseId", "userId", "amount")
       VALUES
        ($1, $2, 400),
        ($1, $3, 400),
        ($1, $4, 400),
        ($5, $2, 200),
        ($5, $3, 200),
        ($5, $4, 200)`,
      [
        expense1.rows[0].id,
        aliceId,
        bobId,
        charlieId,
        expense2.rows[0].id
      ]
    );

    // Create settlement
    await client.query(
      `INSERT INTO settlement
        ("groupId", "fromUserId", "toUserId", "amount", "createdAt")
       VALUES ($1, $2, $3, 200, NOW())`,
      [groupId, charlieId, aliceId]
    );

    await client.query('COMMIT');

    console.log('Seed completed successfully!');
    console.log('Demo group: SplitTab Demo Group');
    console.log('Password for all demo accounts: Demo@12345');

    for (const [email] of demoUsers) {
      console.log(email);
    }

  } catch (error) {
    await client.query('ROLLBACK');

    console.error('Seed failed. Transaction rolled back.');
    throw error;

  } finally {
    client.release();
  }
}

try {
  await seed();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}