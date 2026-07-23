import * as dotenv from 'dotenv';
dotenv.config();

// ========================================
// CONFIGURATION AUTOMATIQUE PAR DÉTECTION DE L'ENVIRONNEMENT
// ========================================
// Le serveur détecte automatiquement s'il tourne en dev ou en production
// via NODE_ENV (pas besoin de modifier le code !)

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Configuration PRODUCTION
const PROD_API_DOMAIN = 'https://api.fondationfrancoismeye.ga/';
const PROD_FRONTEND_DOMAIN = 'https://fondationfrancoismeye.ga/';

// Configuration DÉVELOPPEMENT
const DEV_API_DOMAIN = 'http://localhost:3000/';
const DEV_FRONTEND_DOMAIN = 'http://localhost:4200/';

// Log pour débug
if (!IS_PRODUCTION) {
    console.log('🔧 [Server] Mode DÉVELOPPEMENT détecté');
} else {
    console.log('🚀 [Server] Mode PRODUCTION détecté');
}

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET manquant : definissez cette variable d\'environnement avant de demarrer le serveur.');
}
export const JWT_SECRET = process.env.JWT_SECRET;

export const DB_URL = process.env.DB_URL || '';
export const MAIL_API_KEY = process.env.MAIL_API_KEY || '';

export const DATABASE_URL = '';

export const singPayConfig = {
    clientId: process.env.SINGPAY_CLIENT_ID || '',
    clientSecret: process.env.SINGPAY_CLIENT_SECRET || '',
    walletId: process.env.SINGPAY_WALLET_ID || '',
    disbursementId: process.env.SINGPAY_DISBURSEMENT_ID || '',
    // URLs de l'API Singpay (centralisées pour faciliter les modifications)
    apiUrl: process.env.SINGPAY_API_URL || 'https://gateway.singpay.ga/v1/ext',
    transactionsUrl: process.env.SINGPAY_TRANSACTIONS_URL || 'https://gateway.singpay.ga/v1/transaction/api',
};

export const HOST = {
    serverUrl: process.env.SERVER_URL || (IS_PRODUCTION ? PROD_API_DOMAIN : DEV_API_DOMAIN),
    clientUrl: process.env.CLIENT_URL || (IS_PRODUCTION ? PROD_FRONTEND_DOMAIN : DEV_FRONTEND_DOMAIN),
};
