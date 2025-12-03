const { PrismaClient } = require('@prisma/client');

// Configuración de Prisma Client con logging
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
  errorFormat: 'pretty',
});

// Manejo de conexión
prisma.$connect()
  .then(() => {
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
  })
  .catch((error) => {
    console.error('❌ Error al conectar con PostgreSQL:', error);
    process.exit(1);
  });

// Manejo de desconexión al cerrar la aplicación
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  console.log('🔌 Desconectado de PostgreSQL');
});

module.exports = prisma;

