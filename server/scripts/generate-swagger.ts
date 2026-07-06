/**
 * Script pour générer la spec Swagger au moment du build
 * Utilisé pour la production où les chemins glob peuvent ne pas fonctionner
 */
import fs from 'fs';
import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';

const controllersPath = path.join(__dirname, '..', 'app', 'controllers', '**', '*.ts');

console.log('📚 Génération de la spec Swagger...');
console.log('   Chemin des controllers:', controllersPath);

const swaggerOptions: swaggerJSDoc.Options = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'API Fondation François Meye',
            version: '1.0.0',
            description: 'API REST pour la gestion des dons, adhésions, produits, actualités et galerie photo de la Fondation François Meye.',
        },
        servers: [
            {
                url: '/api',
                description: 'Serveur API',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Token JWT obtenu via /api/admin/login',
                },
            },
        },
    },
    apis: [controllersPath],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions) as { paths?: Record<string, unknown> };

// Vérifier que des endpoints ont été trouvés
const pathCount = Object.keys(swaggerSpec.paths || {}).length;
console.log(`   ${pathCount} endpoints trouvés`);

if (pathCount === 0) {
    console.error('❌ Aucun endpoint trouvé! Vérifiez les annotations @swagger');
    process.exit(1);
}

// Créer le dossier de sortie si nécessaire
const outputDir = path.join(__dirname, '..', 'out');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Écrire la spec
const outputPath = path.join(outputDir, 'swagger.json');
fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));

console.log(`✅ Spec Swagger générée: ${outputPath}`);
