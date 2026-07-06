// src/app/schemas/membership.schema.ts
import { TypeMember } from '@common/enums/type-member';
import { z } from 'zod';

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
];

// Schéma de fichier avec validations backend (basé sur `normalizedFiles`)
const uploadedFileSchema = z.object({
    path: z.string().min(1, 'Chemin requis'),
    originalname: z.string().min(1, 'Nom de fichier requis'),
    mimetype: z.string().refine((type) => ALLOWED_TYPES.includes(type), {
        message: 'Type de fichier invalide (PDF, Word, PNG, JPG uniquement)',
    }),
    size: z.number().max(MAX_FILE_SIZE_MB * 1024 * 1024, {
        message: `Fichier trop volumineux (max. ${MAX_FILE_SIZE_MB} Mo)`,
    }),
});

export const MembershipSchema = z.object({
    typeAdhesion: z.enum([TypeMember.ACTIVE, TypeMember.VOLUNTEER]),
    prenom: z.string().min(1, 'Prénom requis'),
    nom: z.string().min(1, 'Nom requis'),
    numero: z
        .string()
        .min(7, 'Numéro invalide')
        .max(25)
        .regex(/^[\d\s\-\+\(\)]{7,25}$/, 'Numéro invalide'),
    email: z.string().email('Adresse email invalide'),
    consentement: z.boolean().refine((val) => val === true, {
        message: 'Consentement requis',
    }),
    fichiers: z.object({
        cv: uploadedFileSchema,
        photo: uploadedFileSchema,
        id: uploadedFileSchema,
        formulaire: uploadedFileSchema,
    }),
});

export type MembershipData = z.infer<typeof MembershipSchema>;
