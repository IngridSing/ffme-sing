import SFTP from 'ssh2-sftp-client';
import { Service } from 'typedi';

interface PooledConnection {
    sftp: InstanceType<typeof SFTP>;
    inUse: boolean;
    createdAt: Date;
    lastUsed: Date;
    isValid: boolean;
}

@Service()
export class SftpPoolService {
    private pool: PooledConnection[] = [];
    private readonly maxPoolSize = 5;
    private readonly connectionTimeout = 60000; // 60 secondes au lieu de 30
    private readonly maxConnectionAge = 5 * 60 * 1000;
    private readonly maxRetries = 5;

    private async createConnection(): Promise<InstanceType<typeof SFTP>> {
        const sftp = new SFTP();

        // Listener pour gérer les erreurs globales et éviter les crashes
        sftp.on('error', (err: Error) => {
            console.error('SFTP connection error:', err.message);
        });

        sftp.on('close', () => {
            // Marquer la connexion comme invalide si elle se ferme
            const pooledConn = this.pool.find((c) => c.sftp === sftp);
            if (pooledConn) {
                pooledConn.isValid = false;
            }
        });

        await sftp.connect({
            host: process.env.FTP_HOST,
            port: Number(process.env.FTP_PORT) || 22,
            username: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD,
            readyTimeout: this.connectionTimeout,
            retries: this.maxRetries,
            retry_factor: 2,
            retry_minTimeout: 3000,
            // Ignorer la vérification de clé d'hôte (nécessaire dans Docker)
            hostVerifier: () => true,
            // Options SSH2 pour améliorer la stabilité
            algorithms: {
                kex: [
                    'ecdh-sha2-nistp256',
                    'ecdh-sha2-nistp384',
                    'ecdh-sha2-nistp521',
                    'diffie-hellman-group-exchange-sha256',
                    'diffie-hellman-group14-sha256',
                    'diffie-hellman-group14-sha1',
                ],
                cipher: [
                    'aes128-ctr',
                    'aes192-ctr',
                    'aes256-ctr',
                    'aes128-gcm@openssh.com',
                    'aes256-gcm@openssh.com',
                ],
                hmac: ['hmac-sha2-256', 'hmac-sha2-512', 'hmac-sha1'],
            },
            keepaliveInterval: 10000, // Ping toutes les 10 secondes
            keepaliveCountMax: 3, // 3 pings sans réponse = déconnexion
        });
        return sftp;
    }

    async acquire(): Promise<InstanceType<typeof SFTP>> {
        this.cleanupStaleConnections();

        // Chercher une connexion disponible et valide
        const availableConnection = this.pool.find((conn) => !conn.inUse && conn.isValid);

        if (availableConnection) {
            // Vérifier que la connexion est toujours fonctionnelle
            try {
                await availableConnection.sftp.cwd();
                availableConnection.inUse = true;
                availableConnection.lastUsed = new Date();
                return availableConnection.sftp;
            } catch {
                // Connexion morte, la supprimer et en créer une nouvelle
                console.log('Connexion SFTP invalide détectée, création d\'une nouvelle...');
                availableConnection.isValid = false;
                this.removeConnection(availableConnection);
            }
        }

        if (this.pool.length < this.maxPoolSize) {
            return this.createNewPooledConnection();
        }

        // Attendre qu'une connexion se libère
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = this.connectionTimeout / 100;

            const checkInterval = setInterval(async () => {
                attempts++;
                const available = this.pool.find((conn) => !conn.inUse && conn.isValid);

                if (available) {
                    clearInterval(checkInterval);
                    try {
                        await available.sftp.cwd();
                        available.inUse = true;
                        available.lastUsed = new Date();
                        resolve(available.sftp);
                    } catch {
                        available.isValid = false;
                        this.removeConnection(available);
                        // Essayer de créer une nouvelle connexion
                        try {
                            const sftp = await this.createNewPooledConnection();
                            resolve(sftp);
                        } catch (err) {
                            reject(err);
                        }
                    }
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    reject(new Error('Timeout en attente d\'une connexion SFTP disponible'));
                }
            }, 100);
        });
    }

    private async createNewPooledConnection(): Promise<InstanceType<typeof SFTP>> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`Tentative de connexion SFTP ${attempt}/${this.maxRetries}...`);
                const sftp = await this.createConnection();
                const pooledConnection: PooledConnection = {
                    sftp,
                    inUse: true,
                    createdAt: new Date(),
                    lastUsed: new Date(),
                    isValid: true,
                };
                this.pool.push(pooledConnection);
                console.log(`✅ Connexion SFTP établie (tentative ${attempt})`);
                return sftp;
            } catch (error) {
                lastError = error as Error;
                console.error(`Erreur connexion SFTP (tentative ${attempt}/${this.maxRetries}):`, (error as Error).message);

                if (attempt < this.maxRetries) {
                    // Attente exponentielle avant la prochaine tentative
                    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                    console.log(`Nouvelle tentative dans ${delay / 1000}s...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError || new Error('Impossible de créer une connexion SFTP');
    }

    private removeConnection(conn: PooledConnection): void {
        const index = this.pool.indexOf(conn);
        if (index > -1) {
            this.pool.splice(index, 1);
            conn.sftp.end().catch(() => {});
        }
    }

    release(sftp: InstanceType<typeof SFTP>): void {
        const connection = this.pool.find((conn) => conn.sftp === sftp);
        if (connection) {
            connection.inUse = false;
            connection.lastUsed = new Date();
        }
    }

    private cleanupStaleConnections(): void {
        const now = Date.now();

        this.pool = this.pool.filter((conn) => {
            // Supprimer les connexions invalides
            if (!conn.isValid) {
                conn.sftp.end().catch(() => {});
                return false;
            }

            const age = now - conn.createdAt.getTime();
            const idle = now - conn.lastUsed.getTime();

            if (!conn.inUse && (age > this.maxConnectionAge || idle > this.maxConnectionAge)) {
                conn.sftp.end().catch(() => {});
                return false;
            }
            return true;
        });
    }

    async closeAll(): Promise<void> {
        const closePromises = this.pool.map(async (conn) => {
            try {
                await conn.sftp.end();
            } catch (error) {
                console.error('Erreur fermeture connexion SFTP:', error);
            }
        });

        await Promise.all(closePromises);
        this.pool = [];
    }

    getPoolStats(): { total: number; inUse: number; available: number; valid: number } {
        return {
            total: this.pool.length,
            inUse: this.pool.filter((c) => c.inUse).length,
            available: this.pool.filter((c) => !c.inUse && c.isValid).length,
            valid: this.pool.filter((c) => c.isValid).length,
        };
    }
}
