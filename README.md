# Fondation François Meye - Site Web et API

Site web de la Fondation François Meye avec système de dons, adhésions et boutique en ligne intégré avec le paiement Singpay.

## Architecture

```
FFME/
├── client/          # Frontend Angular
├── server/          # Backend Express + MongoDB
└── common/          # Interfaces et enums partagés
```

## Technologies

| Composant | Technologies |
|-----------|--------------|
| **Frontend** | Angular 17+, TypeScript, SCSS |
| **Backend** | Node.js, Express, TypeScript, TypeDI |
| **Base de données** | MongoDB, Mongoose |
| **Paiement** | Singpay Gateway |
| **Email** | Service de mail intégré |

## Installation

### Prérequis

- Node.js 18+
- MongoDB
- pnpm

### Installation de pnpm

```bash
# Via npm (méthode recommandée)
npm install -g pnpm

# Via Homebrew (macOS)
brew install pnpm

# Via script d'installation (Linux/macOS)
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Via PowerShell (Windows)
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

Vérifier l'installation :
```bash
pnpm --version
```

### Installation des dépendances

```bash
# Client
cd client
pnpm install

# Serveur
cd server
pnpm install
```

### Configuration

Créer un fichier `.env` à la racine du projet :

```env
JWT_SECRET=your-secret-key
DB_URL=mongodb://localhost:27017/ffme
MONGO_URI=mongodb://localhost:27017/ffme
MAIL_API_KEY=your-mail-api-key
FTP_HOST=xxx
FTP_PORT=22
FTP_USER=xxx
FTP_PASSWORD=xxx
UPLOADS_DIR=./uploads
SMTP_HOST=xxx
SMTP_PORT=465
SMTP_USER=xxx
SMTP_PASS=xxx

# Stockage images local (galerie, actualités, produits)
UPLOADS_DIR=./uploads
SINGPAY_CLIENT_ID=xxx
SINGPAY_CLIENT_SECRET=xxx
SINGPAY_WALLET_ID=xxx
SINGPAY_DISBURSEMENT_ID=xxx
```

## Lancement

### Mode développement (sans Docker)

```bash
# Terminal 1 - Backend
cd server
pnpm start
# Serveur disponible sur http://localhost:3000

# Terminal 2 - Frontend
cd client
pnpm start
# Site disponible sur http://localhost:4200
```

### Mode développement (avec Docker)

```bash
docker-compose -f docker-compose.dev.yml up -d --build
```

| Service | URL |
|---------|-----|
| API Backend | http://localhost:5001 |
| Swagger Docs | http://localhost:5001/api/docs |
| MongoDB | localhost:27017 |
| Mongo Express (UI BDD) | http://localhost:8081 |

### Mode production (Docker)

```bash
docker-compose up -d --build
```

| Service | URL |
|---------|-----|
| Client (Angular) | http://localhost:4200 |
| API Backend | http://localhost:5000 |

### Commandes Docker utiles

```bash
# Logs en temps réel (tous les services)
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f server
docker-compose logs -f client

# État des conteneurs
docker-compose ps

# Arrêter tous les services
docker-compose down

# Arrêter + supprimer volumes (reset BDD)
docker-compose down -v

# Reconstruire un service spécifique
docker-compose up -d --build server
docker-compose up -d --build client

# Entrer dans un conteneur
docker exec -it ffme-server sh
docker exec -it ffme-mongodb mongosh
```

### Prérequis Docker

```bash
# Vérifier que Docker est installé
docker --version
docker-compose --version

# Installer Docker (macOS)
brew install --cask docker

# Installer Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh
```

## Fonctionnalités principales

### Dons
- Formulaire de don avec montants prédéfinis ou personnalisés
- Paiement via Singpay ou RIB
- Email de confirmation automatique

### Adhésions
- Formulaire d'adhésion avec upload de documents
- Paiement via Singpay ou autres méthodes
- Validation admin requise

### Boutique
- Catalogue de produits
- Panier et commandes
- Paiement intégré

### Administration
- Dashboard avec statistiques
- Gestion des membres, dons et commandes
- Suivi des transactions en temps réel

## Système de paiement Singpay

### Flux de paiement

```
1. Utilisateur remplit formulaire
2. Redirection vers portail Singpay
3. Paiement effectué
4. Singpay redirige vers page succès/échec
5. Vérification du paiement via API
6. Finalisation (création en BDD + email)
```

### Webhooks

URL webhook à configurer dans Singpay :
```
Production : https://api.fondationfrancoismeye.ga/api/webhook/singpay
Local      : http://localhost:3000/api/webhook/singpay
```

### Service de réconciliation

Au démarrage du serveur, un service vérifie automatiquement les transactions en attente toutes les 5 minutes pour garantir qu'aucun paiement n'est perdu.

## API Endpoints

### Public

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/donation` | Créer un don |
| POST | `/api/donation/:id/singpay` | Initier paiement Singpay |
| GET | `/api/donation/payment/verify/:ref` | Vérifier paiement |
| POST | `/api/membership` | Créer une adhésion |
| POST | `/api/membership/:id/payment` | Initier paiement |
| GET | `/api/membership/payment/verify/:ref` | Vérifier paiement |

### Webhooks

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/webhook/singpay` | Réception webhook Singpay |
| GET | `/api/webhook/stats` | Statistiques transactions |
| GET | `/api/webhook/transactions` | Liste transactions |
| POST | `/api/webhook/reconcile` | Forcer réconciliation (admin) |

### Admin (authentification requise)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/admin/login` | Connexion admin |
| GET | `/api/admin/stats` | Statistiques dashboard |
| GET | `/api/admin/members` | Liste des membres |
| GET | `/api/admin/donations` | Liste des dons |
| PATCH | `/api/admin/member/:id/status` | Modifier statut membre |
| PATCH | `/api/admin/donation/:id/status` | Modifier statut don |

### Exemples de requêtes curl

```bash
# Vérifier que l'API est en ligne
curl http://localhost:3000/api/health

# Connexion admin (récupérer le token)
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "your-password"}'

# Récupérer les statistiques (avec token)
curl http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Liste des membres (avec token)
curl http://localhost:3000/api/admin/members \
  -H "Authorization: Bearer YOUR_TOKEN"

# Liste des dons (avec token)
curl http://localhost:3000/api/admin/donations \
  -H "Authorization: Bearer YOUR_TOKEN"

# Statistiques des transactions
curl http://localhost:3000/api/webhook/stats

# Forcer la réconciliation des paiements (admin)
curl -X POST http://localhost:3000/api/webhook/reconcile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Structure des données

### Transaction

```typescript
interface Transaction {
    id: string;
    type: 'donation' | 'membership' | 'product';
    entityId: string;
    reference: string;
    amount: number;
    status: 'initiated' | 'pending' | 'completed' | 'failed' | 'timeout';
    paymentMethod: 'SINGPay' | 'RIB' | 'Paiement sur place';
    payerFirstName: string;
    payerLastName: string;
    payerPhone: string;
    payerEmail: string;
    singpayTransactionId?: string;
    singpayStatus?: string;
    initiatedAt: string;
    completedAt?: string;
}
```

### Donation

```typescript
interface Donation {
    idDonation: string;
    projectMotivation: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    amount: number;
    isPaid: 'Completed' | 'Waiting' | 'Failure';
    paymentMethod: 'SINGPay' | 'RIB';
    registrationDate: string;
}
```

### Member

```typescript
interface Member {
    idMember: string;
    typeMember: 'Individuel' | 'Association' | 'Entreprise';
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    amount: number;
    paymentStatus: 'Completed' | 'Waiting' | 'Failure';
    paymentMethod: 'SINGPay' | 'RIB' | 'Paiement sur place';
    isValidated: boolean;
    additionalDocuments: Document[];
    registrationDate: string;
}
```

## Accès Administration

### Compte admin par défaut

L'accès à l'interface d'administration se fait via `/admin/login`.

Les identifiants admin sont configurés dans le backend. Pour les modifier, voir le fichier de configuration du serveur.

### Interface admin

| Page | Route | Description |
|------|-------|-------------|
| Connexion | `/admin/login` | Page de connexion |
| Dashboard | `/admin/dashboard` | Statistiques générales |
| Membres | `/admin/members` | Gestion des adhésions |
| Dons | `/admin/donations` | Gestion des dons |
| Actualités | `/admin/news` | Gestion des articles |
| Galerie | `/admin/gallery` | Gestion des photos |
| Produits | `/admin/products` | Gestion de la boutique |

## Déploiement

### Production

```bash
# Build client
cd client
pnpm run build

# Build serveur
cd server
pnpm run build
```

### Variables d'environnement production

```env
NODE_ENV=production
PORT=3000
DB_URL=mongodb://...
HOST_CLIENT_URL=https://fondationfrancoismeye.ga/
HOST_SERVER_URL=https://api.fondationfrancoismeye.ga/
```

## Documentation technique

Voir [DOCUMENTATION.md](./DOCUMENTATION.md) pour la documentation technique complète.

## Mémoire du projet

Voir [CLAUDE.md](./CLAUDE.md) pour l'historique des développements et les notes techniques.

## Licence

Projet privé - Fondation François Meye
