import { Injectable } from '@angular/core';
import { Product } from '@common/interfaces/product';

export type CartItem = Product & { selectedVersionIndex: number };

@Injectable({
    providedIn: 'root',
})
export class CartStoreService {
    private key = 'cart_items';
    private cart: CartItem[] = [];

    constructor() {
        const saved = sessionStorage.getItem(this.key);
        this.cart = saved ? JSON.parse(saved) : [];
    }

    getCart(): CartItem[] {
        return this.cart;
    }

    addToCart(item: CartItem, qty: number = 1): void {
        for (let i = 0; i < qty; i++) {
            this.cart.push(item);
        }
        this.save();
    }

    removeOne(item: CartItem): void {
        const index = this.cart.findIndex((p) => p._id === item._id && p.selectedVersionIndex === item.selectedVersionIndex);
        if (index !== -1) {
            this.cart.splice(index, 1);
            this.save();
        }
    }

    clear(): void {
        this.cart = [];
        this.save();
    }

    private save(): void {
        sessionStorage.setItem(this.key, JSON.stringify(this.cart));
    }
}
