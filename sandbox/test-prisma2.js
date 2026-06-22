const { PrismaClient } = require('../node_modules/@prisma/client');

const db = new PrismaClient();

console.log('Checking if binaryTreeAuditLog property exists on db object:');
console.log('typeof db.binaryTreeAuditLog:', typeof db.binaryTreeAuditLog);
console.log('db.binaryTreeAuditLog:', db.binaryTreeAuditLog);

console.log('\nChecking if binaryTreeAuditLog is a function:');
console.log('typeof db.binaryTreeAuditLog.count:', typeof db.binaryTreeAuditLog?.count);

