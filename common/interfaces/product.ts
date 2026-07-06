import { ProductComment } from '@common/interfaces/comment';

export interface ProductVersion {
    label: string;
    price: number;
}

export interface Product {
    _id?: string;
    title: string;
    type: string;
    description: string;
    extraLink?: {
        label: string;
        url: string;
    };
    about: string[];
    image: string;
    comments: ProductComment[];
    averageReview: number;
    versions: ProductVersion[];
    stock: number;
}
