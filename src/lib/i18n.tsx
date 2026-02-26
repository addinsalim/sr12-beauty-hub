import React, { createContext, useContext, useState, useCallback } from 'react';

type Lang = 'id' | 'en';

const translations = {
  id: {
    nav: {
      home: 'Beranda',
      products: 'Produk',
      categories: 'Kategori',
      about: 'Tentang Kami',
      contact: 'Kontak',
      login: 'Masuk',
      register: 'Daftar',
      cart: 'Keranjang',
      search: 'Cari produk...',
      parfum: 'Parfum',
      kosmetik: 'Kosmetik',
      skincare: 'Skincare',
    },
    hero: {
      title: 'Kecantikan Alami,',
      titleAccent: 'Pesona Abadi',
      subtitle: 'Temukan koleksi parfum, kosmetik, dan skincare terbaik dengan bahan alami berkualitas tinggi.',
      cta: 'Jelajahi Koleksi',
      ctaSecondary: 'Daftar Reseller',
    },
    categories: {
      title: 'Kategori Produk',
      subtitle: 'Pilih kategori sesuai kebutuhan kecantikan Anda',
      parfum: 'Parfum',
      parfumDesc: 'Wewangian eksklusif untuk setiap momen',
      kosmetik: 'Kosmetik',
      kosmetikDesc: 'Tampil cantik sepanjang hari',
      skincare: 'Skincare',
      skincareDesc: 'Rawat kulit Anda dengan bahan terbaik',
    },
    products: {
      title: 'Produk Terlaris',
      subtitle: 'Produk favorit pelanggan kami',
      viewAll: 'Lihat Semua Produk',
      addToCart: 'Tambah ke Keranjang',
      bpom: 'BPOM',
      halal: 'Halal',
      outOfStock: 'Stok Habis',
    },
    footer: {
      description: 'SR12 Store menyediakan produk kecantikan berkualitas tinggi dengan bahan alami yang aman dan bersertifikat.',
      quickLinks: 'Tautan Cepat',
      customerService: 'Layanan Pelanggan',
      contact: 'Hubungi Kami',
      faq: 'FAQ',
      shipping: 'Pengiriman',
      returns: 'Pengembalian',
      privacy: 'Kebijakan Privasi',
      terms: 'Syarat & Ketentuan',
      rights: 'Hak cipta dilindungi.',
    },
    auth: {
      login: 'Masuk',
      register: 'Daftar',
      email: 'Email',
      password: 'Kata Sandi',
      name: 'Nama Lengkap',
      phone: 'Nomor Telepon',
      forgotPassword: 'Lupa kata sandi?',
      noAccount: 'Belum punya akun?',
      hasAccount: 'Sudah punya akun?',
      loginWith: 'Atau masuk dengan',
      registerAs: 'Daftar sebagai',
      customer: 'Customer',
      reseller: 'Reseller',
      resellerNote: 'Pendaftaran reseller memerlukan persetujuan admin.',
    },
  },
  en: {
    nav: {
      home: 'Home',
      products: 'Products',
      categories: 'Categories',
      about: 'About Us',
      contact: 'Contact',
      login: 'Login',
      register: 'Register',
      cart: 'Cart',
      search: 'Search products...',
      parfum: 'Perfume',
      kosmetik: 'Cosmetics',
      skincare: 'Skincare',
    },
    hero: {
      title: 'Natural Beauty,',
      titleAccent: 'Timeless Elegance',
      subtitle: 'Discover our finest collection of perfumes, cosmetics, and skincare made with premium natural ingredients.',
      cta: 'Explore Collection',
      ctaSecondary: 'Become a Reseller',
    },
    categories: {
      title: 'Product Categories',
      subtitle: 'Choose the category for your beauty needs',
      parfum: 'Perfume',
      parfumDesc: 'Exclusive fragrances for every moment',
      kosmetik: 'Cosmetics',
      kosmetikDesc: 'Look beautiful all day long',
      skincare: 'Skincare',
      skincareDesc: 'Nourish your skin with the finest ingredients',
    },
    products: {
      title: 'Best Sellers',
      subtitle: 'Our customers\' favorite products',
      viewAll: 'View All Products',
      addToCart: 'Add to Cart',
      bpom: 'BPOM',
      halal: 'Halal',
      outOfStock: 'Out of Stock',
    },
    footer: {
      description: 'SR12 Store provides premium beauty products made with safe, certified natural ingredients.',
      quickLinks: 'Quick Links',
      customerService: 'Customer Service',
      contact: 'Contact Us',
      faq: 'FAQ',
      shipping: 'Shipping',
      returns: 'Returns',
      privacy: 'Privacy Policy',
      terms: 'Terms & Conditions',
      rights: 'All rights reserved.',
    },
    auth: {
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      name: 'Full Name',
      phone: 'Phone Number',
      forgotPassword: 'Forgot password?',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      loginWith: 'Or login with',
      registerAs: 'Register as',
      customer: 'Customer',
      reseller: 'Reseller',
      resellerNote: 'Reseller registration requires admin approval.',
    },
  },
} as const;

type DeepString<T> = { [K in keyof T]: T[K] extends object ? DeepString<T[K]> : string };
type Translations = DeepString<typeof translations['id']>;

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'id',
  setLang: () => {},
  t: translations.id,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>('id');

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
  }, []);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
