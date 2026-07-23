import mongoose from 'mongoose';
import { Service } from 'typedi';

@Service()
export class MongoConnectionService {
    private uri = process.env.MONGO_URI;

    constructor() {
        this.setupListeners();
    }

    public async connect(): Promise<void> {
        try {
            await mongoose.connect(this.uri);
            console.log('✅ MongoDB connecté');
        } catch (error) {
            console.error('❌ Connexion MongoDB échouée :', error);
            process.exit(1);
        }
    }

    private setupListeners(): void {
        mongoose.connection.on('connected', () => {
            console.log('🔌 Mongoose connecté');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❗ Erreur Mongoose :', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('❎ Mongoose déconnecté');
        });
    }

    public async disconnect(): Promise<void> {
        await mongoose.disconnect();
        console.log('🔌 MongoDB déconnecté proprement');
    }
}
