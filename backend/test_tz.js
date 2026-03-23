const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const empleado = await prisma.empleado.findFirst({
    where: { nombre1: { contains: 'Donaldo' } }
  });
  console.log('Empleado:', empleado.id_empleado, empleado.nombre1, empleado.apellido1);

  const novedades = await prisma.detalleNovedad.findMany({
    where: {
      novedad_empleado: { id_empleado: empleado.id_empleado }
    }
  });
  console.log('Novedades para Donaldo:', novedades.map(n => n.fecha.toISOString()));

  const programacion = await prisma.detalleProgramacion.findMany({
    where: { id_empleado: empleado.id_empleado }
  });
  console.log('Programación dates para Donaldo:', programacion.map(p => p.fecha.toISOString()));
  
  await prisma.$disconnect();
}

check().catch(e => { console.error(e); process.exit(1); });
