import { HOST, singPayConfig } from '@app/env';
import axios from 'axios';
import { Service } from 'typedi';

export type PaymentType = 'membership' | 'donation' | 'product';

@Service()
export class SingPayService {
    private readonly apiUrl = singPayConfig.apiUrl;
    private readonly transactionsUrl = singPayConfig.transactionsUrl;

    /**
     * Génère une URL de paiement vers le portail Singpay (mode gateway)
     * L'utilisateur est redirigé vers Singpay pour payer
     */
    async initiatePayment(
        reference: string,
        montant: number,
        type: PaymentType = 'membership',
    ): Promise<{ success: boolean; link?: string; message?: string }> {
        // Définir les URLs de redirection selon le type de paiement
        const redirectUrls = {
            membership: {
                success: `${HOST.clientUrl}succes-adhesion/${reference}`,
                error: `${HOST.clientUrl}echec-adhesion/${reference}`,
            },
            donation: {
                success: `${HOST.clientUrl}succes-don/${reference}`,
                error: `${HOST.clientUrl}echec-don/${reference}`,
            },
            product: {
                success: `${HOST.clientUrl}succes-commande/${reference}`,
                error: `${HOST.clientUrl}echec-commande/${reference}`,
            },
        };

        const payload = {
            portefeuille: singPayConfig.walletId,
            reference: reference,
            redirect_success: redirectUrls[type].success,
            redirect_error: redirectUrls[type].error,
            amount: montant,
            disbursement: singPayConfig.disbursementId,
            isTransfer: false,
        };

        const headers = {
            accept: '*/*',
            'x-client-id': singPayConfig.clientId,
            'x-client-secret': singPayConfig.clientSecret,
            'x-wallet': singPayConfig.walletId,
            'Content-Type': 'application/json',
        };

        // Log détaillé de l'initiation du paiement
        console.log('\n' + '═'.repeat(70));
        console.log('💳 INITIATION PAIEMENT SINGPAY');
        console.log('═'.repeat(70));
        console.log(`   Type        : ${type.toUpperCase()}`);
        console.log(`   Référence   : ${reference}`);
        console.log(`   Montant     : ${montant} FCFA`);
        console.log(`   Redirect OK : ${redirectUrls[type].success}`);
        console.log(`   Redirect KO : ${redirectUrls[type].error}`);
        console.log('─'.repeat(70));

        try {
            const response = await axios.post(this.apiUrl, payload, { headers });

            console.log('✅ RÉPONSE SINGPAY:');
            console.log(`   Statut      : Succès`);
            console.log(`   Lien        : ${response.data?.link || 'Non reçu'}`);
            if (response.data?.transactionId) {
                console.log(`   Transaction : ${response.data.transactionId}`);
            }
            console.log('═'.repeat(70) + '\n');

            if (!response.data?.link) {
                console.error('❌ Aucun lien de paiement reçu:', response.data);
                return { success: false, message: 'Aucun lien de paiement reçu de SING Pay.' };
            }

            return { success: true, link: response.data.link };
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Erreur inconnue';
            console.log('❌ ERREUR SINGPAY:');
            console.log(`   Message     : ${message}`);
            if (error.response?.data) {
                console.log(`   Détails     : ${JSON.stringify(error.response.data)}`);
            }
            console.log('═'.repeat(70) + '\n');
            return { success: false, message };
        }
    }

    /**
     * Récupère une transaction par référence pour vérifier son statut
     */
    async getTransactionByReference(
        reference: string,
    ): Promise<{ success: boolean; status?: string; raw?: any; message?: string }> {
        const url = `${this.transactionsUrl}/search/by-reference/${encodeURIComponent(reference)}`;

        const headers = {
            accept: '*/*',
            'x-client-id': singPayConfig.clientId,
            'x-client-secret': singPayConfig.clientSecret,
            'x-wallet': singPayConfig.walletId,
        };

        try {
            const response = await axios.get(url, { headers });

            // Log détaillé de la vérification
            console.log('\n' + '═'.repeat(70));
            console.log('🔍 VÉRIFICATION TRANSACTION SINGPAY');
            console.log('═'.repeat(70));
            console.log(`   Référence   : ${reference}`);
            console.log(`   Statut      : ${response.data?.status || 'inconnu'}`);
            console.log(`   Résultat    : ${response.data?.result || 'N/A'}`);
            if (response.data?.amount) {
                console.log(`   Montant     : ${response.data.amount} FCFA`);
            }
            if (response.data?.paidAt) {
                console.log(`   Payé le     : ${response.data.paidAt}`);
            }
            if (response.data?.transactionId) {
                console.log(`   ID Singpay  : ${response.data.transactionId}`);
            }

            // Emoji selon le statut
            const statusEmoji =
                response.data?.status === 'Disbursement' || response.data?.result === 'Success'
                    ? '✅'
                    : response.data?.result === 'TimeOutError'
                      ? '⏰'
                      : response.data?.result === 'Failed'
                        ? '❌'
                        : '⏳';
            console.log(`   État final  : ${statusEmoji} ${response.data?.status || 'En attente'}`);
            console.log('═'.repeat(70) + '\n');

            return {
                success: true,
                status: response.data?.status || 'inconnu',
                raw: response.data,
            };
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Erreur inconnue';
            console.log('\n' + '═'.repeat(70));
            console.log('❌ ERREUR VÉRIFICATION SINGPAY');
            console.log('═'.repeat(70));
            console.log(`   Référence   : ${reference}`);
            console.log(`   Erreur      : ${message}`);
            console.log('═'.repeat(70) + '\n');
            return {
                success: false,
                message,
            };
        }
    }
}
