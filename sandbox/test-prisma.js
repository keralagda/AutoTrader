const { PrismaClient } = require('../node_modules/@prisma/client');

const db = new PrismaClient();

async function main() {
  try {
    console.log('Testing Prisma client connection...');

    // Test basic connection
    await db.$queryRaw`SELECT 1`;
    console.log('✓ Database connection successful');

    // Test if we can access the User model
    const userCount = await db.user.count();
    console.log(`✓ User model accessible. Found ${userCount} users.`);

    // Test if we can access the binaryTreeAuditLog model
    try {
      const auditCount = await db.binaryTreeAuditLog.count();
      console.log(`✓ BinaryTreeAuditLog model accessible. Found ${auditCount} audit log entries.`);
    } catch (auditError) {
      console.error('✗ Error accessing BinaryTreeAuditLog model:', auditError.message);
    }

    // List all available models on the db object
    console.log('\nAvailable model properties on db object:');
    try {
      const modelKeys = Object.keys(db).filter(key =>
        key !== '$connect' &&
        key !== '$disconnect' &&
        key !== '$on' &&
        key !== '$once' &&
        key !== '$use' &&
        key !== '$transaction' &&
        key !== '$extends' &&
        typeof db[key] === 'object' &&
        db[key] !== null &&
        db[key].constructor.name === 'PrismaPromise'
      );
      console.log(modelKeys.sort().join(', '));
    } catch (modelError) {
      console.error('Error listing models:', modelError.message);
    }

    console.log('\n=== Test completed ===');
  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    await db.$disconnect();
  }
}

main();
