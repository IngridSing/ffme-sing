import { JWT_SECRET } from '@app/env';
import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ message: 'Token manquant' });
        return;
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            res.status(403).json({ message: 'Token invalide ou expiré' });
            return;
        }

        (req as any).user = user;
        next();
    });
}
