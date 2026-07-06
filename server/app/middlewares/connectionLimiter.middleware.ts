import { NextFunction, Request, Response } from 'express';

let activeConnections = 0;
const MAX_CONNECTIONS = 150;

export const connectionLimiter = (req: Request, res: Response, next: NextFunction) => {
    if (activeConnections >= MAX_CONNECTIONS) {
        console.warn(`Limite atteinte (${MAX_CONNECTIONS} connexions actives). IP refusée : ${req.ip}`);
        return res.status(503).json({ message: 'Serveur saturé. Veuillez réessayer plus tard.' });
    }

    activeConnections++;
    res.on('close', () => {
        activeConnections--;
    });

    return next();
};
