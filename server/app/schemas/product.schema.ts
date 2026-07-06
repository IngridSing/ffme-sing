import { z } from 'zod';

export const ProductCommandeSchema = z.object({
    prenom: z.string().min(1, 'Prénom requis').max(30),
    nom: z.string().min(1, 'Nom requis').max(30),
    numero: z.string().regex(/^[\d\s\-\+\(\)]{7,25}$/, 'Numéro invalide'),
    email: z.string().email('Email invalide'),
    consentement: z.boolean().refine((val) => val === true, { message: 'Consentement requis' }),
    montant: z.number().int().positive('Le montant doit être supérieur à zéro'),
});

export type ProductCommandeData = z.infer<typeof ProductCommandeSchema>;

export const CommentSchema = z.object({
    username: z.string().min(1, 'Nom requis').max(30),
    content: z.string().min(1, 'Contenu requis').max(250),
    review: z.number().min(1).max(4),
});

export type CommentData = z.infer<typeof CommentSchema>;
