import * as fs from 'fs';
import mongoose from 'mongoose';
import * as path from 'path';
import { ProductModel, ProductOrderModel } from '../models/products.model';

const MONGODB_URI = 'mongodb://admin:iWp3p778NdGyd3tMQ6Z6k3TkgK5hM24M3@162.19.253.183:27018/FFME?authSource=admin&directConnection=true'; // à adapter

async function seedDatabase() {
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
