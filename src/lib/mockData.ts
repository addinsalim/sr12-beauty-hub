export interface Product {
  id: string;
  name: string;
  slug: string;
  category: 'parfum' | 'kosmetik' | 'skincare';
  price: number;
  resellerPrice: number;
  discount?: number;
  stock: number;
  description: string;
  images: string[];
  variants: Variant[];
  rating: number;
  reviewCount: number;
  bpom: boolean;
  halal: boolean;
  weight: number; // grams
  expiredDate: string;
}

export interface Variant {
  id: string;
  name: string;
  type: string;
  price: number;
  stock: number;
}

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'SR12 Parfum Exclusive Rose',
    slug: 'sr12-parfum-exclusive-rose',
    category: 'parfum',
    price: 185000,
    resellerPrice: 148000,
    discount: 10,
    stock: 50,
    description: 'Parfum eksklusif dengan aroma rose yang elegan dan tahan lama. Cocok untuk setiap momen spesial Anda.',
    images: [],
    variants: [
      { id: 'v1', name: '30ml', type: 'Ukuran', price: 185000, stock: 30 },
      { id: 'v2', name: '50ml', type: 'Ukuran', price: 285000, stock: 20 },
    ],
    rating: 4.8,
    reviewCount: 124,
    bpom: true,
    halal: true,
    weight: 100,
    expiredDate: '2027-12-31',
  },
  {
    id: '2',
    name: 'SR12 Facial Wash Brightening',
    slug: 'sr12-facial-wash-brightening',
    category: 'skincare',
    price: 75000,
    resellerPrice: 60000,
    stock: 120,
    description: 'Facial wash dengan formula lembut yang membersihkan wajah sekaligus mencerahkan kulit secara alami.',
    images: [],
    variants: [
      { id: 'v3', name: '100ml', type: 'Ukuran', price: 75000, stock: 80 },
      { id: 'v4', name: '200ml', type: 'Ukuran', price: 130000, stock: 40 },
    ],
    rating: 4.6,
    reviewCount: 256,
    bpom: true,
    halal: true,
    weight: 150,
    expiredDate: '2026-06-30',
  },
  {
    id: '3',
    name: 'SR12 Lip Cream Matte',
    slug: 'sr12-lip-cream-matte',
    category: 'kosmetik',
    price: 65000,
    resellerPrice: 52000,
    discount: 15,
    stock: 200,
    description: 'Lip cream matte dengan warna intense yang tahan lama. Formula ringan dan nyaman dipakai seharian.',
    images: [],
    variants: [
      { id: 'v5', name: 'Nude Rose', type: 'Warna', price: 65000, stock: 50 },
      { id: 'v6', name: 'Berry Red', type: 'Warna', price: 65000, stock: 50 },
      { id: 'v7', name: 'Coral Pink', type: 'Warna', price: 65000, stock: 50 },
      { id: 'v8', name: 'Mauve', type: 'Warna', price: 65000, stock: 50 },
    ],
    rating: 4.9,
    reviewCount: 512,
    bpom: true,
    halal: true,
    weight: 30,
    expiredDate: '2026-12-31',
  },
  {
    id: '4',
    name: 'SR12 Night Cream Anti-Aging',
    slug: 'sr12-night-cream-anti-aging',
    category: 'skincare',
    price: 125000,
    resellerPrice: 100000,
    stock: 80,
    description: 'Krim malam dengan formula anti-aging yang membantu meregenerasi kulit saat Anda tidur.',
    images: [],
    variants: [
      { id: 'v9', name: '15g', type: 'Ukuran', price: 125000, stock: 50 },
      { id: 'v10', name: '30g', type: 'Ukuran', price: 220000, stock: 30 },
    ],
    rating: 4.7,
    reviewCount: 189,
    bpom: true,
    halal: true,
    weight: 50,
    expiredDate: '2026-09-30',
  },
  {
    id: '5',
    name: 'SR12 Body Mist Vanilla',
    slug: 'sr12-body-mist-vanilla',
    category: 'parfum',
    price: 95000,
    resellerPrice: 76000,
    stock: 0,
    description: 'Body mist dengan aroma vanilla yang lembut dan menyegarkan. Sempurna untuk penggunaan sehari-hari.',
    images: [],
    variants: [
      { id: 'v11', name: '100ml', type: 'Ukuran', price: 95000, stock: 0 },
    ],
    rating: 4.5,
    reviewCount: 78,
    bpom: true,
    halal: true,
    weight: 120,
    expiredDate: '2027-03-31',
  },
  {
    id: '6',
    name: 'SR12 Cushion Foundation',
    slug: 'sr12-cushion-foundation',
    category: 'kosmetik',
    price: 145000,
    resellerPrice: 116000,
    discount: 20,
    stock: 90,
    description: 'Cushion foundation dengan coverage natural yang membuat kulit tampak flawless dan glowing sepanjang hari.',
    images: [],
    variants: [
      { id: 'v12', name: 'Light', type: 'Warna', price: 145000, stock: 30 },
      { id: 'v13', name: 'Medium', type: 'Warna', price: 145000, stock: 30 },
      { id: 'v14', name: 'Dark', type: 'Warna', price: 145000, stock: 30 },
    ],
    rating: 4.8,
    reviewCount: 345,
    bpom: true,
    halal: true,
    weight: 40,
    expiredDate: '2026-08-31',
  },
];

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};
