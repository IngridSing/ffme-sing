import rateLimit from 'express-rate-limit';

export const imageRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 40, // 40 requêtes max / minute par IP
    message: {
        message: 'Trop de requêtes. Veuillez réessayer dans une minute.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
