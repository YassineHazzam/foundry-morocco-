const express = require('express');
const crypto = require('crypto');
const store = require('../lib/store');
const { PROPERTY_TYPES, TITRE_FONCIER } = require('../lib/seed');

const router = express.Router();

function requireAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.redirect('/admin/login');
}

const fmtMAD = n => (n || 0).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ') + ' MAD';

/* ---------- Auth ---------- */
router.get('/login', (req, res) => {
  if (req.session && req.session.admin) return res.redirect('/admin');
  res.render('admin/login', { title: 'Connexion — Foundry Admin', error: null });
});

router.post('/login', async (req, res) => {
  const ok = await store.checkAdmin(req.body.username || '', req.body.password || '');
  if (ok) {
    req.session.admin = req.body.username;
    return res.redirect('/admin');
  }
  res.render('admin/login', { title: 'Connexion — Foundry Admin', error: 'Identifiants incorrects.' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

/* ---------- Dashboard ---------- */
router.get('/', requireAuth, async (req, res) => {
  const [listings, leads] = await Promise.all([store.getListings(), store.getLeads()]);
  const stats = {
    total: listings.length,
    published: listings.filter(l => l.status === 'publie').length,
    pending: listings.filter(l => l.status === 'en-attente').length,
    verified: listings.filter(l => l.verified).length,
    leads: leads.length,
    unreadLeads: leads.filter(l => !l.read).length,
    totalViews: listings.reduce((s, l) => s + (l.views || 0), 0)
  };
  const pendingListings = listings.filter(l => l.status === 'en-attente');
  const topListings = [...listings].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  const recentLeads = leads.slice(0, 5);
  res.render('admin/dashboard', { title: 'Tableau de bord — Foundry Admin', stats, pendingListings, topListings, recentLeads, fmtMAD, admin: req.session.admin });
});

/* ---------- Listings management ---------- */
router.get('/annonces', requireAuth, async (req, res) => {
  let listings = await store.getListings();
  const f = req.query.statut;
  if (f === 'en-attente') listings = listings.filter(l => l.status === 'en-attente');
  else if (f === 'publie') listings = listings.filter(l => l.status === 'publie');
  else if (f === 'rejete') listings = listings.filter(l => l.status === 'rejete');
  listings.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.render('admin/listings', { title: 'Annonces — Foundry Admin', listings, filter: f || 'toutes', fmtMAD, admin: req.session.admin });
});

router.get('/annonces/nouvelle', requireAuth, async (req, res) => {
  res.render('admin/listing-form', {
    title: 'Nouvelle annonce — Foundry Admin',
    listing: null, cities: await store.getCities(), types: PROPERTY_TYPES, titres: TITRE_FONCIER, admin: req.session.admin
  });
});

router.get('/annonces/:id', requireAuth, async (req, res, next) => {
  const listing = await store.getListing(req.params.id);
  if (!listing) return next();
  res.render('admin/listing-form', {
    title: 'Modifier annonce — Foundry Admin',
    listing, cities: await store.getCities(), types: PROPERTY_TYPES, titres: TITRE_FONCIER, admin: req.session.admin
  });
});

router.post('/annonces/save', requireAuth, async (req, res) => {
  const b = req.body;
  const existing = b.id ? await store.getListing(b.id) : null;
  const id = existing ? existing.id : 'lst-' + crypto.randomBytes(4).toString('hex');
  const slug = (b.slug || b.titre || id).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || id;
  const listing = Object.assign({}, existing || { views: 0, createdAt: new Date().toISOString() }, {
    id, slug,
    title: String(b.titre || '').slice(0, 120),
    type: String(b.type || 'appartement'),
    city: String(b.city || ''),
    quartier: String(b.quartier || '').slice(0, 60),
    address: String(b.address || '').slice(0, 200),
    lat: parseFloat(b.lat) || 0, lng: parseFloat(b.lng) || 0,
    price: parseInt(b.prix, 10) || 0,
    surface: parseInt(b.surface, 10) || 0,
    beds: parseInt(b.chambres, 10) || 0,
    baths: parseInt(b.sdb, 10) || 0,
    etage: b.etage !== '' ? parseInt(b.etage, 10) : null,
    ascenseur: b.ascenseur === 'on',
    titreFoncier: String(b.titreFoncier || 'Titré'),
    standing: String(b.standing || 'Moyen standing'),
    anneeConstruction: b.annee ? parseInt(b.annee, 10) : null,
    description: String(b.description || '').slice(0, 3000),
    photos: String(b.photos || '').split('\n').map(s => s.trim()).filter(Boolean),
    amenities: String(b.amenities || '').split(',').map(s => s.trim()).filter(Boolean),
    verified: b.verified === 'on',
    featured: b.featured === 'on',
    priceDrop: b.priceDrop === 'on',
    status: ['en-attente', 'publie', 'rejete'].includes(b.status) ? b.status : 'en-attente',
    ownerType: b.ownerType === 'agence' ? 'agence' : 'particulier',
    contactName: String(b.contactName || '').slice(0, 100),
    contactPhone: String(b.contactPhone || '').slice(0, 30),
    whatsapp: String(b.whatsapp || '').replace(/\D/g, '')
  });
  await store.saveListing(listing);
  res.redirect('/admin/annonces');
});

/* Quick moderation actions */
router.post('/annonces/:id/action', requireAuth, async (req, res) => {
  const listing = await store.getListing(req.params.id);
  if (listing) {
    const a = req.body.action;
    if (a === 'publier') listing.status = 'publie';
    if (a === 'rejeter') listing.status = 'rejete';
    if (a === 'verifier') { listing.verified = true; listing.status = 'publie'; }
    if (a === 'deverifier') listing.verified = false;
    if (a === 'supprimer') { await store.deleteListing(listing.id); return res.redirect(req.get('referer') || '/admin/annonces'); }
    await store.saveListing(listing);
  }
  res.redirect(req.get('referer') || '/admin/annonces');
});

/* ---------- Leads inbox ---------- */
router.get('/leads', requireAuth, async (req, res) => {
  const leads = await store.getLeads();
  res.render('admin/leads', { title: 'Leads — Foundry Admin', leads, admin: req.session.admin });
});

router.post('/leads/:id/lu', requireAuth, async (req, res) => {
  const leads = await store.getLeads();
  const lead = leads.find(l => l.id === req.params.id);
  if (lead) { lead.read = true; await store.saveLead(lead); }
  res.redirect('/admin/leads');
});

module.exports = router;
