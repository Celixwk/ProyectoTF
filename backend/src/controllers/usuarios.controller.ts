import { Request, Response } from 'express';
import prisma from '../prisma/cliente';
import bcrypt from 'bcryptjs';

export const usuariosController = {
  // Obtener todos los usuarios
  listar: async (req: Request, res: Response) => {
    try {
      const usuarios = await prisma.usuario.findMany({
        select: {
          id_usuario: true,
          usuario: true,
          tipo_usuario: true,
          nombre_completo: true,
          estado: true,
          fecha_creacion: true,
          id_empleado: true,
          created_at: true,
        },
        orderBy: { nombre_completo: 'asc' },
      });
      res.json(usuarios);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener un usuario por ID
  obtenerPorId: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const usuario = await prisma.usuario.findUnique({
        where: { id_usuario: parseInt(id) },
        select: {
          id_usuario: true,
          usuario: true,
          tipo_usuario: true,
          nombre_completo: true,
          estado: true,
        },
      });

      if (!usuario) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }
      res.json(usuario);
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Crear un nuevo usuario
  crear: async (req: Request, res: Response): Promise<void> => {
    try {
      const { usuario, contrasenia, tipo_usuario, nombre_completo, estado, id_empleado } = req.body;

      // Verificar si el usuario ya existe
      const existeUsuario = await prisma.usuario.findUnique({
        where: { usuario },
      });
      if (existeUsuario) {
        res.status(400).json({ error: 'El nombre de usuario ya está registrado' });
        return;
      }

      // Encriptar contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(contrasenia, salt);

      const nuevoUsuario = await prisma.usuario.create({
        data: {
          usuario,
          contrasenia: hashedPassword,
          tipo_usuario,
          nombre_completo,
          estado: estado || 'Activo',
          id_empleado: id_empleado || null,
        },
        select: {
          id_usuario: true,
          usuario: true,
          tipo_usuario: true,
          nombre_completo: true,
          estado: true,
        },
      });

      res.status(201).json(nuevoUsuario);
    } catch (error) {
      console.error('Error al crear usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor al crear usuario' });
    }
  },

  // Actualizar un usuario
  actualizar: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { usuario, contrasenia, tipo_usuario, nombre_completo, estado, id_empleado } = req.body;

      // Verificar si existe antes de actualizar
      const usuarioActual = await prisma.usuario.findUnique({
        where: { id_usuario: parseInt(id) },
      });

      if (!usuarioActual) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      // Validar choque de nombre de usuario
      if (usuario && usuario !== usuarioActual.usuario) {
        const existeNombre = await prisma.usuario.findUnique({
          where: { usuario },
        });
        if (existeNombre) {
          res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
          return;
        }
      }

      const dataToUpdate: any = {
        usuario,
        tipo_usuario,
        nombre_completo,
        estado,
        id_empleado: id_empleado || null,
      };

      // Solo actualizar contraseña si se provee una nueva
      if (contrasenia && contrasenia.trim() !== '') {
        const salt = await bcrypt.genSalt(10);
        dataToUpdate.contrasenia = await bcrypt.hash(contrasenia, salt);
      }

      const usuarioActualizado = await prisma.usuario.update({
        where: { id_usuario: parseInt(id) },
        data: dataToUpdate,
        select: {
          id_usuario: true,
          usuario: true,
          tipo_usuario: true,
          nombre_completo: true,
          estado: true,
        },
      });

      res.json(usuarioActualizado);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Eliminar usuario
  eliminar: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const usuarioActual = await prisma.usuario.findUnique({
        where: { id_usuario: parseInt(id) },
      });

      if (!usuarioActual) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      // Evitar que el admin principal se elimine por accidente si es el ID 1
      if (parseInt(id) === 1 || usuarioActual.usuario === 'admin') {
        res.status(403).json({ error: 'No se puede eliminar el usuario administrador principal' });
        return;
      }

      await prisma.usuario.delete({
        where: { id_usuario: parseInt(id) },
      });

      res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor al eliminar usuario' });
    }
  },
};
