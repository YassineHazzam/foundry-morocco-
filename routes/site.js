const express = require('express');
const crypto = require('crypto');
const store = require('../lib/store');
const { PROPERTY_TYPES } = require('../lib/seed');

const router = express.Router();

const fmtMAD = n => (n || 0).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ') + ' MAD';
const typeBySlug = slug => PROPERTY_TYPES.find(t => t.slug === slug) || null;

function applyFilters(listings, q) {
  let out = listings.filter(l => l.status === 'publie');
  if (q.city) out = out.filter(l => l.city === q.city);
  if (q.quartier) out = out.filter(l => l.quartier === q.quartier);
  if (q.type) out = out.filter(l => l.type === q.type);
  if (q.prixMin) out = out.filter(l => l.price >= +q.prixMin);
  if (q.prixMax) out = out.filter(l => l.price <= +q.prixMax);
  if (q.chambresMin) out = out.filter(l => (l.beds || 0) >= +q.chambresMin);
  if (q.surfaceMin) out = out.filter(l => (l.surface || 0) >= +q.surfaceMin);
  if (q.titre === 'titre') out = out.filter(l => l.titreFoncier === 'Titré');
  if (q.proprietaire === 'particulier') out = out.filter(l => l.ownerType === 'particulier');
  if (q.proprietaire === 'agence') out = out.filter(l => l.ownerType === 'agence');
  if (q.verifie === '1') out = out.filter(l => l.verified);

  const sort = q.tri || 'pertinence';
  if (sort === 'prix-asc') out.sort((a, b) => a.price - b.price);
  else if (sort === 'prix-desc') out.sort((a, b) => b.price - a.price);
  else if (sort === 'recent') out.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  else out.sort((a, b) => ((b.verified ? 1000 : 0) + (b.views || 0)) - ((a.verified ? 1000 : 0) + (a.views || 0)));
  return out;
}

/* ---------- Homepage ---------- */
router.get('/', async (req, res) => {
  const [listings, cities] = await Promise.all([store.getListings(), store.getCities()]);
  const published = listings.filter(l => l.status === 'publie');
  const featured = published.filter(l => l.featured).slice(0, 6);
  const priceDrops = published.filter(l => l.priceDrop).slice(0, 6);
  const recent = [...published].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 6);
  res.render('index', {
    title: 'Foundry — Acheter et vendre un bien immobilier au Maroc',
    metaDescription: "Foundry : la plateforme immobilière marocaine. Annonces vérifiées d'appartements, villas, riads et terrains à vendre à Casablanca, Rabat, Marrakech, Agadir, Tanger et Fès.",
    cities, featured, priceDrops, recent, types: PROPERTY_TYPES, fmtMAD,
    countPublished: published.length
  });
});

/* ---------- Search (generic, with query filters) ---------- */
router.get('/recherche', async (req, res) => {
  const [listings, cities] = await Promise.all([store.getListings(), store.getCities()]);
  const results = applyFilters(listings, req.query);
  const city = req.query.city ? cities.find(c => c.slug === req.query.city) : null;
  res.render('search', {
    title: 'Recherche de biens à vendre au Maroc | Foundry',
    metaDescription: 'Recherchez parmi des annonces immobilières vérifiées partout au Maroc.',
    results, cities, city, types: PROPERTY_TYPES, q: req.query, fmtMAD,
    heading: 'Biens à vendre au Maroc',
    canonicalPath: '/recherche'
  });
});

/* ---------- Programmatic SEO pages: /{city}/{type}-a-vendre ---------- */
router.get('/:citySlug/:typeSlug-a-vendre', async (req, res, next) => {
  const city = await store.getCity(req.params.citySlug);
  const type = typeBySlug(req.params.typeSlug);
  if (!city || !type) return next();
  const listings = await store.getListings();
  const q = Object.assign({}, req.query, { city: city.slug, type: type.slug });
  const results = applyFilters(listings, q);
  res.render('search', {
    title: `${type.plural} à vendre à ${city.name} | Foundry`,
    metaDescription: `${results.length} ${type.plural.toLowerCase()} à vendre à ${city.name}. Annonces vérifiées par Foundry, prix en MAD, contact direct WhatsApp.`,
    results, cities: await store.getCities(), city, types: PROPERTY_TYPES, q, fmtMAD,
    heading: `${type.plural} à vendre à ${city.name}`,
    canonicalPath: `/${city.slug}/${type.slug}-a-vendre`
  });
});

/* ---------- City page: /{city} ---------- */
router.get('/ville/:citySlug', async (req, res, next) => {
  const city = await store.getCity(req.params.citySlug);
  if (!city) return next();
  const listings = await store.getListings();
  const q = { city: city.slug };
  const results = applyFilters(listings, q);
  res.render('search', {
    title: `Immobilier à vendre à ${city.name} — appartements, villas, terrains | Foundry`,
    metaDescription: `Tout l'immobilier à vendre à ${city.name} : ${results.length} annonces vérifiées dans les quartiers ${city.quartiers.slice(0, 4).join(', ')}…`,
    results, cities: await store.getCities(), city, types: PROPERTY_TYPES, q, fmtMAD,
    heading: `Immobilier à vendre à ${city.name}`,
    canonicalPath: `/ville/${city.slug}`
  });
});

/* ---------- Listing detail: /annonce/{slug} ---------- */
router.get('/annonce/:slug', async (req, res, next) => {
  const listing = await store.getListing(req.params.slug);
  if (!listing || listing.status !== 'publie') return next();
  listing.views = (listing.views || 0) + 1;
  store.saveListing(listing).catch(() => {});
  const all = await store.getListings();
  const similar = all
    .filter(l => l.status === 'publie' && l.id !== listing.id && (l.city === listing.city || l.type === listing.type))
    .slice(0, 3);
  const city = await store.getCity(listing.city);
  const type = typeBySlug(listing.type);
  res.render('listing', {
    title: `${listing.title} — ${fmtMAD(listing.price)} | Foundry`,
    metaDescription: (listing.description || '').slice(0, 155),
    listing, similar, city, type, fmtMAD,
    lead: req.query.lead === 'ok'
  });
});

/* ---------- Lead capture ---------- */
router.post('/annonce/:slug/contact', async (req, res) => {
  const listing = await store.getListing(req.params.slug);
  if (!listing) return res.redirect('/');
  const { nom, telephone, email, message } = req.body;
  if (nom && telephone) {
    await store.saveLead({
      id: 'lead-' + crypto.randomBytes(6).toString('hex'),
      listingId: listing.id, listingTitle: listing.title,
      nom: String(nom).slice(0, 100), telephone: String(telephone).slice(0, 30),
      email: String(email || '').slice(0, 120), message: String(message || '').slice(0, 1000),
      createdAt: new Date().toISOString(), read: false
    });
  }
  res.redirect(`/annonce/${listing.slug}?lead=ok#contact`);
});

/* ---------- Sell / list your property ---------- */
router.get('/vendre', async (req, res) => {
  res.render('sell', {
    title: 'Vendre votre bien avec Foundry — Déposer une annonce',
    metaDescription: "Déposez votre annonce gratuitement. Vérification Foundry, visibilité maximale, acheteurs sérieux.",
    types: PROPERTY_TYPES, cities: await store.getCities(), sent: req.query.ok === '1'
  });
});

router.post('/vendre', async (req, res) => {
  const b = req.body;
  if (b.nom && b.telephone && b.titre) {
    const id = 'lst-' + crypto.randomBytes(4).toString('hex');
    await store.saveListing({
      id, slug: id,
      title: String(b.titre).slice(0, 120),
      type: String(b.type || 'appartement'),
      city: String(b.city || ''), quartier: String(b.quartier || '').slice(0, 60),
      lat: 0, lng: 0,
      price: parseInt(b.prix, 10) || 0,
      surface: parseInt(b.surface, 10) || 0,
      beds: parseInt(b.chambres, 10) || 0,
      baths: parseInt(b.sdb, 10) || 0,
      etage: null, ascenseur: false,
      titreFoncier: String(b.titreFoncier || 'Titré'),
      standing: 'Moyen standing', anneeConstruction: null,
      description: String(b.description || '').slice(0, 2000),
      photos: [], amenities: [],
      verified: false, featured: false, priceDrop: false,
      status: 'en-attente',
      ownerType: b.proprietaire === 'agence' ? 'agence' : 'particulier',
      contactName: String(b.nom).slice(0, 100),
      contactPhone: String(b.telephone).slice(0, 30),
      whatsapp: String(b.whatsapp || '').replace(/\D/g, ''),
      views: 0, createdAt: new Date().toISOString()
    });
  }
  res.redirect('/vendre?ok=1');
});

/* ---------- Sitemap ---------- */
router.get('/sitemap.xml', async (req, res) => {
  const [cities, listings] = await Promise.all([store.getCities(), store.getListings()]);
  const base = `${req.protocol}://${req.get('host')}`;
  const urls = ['/'];
  cities.forEach(c => {
    urls.push(`/ville/${c.slug}`);
    PROPERTY_TYPES.forEach(t => urls.push(`/${c.slug}/${t.slug}-a-vendre`));
  });
  listings.filter(l => l.status === 'publie').forEach(l => urls.push(`/annonce/${l.slug}`));
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${base}${u}</loc></url>`).join('\n') +
    `\n</urlset>`
  );
});

module.exports = router;
