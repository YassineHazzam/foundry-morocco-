const path = require('path');
const express = require('express');
const session = require('express-session');
const store = require('./lib/store');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'foundry-dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 8 }
}));

// Initialize storage (creates tables / seeds data on first run)
let ready = null;
app.use(async (req, res, next) => {
  try {
    if (!ready) ready = store.initialize();
    await ready;
    next();
  } catch (err) {
    console.error('Init error:', err);
    ready = null;
    res.status(500).send('Erreur de démarrage — vérifiez la configuration de la base de données.');
  }
});

app.use('/admin', require('./routes/admin'));
app.use('/', require('./routes/site'));

// 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page introuvable — Foundry' });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Foundry MLS running on http://localhost:${PORT}`));
}

module.exports = app;
