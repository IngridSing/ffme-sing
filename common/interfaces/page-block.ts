export enum TypePageBlock {
    Text = 'text',
    Picture = 'image',
    Quote = 'citation',
    Custom = 'custom',
}

export interface BlockStyle {
    _id?: string;
    fontSize?: number;
    color?: string;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    backgroundColor?: string;
    border?: string;
    borderRadius?: number;
    boxShadow?: string;
    textAlign?: string;
}

export interface PageBlock {
    _id?: string;
    type: TypePageBlock;
    content?: string;
    componentKey?: string;
    data?: any;
    styles?: BlockStyle;
    position?: {
        left: number;
        top: number;
    };
    size?: {
        width: number;
        height: number;
    };
    imageUrl?: string;
    customCss?: string;
}

export interface PageGroup {
    _id?: string;
    title?: string;
    blocks: PageBlock[];
}

// ✅ Modèle principal PageContent
export interface PageContent {
    slug: string;
    groups: PageGroup[];
}
