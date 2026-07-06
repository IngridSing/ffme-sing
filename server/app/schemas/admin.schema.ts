import { z } from 'zod';

export const adminLoginSchema = z.object({
    email: z.string().email({ message: 'Email invalide' }),
    password: z.string().min(6, { message: 'Mot de passe invalide' }),
});
