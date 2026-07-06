import { HOST } from '@app/env';

// URL de base pour les emails (enlève le slash final si présent)
const getBaseUrl = () => HOST.clientUrl.replace(/\/$/, '');

export function generateDonationConfirmationEmail(prenom: string, montant: number): string {
    const baseUrl = getBaseUrl();
    return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #ffffff; border: 1px solid #ddd;">
    <div style="text-align: center;">
      <img src="${baseUrl}/assets/logo.png" alt="Logo Fondation François Méyé" style="max-width: 180px; margin-bottom: 20px;" />
    </div>
    <h2 style="color: #333;">Merci ${prenom} </h2>
    <p style="font-size: 16px; color: #555;">
      Nous vous remercions chaleureusement pour votre don de <strong>${montant.toLocaleString()} FCFA</strong> à la Fondation François Méyé.
    </p>
    <p style="font-size: 16px; color: #555;">
      Votre contribution soutient activement nos projets en faveur de l'éducation, de la culture et du développement durable au Gabon.
    </p>
    <hr style="margin: 30px 0;" />
    <p style="font-size: 14px; color: #777; text-align: center;">
      Fondation François Méyé - Ensemble pour un avenir meilleur<br />
      Site Web : <a href="${baseUrl}/" style="color: #007BFF;">fondationfrancoismeye.ga</a>
    </p>
  </div>
  `;
}

// export function generatePendingDonationEmail(prenom: string, montant: number): string {
//     return `
//   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #ffffff; border: 1px solid #ddd;">
//     <div style="text-align: center;">
//       <img src="https://fondationfrancoismeye.ga/assets/logo.png" alt="Logo Fondation François Méyé" style="max-width: 180px; margin-bottom: 20px;" />
//     </div>
//     <h2 style="color: #333;">Merci ${prenom}</h2>
//     <p style="font-size: 16px; color: #555;">
//       Nous avons bien reçu l’enregistrement de votre don de <strong>${montant.toLocaleString()} FCFA</strong> à la Fondation François Méyé.
//     </p>
//     <p style="font-size: 16px; color: #555;">
//       Ce don est actuellement enregistré <strong>à titre temporaire</strong> en attendant la validation de votre paiement.
//     </p>
//     <p style="font-size: 16px; color: #555;">
//       Il sera officiellement ajouté à notre base de données dès réception de votre paiement et vérification par notre équipe.
//     </p>
//     <hr style="margin: 30px 0;" />
//     <p style="font-size: 14px; color: #777; text-align: center;">
//       Fondation François Méyé - Ensemble pour un avenir meilleur<br />
//       Site Web : <a href="https://fondationfrancoismeye.ga/" style="color: #007BFF;">www.fondationfrancoismeye.ga</a>
//     </p>
//   </div>
//   `;
// }

export function generatePendingDonationEmail(prenom: string, montant: number): string {
    const baseUrl = getBaseUrl();
    return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #ffffff; border: 1px solid #ddd;">
    <div style="text-align: center;">
      <img src="${baseUrl}/assets/logo.png" alt="Logo Fondation François Méyé" style="max-width: 180px; margin-bottom: 20px;" />
    </div>
    <h2 style="color: #333;">Merci ${prenom}</h2>
    <p style="font-size: 16px; color: #555;">
      Nous avons bien reçu l'enregistrement de votre don de <strong>${montant.toLocaleString()} FCFA</strong> à la Fondation François Méyé.
    </p>
    <p style="font-size: 16px; color: #555;">
      Ce don est actuellement enregistré <strong>à titre temporaire</strong> en attendant la validation de votre paiement par RIB.
    </p>
    <p style="font-size: 16px; color: #555;">
      Il sera officiellement ajouté à notre base de données dès réception de votre paiement et vérification par notre équipe.
    </p>

    <div style="margin: 30px 0; background: #f9f9f9; padding: 20px; border: 1px dashed #ccc; border-radius: 8px;">
      <h3 style="color: #007BFF;">Informations de virement (RIB)</h3>
      <p style="font-size: 15px; color: #333;">
        <strong>Banque :</strong> UBA Gabon<br />
        <strong>Titulaire :</strong> Fondation François Méyé<br />
        <strong>RIB :</strong> GA43001060010730000506410<br />
        <strong>Motif à indiquer :</strong> Don - ${prenom}
      </p>
    </div>

    <hr style="margin: 30px 0;" />
    <p style="font-size: 14px; color: #777; text-align: center;">
      Fondation François Méyé - Ensemble pour un avenir meilleur<br />
      Site Web : <a href="${baseUrl}/" style="color: #007BFF;">fondationfrancoismeye.ga</a>
    </p>
  </div>
  `;
}

export function generateConfirmedDonationEmail(prenom: string, nom: string, montant: number, phone: string): string {
    const baseUrl = getBaseUrl();
    return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #ffffff; border: 1px solid #ddd;">
    <div style="text-align: center;">
      <img src="${baseUrl}/assets/logo.png" alt="Logo Fondation François Méyé" style="max-width: 180px; margin-bottom: 20px;" />
    </div>
    <h2 style="color: #333;">Merci ${prenom}</h2>
    <p style="font-size: 16px; color: #555;">
      Nous vous confirmons la réception de votre don de <strong>${montant.toLocaleString()} FCFA</strong> à la Fondation François Méyé.
    </p>
    <p style="font-size: 16px; color: #555;">
      Votre don a été <strong>validé avec succès</strong> et a bien été ajouté à notre base de données.
    </p>
    <p style="font-size: 16px; color: #555;">
      Toute l'équipe de la Fondation vous remercie chaleureusement pour votre soutien. Votre geste contribue à la réalisation de nos actions pour un avenir meilleur.
    </p>

    <div style="margin: 30px 0; background: #f1fdf4; padding: 20px; border: 1px solid #c6eccf; border-radius: 8px;">
      <h3 style="color: #28a745;">Confirmation de don</h3>
      <p style="font-size: 15px; color: #333;">
        <strong>Prénom :</strong> ${prenom}<br />
        <strong>Nom :</strong> ${nom}<br />
        <strong>Téléphone :</strong> ${phone}<br />
        <strong>Montant :</strong> ${montant.toLocaleString()} FCFA<br />
        <strong>Statut :</strong> Paiement confirmé et don enregistré
      </p>
    </div>

    <hr style="margin: 30px 0;" />
    <p style="font-size: 14px; color: #777; text-align: center;">
      Fondation François Méyé - Ensemble pour un avenir meilleur<br />
      Site Web : <a href="${baseUrl}/" style="color: #007BFF;">fondationfrancoismeye.ga</a>
    </p>
  </div>
  `;
}

export function generateOrderConfirmationEmail(
    prenom: string,
    nom: string,
    montant: number,
    phone: string,
    produits: { title: string; type: string }[],
): string {
    const baseUrl = getBaseUrl();
    const productList = produits
        .map(
            (p) => `
      <li style="margin-bottom: 8px;">
        <strong>${p.title}</strong><br/>
        Type : ${p.type}<br/>
      </li>
    `,
        )
        .join('');

    return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #ffffff; border: 1px solid #ddd;">
    <div style="text-align: center;">
      <img src="${baseUrl}/assets/logo.png" alt="Logo Fondation François Méyé" style="max-width: 180px; margin-bottom: 20px;" />
    </div>
    <h2 style="color: #333;">Commande confirmée</h2>
    <p style="font-size: 16px; color: #555;">
      Merci <strong>${prenom} ${nom}</strong> pour votre commande d'un montant de <strong>${montant.toLocaleString()} FCFA</strong>.
    </p>
    <p style="font-size: 16px; color: #555;">
      Votre numéro de téléphone : <strong>${phone}</strong>
    </p>
    <h3 style="color: #007BFF;">Détails de la commande :</h3>
    <ul style="font-size: 15px; color: #333; padding-left: 20px;">
      ${productList}
    </ul>

    <p style="font-size: 15px; color: #555;">
      Vous recevrez un appel ou un message pour la suite du traitement de votre commande.
    </p>

    <hr style="margin: 30px 0;" />
    <p style="font-size: 14px; color: #777; text-align: center;">
      Fondation François Méyé - Ensemble pour un avenir meilleur<br />
      Site Web : <a href="${baseUrl}/" style="color: #007BFF;">fondationfrancoismeye.ga</a>
    </p>
  </div>
  `;
}
