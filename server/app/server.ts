import { Application } from '@app/app';
import * as http from 'http';
import { AddressInfo } from 'net';
import { Service } from 'typedi';
import { ImageCacheService } from './services/cache/image-cache.service';
import { MongoConnectionService } from './services/database/mongo.connection.service';
import { TransactionReconciliationService } from './services/transaction/transaction.reconciliation.service';

function getDefaultPort(): string {
    if (process.env.PORT) {
        return process.env.PORT;
    }

    return '3000';
}

@Service()
export class Server {
    private static readonly appPort: string | number | boolean = Server.normalizePort(getDefaultPort());
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    private static readonly baseDix: number = 10;
    private server: http.Server;

    constructor(
        private readonly application: Application,
        private readonly mongoConnection: MongoConnectionService,
        private readonly reconciliationService: TransactionReconciliationService,
        private readonly imageCacheService: ImageCacheService,
    ) {}

    private static normalizePort(val: number | string): number | string | boolean {
        const port: number = typeof val === 'string' ? parseInt(val, this.baseDix) : val;
        return isNaN(port) ? val : port >= 0 ? port : false;
    }
    async init(): Promise<void> {
        await this.mongoConnection.connect();
        await this.imageCacheService.initialize();

        this.application.app.set('port', Server.appPort);

        this.server = http.createServer(this.application.app);

        this.setupGracefulShutdown();

        this.server.listen(Server.appPort);
        this.server.on('error', (error: NodeJS.ErrnoException) => this.onError(error));
        this.server.on('listening', () => {
            this.onListening();
            this.reconciliationService.start(5);
        });
    }

    private setupGracefulShutdown(): void {
        const shutdown = async (signal: string) => {
            console.log(`\n🛑 Signal ${signal} recu, arret en cours...`);

            this.server.close();
            this.reconciliationService.stop();

            console.log('✅ Arret propre termine');
            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }

    private onError(error: NodeJS.ErrnoException): void {
        if (error.syscall !== 'listen') {
            throw error;
        }
        const bind: string = typeof Server.appPort === 'string' ? 'Pipe ' + Server.appPort : 'Port ' + Server.appPort;
        switch (error.code) {
            case 'EACCES':
                // eslint-disable-next-line no-console
                console.error(`${bind} requires elevated privileges`);
                process.exit(1);
                break;
            case 'EADDRINUSE':
                // eslint-disable-next-line no-console
                console.error(`${bind} is already in use`);
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    private onListening(): void {
        const addr = this.server.address() as AddressInfo;
        const port = addr.port;
        const isProduction = process.env.NODE_ENV === 'production';
        const isDocker = process.env.DOCKER === 'true' || !!process.env.DOCKER_CONTAINER;

        // eslint-disable-next-line no-console
        console.log(`\n🚀 Server Configuration:`);
        console.log(`   Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
        console.log(`   Docker: ${isDocker ? 'YES' : 'NO'}`);
        console.log(`   Port: ${port}`);
        console.log(`   URL: http://localhost:${port}/api`);
        console.log(`   Docs: http://localhost:${port}/api/docs\n`);
    }
}
