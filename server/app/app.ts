import { HttpException } from '@app/classes/http.exception';
import { DateController } from '@app/controllers/date/date.controller';
import { ExampleController } from '@app/controllers/example/example.controller';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import { StatusCodes } from 'http-status-codes';
import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Service } from 'typedi';
import { AdminController } from './controllers/admin/admin.controller';
import { AdminGalleryController } from './controllers/admin/gallery/admin.gallery.controller';
import { AdminNewsController } from './controllers/admin/news/admin.news.controller';
import { AdminProductController } from './controllers/admin/product/admin.product.controller';
import { AdminVideoController } from './controllers/admin/video/admin.video.controller';
import { DonationController } from './controllers/donation/donation.controller';
import { VideoController } from './controllers/video/video.controller';
import { GalleryController } from './controllers/gallery/gallery.controller';
import { MembershipController } from './controllers/membership/membership.controller';
import { NewsController } from './controllers/news/news.controller';
import { ProductController } from './controllers/product/product.controller';
import { WebhookController } from './controllers/webhook/webhook.controller';

// ========================================
// CONFIGURATION CORS PAR ENVIRONNEMENT
// ========================================

// Detection de l'environnement
const isProduction = process.env.NODE_ENV === 'production';
const isDocker = process.env.DOCKER === 'true' || !!process.env.DOCKER_CONTAINER;
const serverPort = process.env.PORT || '3000';

// ========================================
// ORIGINES TOUJOURS AUTORISEES (BASE)
// ========================================
// Ces origines sont autorisees dans TOUS les environnements
// (local dev, docker dev, production docker)

const allowedOrigins: string[] = [
    // === PRODUCTION (domaines reels) ===
    'https://fondationfrancoismeye.ga',
    'https://www.fondationfrancoismeye.ga',
    'https://api.fondationfrancoismeye.ga',

    // === LOCALHOST (dev local + tests prod) ===
    'http://localhost',
    'http://localhost:80',
    'http://localhost:3000',   // Server local dev
    'http://localhost:4200',   // Client Angular
    'http://localhost:5000',   // Server Docker dev (expose)

    // === 127.0.0.1 (alternative localhost) ===
    'http://127.0.0.1',
    'http://127.0.0.1:80',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4200',
    'http://127.0.0.1:5000',

    // === DOCKER INTERNE ===
    'http://client',
    'http://client:80',
];

// Ajouter CLIENT_URL si defini (fallback supplementaire)
if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL.replace(/\/$/, ''));
}

// Log de la configuration au demarrage
console.log(`🌐 CORS Configuration:`);
console.log(`   Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`   Docker: ${isDocker ? 'YES' : 'NO'}`);
console.log(`   Server Port: ${serverPort}`);
console.log(`   Allowed Origins: ${allowedOrigins.length} origins configured`);

function isOriginAllowed(origin: string | undefined): boolean {
    // Pas d'origine (requetes serveur-serveur, Postman, etc.)
    if (!origin) return true;

    // Verifier dans la liste des origines autorisees
    return allowedOrigins.includes(origin);
}

@Service()
export class Application {
    app: express.Application;
    private readonly internalError: number = StatusCodes.INTERNAL_SERVER_ERROR;
    private readonly swaggerOptions: swaggerJSDoc.Options;

    constructor(
        private readonly exampleController: ExampleController,
        private readonly dateController: DateController,
        private readonly donationController: DonationController,
        private readonly productController: ProductController,
        private readonly membershipController: MembershipController,
        private readonly galleryController: GalleryController,
        private readonly newsController: NewsController,
        private readonly videoController: VideoController,
        private readonly webhookController: WebhookController,

        private readonly adminController: AdminController,
        private readonly adminProductController: AdminProductController,
        private readonly adminGalleryController: AdminGalleryController,
        private readonly adminNewsController: AdminNewsController,
        private readonly adminVideoController: AdminVideoController,
    ) {
        this.app = express();

        // Chemins vers les controllers pour génération runtime (mode dev)
        const controllersPathTs = path.join(__dirname, 'controllers', '**', '*.ts');
        const controllersPathJs = path.join(__dirname, 'controllers', '**', '*.js');

        this.swaggerOptions = {
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
            apis: [controllersPathTs, controllersPathJs],
        };

        this.config();

        this.bindRoutes();
    }

    bindRoutes(): void {
        // Health check endpoint for Docker/Kubernetes
        this.app.get('/api/health', (req, res) => {
            res.status(StatusCodes.OK).json({ status: 'ok', timestamp: new Date().toISOString() });
        });

        // Charger la spec Swagger (pré-générée ou runtime)
        const swaggerSpec = this.loadSwaggerSpec();
        this.app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
        this.app.use('/api/donation', this.donationController.router);
        this.app.use('/api/example', this.exampleController.router);
        this.app.use('/api/product', this.productController.router);
        this.app.use('/api/membership', this.membershipController.router);
        this.app.use('/api/gallery', this.galleryController.router);
        this.app.use('/api/news', this.newsController.router);
        this.app.use('/api/video', this.videoController.router);
        this.app.use('/api/date', this.dateController.router);

        this.app.use('/api/webhook', this.webhookController.router);

        this.app.use('/api/admin', this.adminController.router);
        this.app.use('/api/admin/gallery', this.adminGalleryController.router);
        this.app.use('/api/admin/news', this.adminNewsController.router);
        this.app.use('/api/admin/video', this.adminVideoController.router);
        this.app.use('/api/admin/product', this.adminProductController.router);
        this.app.use('/', (req, res) => {
            res.redirect('/api/docs');
        });
        this.errorHandling();
    }

    private config(): void {
        // CORS
        this.app.use(
            cors({
                origin: (origin, callback) => {
                    if (isOriginAllowed(origin)) {
                        return callback(null, true);
                    }
                    callback(new Error(`CORS: Origin ${origin} not allowed`));
                },
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            }),
        );

        // Desactiver le cache navigateur pour toutes les requetes API
        this.app.use('/api', (req: express.Request, res: express.Response, next: express.NextFunction) => {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('Surrogate-Control', 'no-store');
            next();
        });

        this.app.use(cookieParser());

        // Limites pour les uploads
        this.app.use(express.json({ limit: '100mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '100mb' }));
    }

    private loadSwaggerSpec(): object {
        // En production, utiliser le fichier pré-généré
        // Structure: out/swagger.json, app.js est dans out/server/app/
        const preGeneratedPath = path.join(__dirname, '..', '..', 'swagger.json');

        if (fs.existsSync(preGeneratedPath)) {
            const spec = JSON.parse(fs.readFileSync(preGeneratedPath, 'utf-8'));
            console.log(`📚 Swagger: ${Object.keys(spec.paths || {}).length} endpoints chargés`);
            return spec;
        }

        // En développement sans fichier pré-généré, générer à la volée
        const spec = swaggerJSDoc(this.swaggerOptions);
        const pathCount = Object.keys((spec as { paths?: object }).paths || {}).length;
        console.log(`📚 Swagger: ${pathCount} endpoints générés (runtime)`);
        return spec;
    }

    private errorHandling(): void {
        // 404 - Route non trouvee
        this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            const err: HttpException = new HttpException('Not Found');
            next(err);
        });

        // Gestionnaire d'erreurs global avec CORS
        this.app.use((err: HttpException & { type?: string; code?: string }, req: express.Request, res: express.Response, _next: express.NextFunction): void => {
            // Ajouter headers CORS sur les erreurs
            const origin = req.headers.origin;
            if (origin && isOriginAllowed(origin)) {
                res.setHeader('Access-Control-Allow-Origin', origin);
                res.setHeader('Access-Control-Allow-Credentials', 'true');
            }

            // Erreur de taille (413 Payload Too Large)
            if (err.type === 'entity.too.large' || err.status === 413) {
                res.status(413).json({
                    success: false,
                    error: 'Fichier trop volumineux',
                    message: 'La taille maximale autorisee est de 100 Mo par fichier',
                });
                return;
            }

            // Erreur multer (fichier trop gros)
            if (err.code === 'LIMIT_FILE_SIZE') {
                res.status(413).json({
                    success: false,
                    error: 'Fichier trop volumineux',
                    message: 'La taille maximale autorisee est de 100 Mo par fichier',
                });
                return;
            }

            // Erreur multer (trop de fichiers)
            if (err.code === 'LIMIT_FILE_COUNT') {
                res.status(400).json({
                    success: false,
                    error: 'Trop de fichiers',
                    message: 'Le nombre maximum de fichiers est de 20',
                });
                return;
            }

            // Autres erreurs
            const status = err.status || this.internalError;
            const isDev = this.app.get('env') === 'development';

            res.status(status).json({
                success: false,
                message: err.message,
                error: isDev ? err : {},
            });
        });
    }
}
