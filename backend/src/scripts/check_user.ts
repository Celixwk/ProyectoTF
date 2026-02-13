import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
    try {
        const user = await prisma.usuario.findFirst({
            where: { usuario: 'admin' }
        });

        if (user) {
            console.log('User admin exists:', user);
        } else {
            console.log('User admin does NOT exist. Creating default admin...');

            await prisma.usuario.create({
                data: {
                    usuario: 'admin',
                    contrasenia: 'admin123', // In real app hash this
                    tipo_usuario: 'Administrador',
                    nombre_completo: 'Administrador del Sistema',
                    estado: 'Activo'
                    // id_empleado is optional, leaving it null for system admin
                }
            });
            console.log('Created system admin user.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
