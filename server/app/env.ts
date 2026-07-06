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

export const JWT_SECRET = process.env.JWT_SECRET || 'fallback';

export const DB_URL = process.env.DB_URL || '';
export const MAIL_API_KEY = process.env.MAIL_API_KEY || '';

export const DATABASE_URL = '';

export const singPayConfig = {
    clientId: 'e677f1a8-4033-4595-9193-6c2474d64046',
    clientSecret: '43ea50a5feca0340d241b9b60fbf9365137d5e188a41a91295b37171b4e38b63',
    walletId: '68231f26ac445b3ed889a6fa',
    disbursementId: '682324f8ac445b3cd189a9f2',
    // URLs de l'API Singpay (centralisées pour faciliter les modifications)
    apiUrl: process.env.SINGPAY_API_URL || 'https://gateway.singpay.ga/v1/ext',
    transactionsUrl: process.env.SINGPAY_TRANSACTIONS_URL || 'https://gateway.singpay.ga/v1/transaction/api',
};

export const HOST = {
    serverUrl: process.env.SERVER_URL || (IS_PRODUCTION ? PROD_API_DOMAIN : DEV_API_DOMAIN),
    clientUrl: process.env.CLIENT_URL || (IS_PRODUCTION ? PROD_FRONTEND_DOMAIN : DEV_FRONTEND_DOMAIN),
};
