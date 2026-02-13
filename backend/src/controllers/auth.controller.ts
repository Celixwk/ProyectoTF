import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/cliente';

export const authController = {
    login: async (req: Request, res: Response) => {
        try {
            const { usuario, contrasenia } = req.body;

            const user = await prisma.usuario.findUnique({
                where: { usuario },
                include: { empleado: { include: { cargo: true } } }
            });

            if (!user) {
                return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
            }

            // In a real production app, passwords should be hashed. 
            // Checking if the stored password matches the provided one directly or via hash
            const isMatch = user.contrasenia === contrasenia || await bcrypt.compare(contrasenia, user.contrasenia);

            if (!isMatch) {
                return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
            }

            if (user.estado !== 'Activo') {
                return res.status(403).json({ success: false, error: 'Usuario inactivo' });
            }

            const token = jwt.sign(
                { id: user.id_usuario, usuario: user.usuario, role: user.tipo_usuario },
                process.env.JWT_SECRET || 'secreto_super_seguro',
                { expiresIn: '8h' }
            );

            // Remove password from response
            const { contrasenia: _, ...usuarioSinPass } = user;

            res.json({
                success: true,
                token,
                usuario: usuarioSinPass
            });

        } catch (error: any) {
            console.error('Login error:', error);
            res.status(500).json({ success: false, error: 'Error en el servidor' });
        }
    },

    perfil: async (req: Request, res: Response) => {
        try {
            // @ts-ignore - Validated by middleware
            const userId = req.user.id;

            const user = await prisma.usuario.findUnique({
                where: { id_usuario: userId },
                include: { empleado: { include: { cargo: true } } }
            });

            if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

            const { contrasenia: _, ...usuarioSinPass } = user;

            res.json({ success: true, data: usuarioSinPass });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};
