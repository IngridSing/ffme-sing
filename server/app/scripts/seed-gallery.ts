import * as fs from 'fs';
import mongoose from 'mongoose';
import * as path from 'path';
import { ProductModel, ProductOrderModel } from '../models/products.model';

const MONGODB_URI = process.env.MONGO_URI || process.env.DB_URL;

async function seedDatabase() {
    if (!MONGODB_URI) {
        console.error('❌ MONGO_URI (ou DB_URL) manquant : definissez cette variable avant de lancer le script.');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        // Lire les fichiers JSON
        const productsPath = path.join(__dirname, 'products.json');
        const ordersPath = path.join(__dirname, 'productOrders.json');

        const productsRaw = fs.readFileSync(productsPath, 'utf-8');
        const ordersRaw = fs.readFileSync(ordersPath, 'utf-8');

        const products = JSON.parse(productsRaw);
        const orders = JSON.parse(ordersRaw);

        // Insérer les nouvelles
        const insertedProducts = await ProductModel.insertMany(products);
        console.log(`✅ ${insertedProducts.length} produits insérés.`);

        const insertedOrders = await ProductOrderModel.insertMany(orders);
        console.log(`✅ ${insertedOrders.length} commandes insérées.`);

        await mongoose.disconnect();
        console.log('✅ Déconnexion MongoDB');
    } catch (error) {
        console.error('❌ Erreur pendant l’injection :', error);
        process.exit(1);
    }
}

seedDatabase();
