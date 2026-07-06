import { z } from 'zod';

export const DonationSchema = z.object({
    motif: z.string().min(1, 'Motif requis'),
    prenom: z.string().min(1, 'Prénom requis').max(30, 'Max 30 caractères'),
    nom: z.string().min(1, 'Nom requis').max(30, 'Max 30 caractères'),
    numero: z
        .string()
        .regex(/^[\d\s\-\+\(\)]{7,25}$/, 'Numéro invalide')
        .min(1, 'Numéro requis'),
    email: z.string().email('Email invalide'),
    consentement: z.coerce.boolean().refine((val) => val === true, {
        message: 'Consentement obligatoire',
    }),
    montant: z.number().int().positive('Le montant doit être supérieur à zéro'),
});

export type DonationData = z.infer<typeof DonationSchema>;
