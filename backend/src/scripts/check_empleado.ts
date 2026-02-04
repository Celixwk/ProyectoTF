
import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

async function checkEmpleado() {
    const cedula = "900000023";
    const emp = await prisma.empleado.findUnique({
        where: { cedula: cedula }
    });
    console.log("Empleado found by cedula:", emp);

    if (emp) {
        console.log(`ID Internal: ${emp.id_empleado}, Cedula: ${emp.cedula}`);
    } else {
        console.log("Empleado not found by cedula");
    }
}

checkEmpleado();
