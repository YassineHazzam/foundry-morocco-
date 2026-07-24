/**
 * Seed data — Moroccan cities (with quartiers + coordinates) and sample sale listings.
 * These drive the programmatic SEO pages: /{city}/{type}-a-vendre
 */

const seedCities = [
  {
    slug: 'casablanca', name: 'Casablanca', lat: 33.5731, lng: -7.5898,
    quartiers: ['Maarif', 'Gauthier', 'Anfa', 'Ain Diab', 'Bourgogne', 'Racine', 'Californie', 'Oasis', 'CIL', 'Sidi Maarouf']
  },
  {
    slug: 'rabat', name: 'Rabat', lat: 34.0209, lng: -6.8416,
    quartiers: ['Agdal', 'Hay Riad', 'Souissi', 'Hassan', 'Les Orangers', 'Aviation']
  },
  {
    slug: 'marrakech', name: 'Marrakech', lat: 31.6295, lng: -7.9811,
    quartiers: ['Guéliz', 'Hivernage', 'Médina', 'Palmeraie', 'Targa', 'Route de Fès']
  },
  {
    slug: 'agadir', name: 'Agadir', lat: 30.4278, lng: -9.5981,
    quartiers: ['Founty', 'Talborjt', 'Hay Mohammadi', 'Charaf', 'Sonaba', 'Illigh']
  },
  {
    slug: 'tanger', name: 'Tanger', lat: 35.7595, lng: -5.8340,
    quartiers: ['Malabata', 'Centre-ville', 'Iberia', 'Boubana', 'Cap Spartel']
  },
  {
    slug: 'fes', name: 'Fès', lat: 34.0181, lng: -5.0078,
    quartiers: ['Ville Nouvelle', 'Médina', 'Route Immouzer', 'Saiss']
  }
];

const PROPERTY_TYPES = [
  { slug: 'appartement', label: 'Appartement', plural: 'Appartements' },
  { slug: 'villa', label: 'Villa', plural: 'Villas' },
  { slug: 'riad', label: 'Riad', plural: 'Riads' },
  { slug: 'studio', label: 'Studio', plural: 'Studios' },
  { slug: 'duplex', label: 'Duplex', plural: 'Duplex' },
  { slug: 'terrain', label: 'Terrain', plural: 'Terrains' },
  { slug: 'local-commercial', label: 'Local commercial', plural: 'Locaux commerciaux' }
];

const TITRE_FONCIER = ['Titré', 'Non titré', 'En cours de titrement'];

function L(over) {
  return Object.assign({
    id: '', slug: '', title: '', type: 'appartement',
    city: '', quartier: '', address: '',
    lat: 0, lng: 0,
    price: 0, surface: 0, beds: 0, baths: 0,
    etage: null, ascenseur: false, titreFoncier: 'Titré',
    standing: 'Moyen standing', anneeConstruction: null,
    description: '', photos: [], amenities: [],
    verified: false, featured: false, priceDrop: false,
    status: 'publie', // en-attente | publie | rejete
    ownerType: 'particulier', // particulier | agence
    contactName: '', contactPhone: '', whatsapp: '',
    views: 0, createdAt: new Date().toISOString()
  }, over);
}

const ph = (seedNum, w = 800, h = 600) => `https://picsum.photos/seed/foundry${seedNum}/${w}/${h}`;

const seedListings = [
  L({
    id: 'lst-001', slug: 'appartement-maarif-casablanca-3ch',
    title: 'Appartement lumineux 3 chambres — Maarif',
    type: 'appartement', city: 'casablanca', quartier: 'Maarif',
    lat: 33.5850, lng: -7.6350, price: 1850000, surface: 118, beds: 3, baths: 2,
    etage: 4, ascenseur: true, titreFoncier: 'Titré', standing: 'Haut standing', anneeConstruction: 2019,
    description: "Bel appartement au cœur de Maarif, proche des commerces et écoles. Séjour double, cuisine équipée, 3 chambres dont une suite parentale. Résidence sécurisée avec ascenseur et parking en sous-sol.",
    photos: [ph(1), ph(2), ph(3), ph(4)],
    amenities: ['Parking', 'Sécurité 24h', 'Cuisine équipée', 'Climatisation', 'Balcon'],
    verified: true, featured: true,
    contactName: 'Karim B.', contactPhone: '+212 661 000 001', whatsapp: '212661000001',
    views: 342
  }),
  L({
    id: 'lst-002', slug: 'villa-ain-diab-casablanca-piscine',
    title: 'Villa moderne avec piscine — Ain Diab',
    type: 'villa', city: 'casablanca', quartier: 'Ain Diab',
    lat: 33.5940, lng: -7.6680, price: 8500000, surface: 450, beds: 5, baths: 4,
    titreFoncier: 'Titré', standing: 'Haut standing', anneeConstruction: 2021,
    description: "Villa contemporaine à 5 minutes de la Corniche. Piscine chauffée, jardin paysager, triple séjour, cuisine américaine, suite parentale avec dressing. Quartier calme et résidentiel.",
    photos: [ph(5), ph(6), ph(7)],
    amenities: ['Piscine', 'Jardin', 'Garage 2 voitures', 'Chauffage central', 'Domotique'],
    verified: true, featured: true,
    ownerType: 'agence',
    contactName: 'Agence Littoral', contactPhone: '+212 522 000 002', whatsapp: '212661000002',
    views: 518
  }),
  L({
    id: 'lst-003', slug: 'appartement-agdal-rabat-2ch',
    title: 'Appartement 2 chambres — Agdal',
    type: 'appartement', city: 'rabat', quartier: 'Agdal',
    lat: 34.0060, lng: -6.8500, price: 1250000, surface: 85, beds: 2, baths: 1,
    etage: 2, ascenseur: true, titreFoncier: 'Titré', anneeConstruction: 2015,
    description: "Agdal, à deux pas de l'avenue de France. Appartement bien entretenu, séjour ensoleillé, 2 chambres, salle de bain moderne. Idéal premier achat ou investissement locatif.",
    photos: [ph(8), ph(9)],
    amenities: ['Ascenseur', 'Concierge', 'Balcon'],
    verified: true, priceDrop: true,
    contactName: 'Salma E.', contactPhone: '+212 661 000 003', whatsapp: '212661000003',
    views: 201
  }),
  L({
    id: 'lst-004', slug: 'riad-medina-marrakech-renove',
    title: 'Riad rénové 4 chambres — Médina',
    type: 'riad', city: 'marrakech', quartier: 'Médina',
    lat: 31.6310, lng: -7.9890, price: 3900000, surface: 220, beds: 4, baths: 4,
    titreFoncier: 'En cours de titrement', standing: 'Haut standing',
    description: "Riad authentique entièrement rénové par architecte, patio avec fontaine, terrasse panoramique vue Atlas, 4 suites. Exploitable en maison d'hôtes. Emplacement premium à 3 min de Jemaa el-Fna.",
    photos: [ph(10), ph(11), ph(12), ph(13)],
    amenities: ['Patio', 'Terrasse', 'Cheminée', 'Puits de lumière'],
    verified: true, featured: true,
    ownerType: 'agence',
    contactName: 'Medina Properties', contactPhone: '+212 524 000 004', whatsapp: '212661000004',
    views: 764
  }),
  L({
    id: 'lst-005', slug: 'appartement-founty-agadir-vue-mer',
    title: 'Appartement vue mer — Founty',
    type: 'appartement', city: 'agadir', quartier: 'Founty',
    lat: 30.4080, lng: -9.6120, price: 1650000, surface: 102, beds: 2, baths: 2,
    etage: 5, ascenseur: true, titreFoncier: 'Titré', standing: 'Haut standing', anneeConstruction: 2020,
    description: "Baie d'Agadir : appartement en résidence balnéaire sécurisée avec piscines. Vue mer dégagée depuis le séjour et la terrasse. Vendu meublé, forte rentabilité saisonnière.",
    photos: [ph(14), ph(15), ph(16)],
    amenities: ['Piscine', 'Vue mer', 'Meublé', 'Sécurité 24h', 'Parking'],
    verified: true, featured: true,
    contactName: 'Yassir A.', contactPhone: '+212 661 000 005', whatsapp: '212661000005',
    views: 447
  }),
  L({
    id: 'lst-006', slug: 'terrain-targa-marrakech-500m2',
    title: 'Terrain constructible 500 m² — Targa',
    type: 'terrain', city: 'marrakech', quartier: 'Targa',
    lat: 31.6500, lng: -8.0400, price: 2250000, surface: 500,
    titreFoncier: 'Titré',
    description: "Terrain plat titré en zone villa R+1, façade 18 m, tous réseaux à proximité (eau, électricité, assainissement). Quartier en plein développement.",
    photos: [ph(17)],
    amenities: [],
    contactName: 'Hassan M.', contactPhone: '+212 661 000 006', whatsapp: '212661000006',
    views: 129
  }),
  L({
    id: 'lst-007', slug: 'studio-gueliz-marrakech',
    title: 'Studio moderne — Guéliz',
    type: 'studio', city: 'marrakech', quartier: 'Guéliz',
    lat: 31.6340, lng: -8.0100, price: 780000, surface: 45, beds: 1, baths: 1,
    etage: 3, ascenseur: true, titreFoncier: 'Titré', anneeConstruction: 2018,
    description: "Studio optimisé au centre de Guéliz, résidence avec piscine. Parfait pied-à-terre ou investissement Airbnb. Vendu équipé.",
    photos: [ph(18), ph(19)],
    amenities: ['Piscine', 'Meublé', 'Ascenseur'],
    priceDrop: true,
    contactName: 'Nadia T.', contactPhone: '+212 661 000 007', whatsapp: '212661000007',
    views: 178
  }),
  L({
    id: 'lst-008', slug: 'duplex-hay-riad-rabat',
    title: 'Duplex standing 4 chambres — Hay Riad',
    type: 'duplex', city: 'rabat', quartier: 'Hay Riad',
    lat: 33.9560, lng: -6.8720, price: 3200000, surface: 210, beds: 4, baths: 3,
    etage: 6, ascenseur: true, titreFoncier: 'Titré', standing: 'Haut standing', anneeConstruction: 2022,
    description: "Duplex neuf dans une résidence de prestige à Hay Riad : double séjour, terrasse 40 m², 4 chambres, 2 places de parking. Prestations haut de gamme.",
    photos: [ph(20), ph(21), ph(22)],
    amenities: ['Terrasse', 'Parking x2', 'Chauffage au sol', 'Sécurité 24h'],
    verified: true,
    ownerType: 'agence',
    contactName: 'Capital Immo', contactPhone: '+212 537 000 008', whatsapp: '212661000008',
    views: 293
  }),
  L({
    id: 'lst-009', slug: 'local-commercial-centre-tanger',
    title: 'Local commercial 90 m² — Centre-ville',
    type: 'local-commercial', city: 'tanger', quartier: 'Centre-ville',
    lat: 35.7770, lng: -5.8100, price: 1950000, surface: 90, baths: 1,
    titreFoncier: 'Titré',
    description: "Local commercial en angle sur axe passant, grande vitrine, mezzanine de stockage. Idéal franchise, showroom ou agence.",
    photos: [ph(23)],
    amenities: ['Vitrine', 'Mezzanine'],
    contactName: 'Omar L.', contactPhone: '+212 661 000 009', whatsapp: '212661000009',
    views: 84
  }),
  L({
    id: 'lst-010', slug: 'appartement-malabata-tanger-3ch',
    title: 'Appartement neuf 3 chambres vue baie — Malabata',
    type: 'appartement', city: 'tanger', quartier: 'Malabata',
    lat: 35.7830, lng: -5.7750, price: 2100000, surface: 130, beds: 3, baths: 2,
    etage: 7, ascenseur: true, titreFoncier: 'Titré', standing: 'Haut standing', anneeConstruction: 2023,
    description: "Résidence neuve face à la baie de Tanger. Grand séjour vue mer, cuisine fermée équipée, 3 chambres. Livrable immédiatement.",
    photos: [ph(24), ph(25), ph(26)],
    amenities: ['Vue mer', 'Piscine', 'Parking', 'Sécurité 24h'],
    verified: true, featured: true,
    ownerType: 'agence',
    contactName: 'Detroit Realty', contactPhone: '+212 539 000 010', whatsapp: '212661000010',
    views: 356
  }),
  L({
    id: 'lst-011', slug: 'villa-souissi-rabat-jardin',
    title: 'Villa de charme avec grand jardin — Souissi',
    type: 'villa', city: 'rabat', quartier: 'Souissi',
    lat: 33.9800, lng: -6.8300, price: 12000000, surface: 800, beds: 6, baths: 5,
    titreFoncier: 'Titré', standing: 'Haut standing', anneeConstruction: 2010,
    description: "Propriété d'exception sur 1 500 m² de terrain au Souissi : villa principale 6 chambres, dépendance, piscine, jardin arboré. Quartier diplomatique.",
    photos: [ph(27), ph(28)],
    amenities: ['Piscine', 'Jardin 1500m²', 'Dépendance', 'Garage'],
    verified: true,
    ownerType: 'agence',
    contactName: 'Prestige Rabat', contactPhone: '+212 537 000 011', whatsapp: '212661000011',
    views: 612
  }),
  L({
    id: 'lst-012', slug: 'appartement-talborjt-agadir-en-attente',
    title: 'Appartement 2 chambres à rafraîchir — Talborjt',
    type: 'appartement', city: 'agadir', quartier: 'Talborjt',
    lat: 30.4230, lng: -9.5920, price: 720000, surface: 78, beds: 2, baths: 1,
    etage: 1, titreFoncier: 'Non titré',
    description: "Appartement à fort potentiel au centre de Talborjt, travaux de rafraîchissement à prévoir. Prix négociable.",
    photos: [ph(29)],
    amenities: [],
    status: 'en-attente',
    contactName: 'Rachid Z.', contactPhone: '+212 661 000 012', whatsapp: '212661000012',
    views: 12
  })
];

module.exports = { seedCities, seedListings, PROPERTY_TYPES, TITRE_FONCIER };
