const { PrismaClient } = require("@prisma/client");

// initialize PrismaClient
const prisma = new PrismaClient();
module.exports = prisma;
