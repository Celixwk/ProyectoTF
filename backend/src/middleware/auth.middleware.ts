import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const verificarToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ success: false, error: 'No se proporcionó token de autenticación' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro');
        // @ts-ignore
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
    }
};

export const esAdmin = (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const user = req.user;

    if (!user) {
        return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const role = user.role || user.tipo_usuario;

    if (role !== 'administrador' && role !== 'Administrador') {
        return res.status(403).json({ success: false, error: 'Acceso denegado. Se requiere perfil de Administrador.' });
    }

    next();
};
