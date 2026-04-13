const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── In-memory data store ────────────────────────────────────
let products = [
  {
    id: '1',
    name: 'Laptop ASUS VivoBook',
    description: 'Laptop 15.6" Full HD, Intel i5, 8GB RAM, 512GB SSD',
    price: 2999.99,
    category: 'Electronice',
    stock: 25,
    image: 'https://via.placeholder.com/300x200?text=Laptop',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Casti Sony WH-1000XM5',
    description: 'Casti wireless over-ear cu noise cancelling',
    price: 1499.99,
    category: 'Audio',
    stock: 40,
    image: 'https://via.placeholder.com/300x200?text=Casti',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Smartphone 6.8" Dynamic AMOLED, 12GB RAM, 256GB',
    price: 5999.99,
    category: 'Telefoane',
    stock: 15,
    image: 'https://via.placeholder.com/300x200?text=Telefon',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Tastatura Mecanica Logitech MX Keys',
    description: 'Tastatura wireless iluminata, switch-uri low-profile',
    price: 599.99,
    category: 'Periferice',
    stock: 60,
    image: 'https://via.placeholder.com/300x200?text=Tastatura',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Monitor Dell UltraSharp 27"',
    description: 'Monitor 4K IPS, USB-C, 99% sRGB',
    price: 2199.99,
    category: 'Electronice',
    stock: 10,
    image: 'https://via.placeholder.com/300x200?text=Monitor',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ─── Helper: validation ──────?[1;32m✓[0m [1;32m✏️ Updated /Users/mihaioprica/ai-project/server.js[0m [2m(316 lines)[0m
Acum instalez dependențele și verific că serverul pornește:
[38;5;245m╭─ [1;36mbash[0;38;5;245m ─╮[0m
[38;5;245m│[0m [48;5;236;38;5;255m $ cd /Users/mihaioprica/ai-project && npm install 2>&1 [0m
[38;5;245m╰────────────╯[0m
[1;32m✓[0m [38;5;245mbash[0m exit_code:127

sh: npm: command not found

[38;5;245m╭─ [1;36mbash[0;38;5;245m ─╮[0m
[38;5;245m│[0m [48;5;236;38;5;255m $ which node 2>/dev/null; which npm 2>/dev/null; export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.nvm/versions/node/*/bin:$PATH" && which npm 2>/dev/null [0m
[38;5;245m╰────────────╯[0m
[1;32m✓[0m [38;5;245mbash[0m exit_code:1
[1G[2K[38;5;9m✘ ❌ Request failed
[0murn errors;
}

// ─── Routes ──────────────────────────────────────────────────

// GET /  — health check
app.get('/', (_req, res) => {
  res.json({
    message: 'API Produse — functioneaza!',
    version: '1.0.0',
    endpoints: {
      'GET    /api/products': 'Lista produse (cu filtre, sortare, paginare)',
      'GET    /api/products/:id': 'Detalii produs',
      'POST   /api/products': 'Creare produs',
      'PUT    /api/products/:id': 'Actualizare completa produs',
      'PATCH  /api/products/:id': 'Actualizare partiala produs',
      'DELETE /api/products/:id': 'Stergere produs',
      'GET    /api/products/stats/summary': 'Statistici produse',
    },
  });
});

// GET /api/products/stats/summary  — statistici
app.get('/api/products/stats/summary', (_req, res) => {
  const total = products.length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const avgPrice = total ? products.reduce((sum, p) => sum + p.price, 0) / total : 0;
  const categories = [...new Set(products.map((p) => p.category))];
  const outOfStock = products.filter((p) => p.stock === 0).length;

  res.json({
    success: true,
    data: {
      totalProducts: total,
      totalInventoryValue: Math.round(totalValue * 100) / 100,
      averagePrice: Math.round(avgPrice * 100) / 100,
      categories,
      categoriesCount: categories.length,
      outOfStock,
    },
  });
});

// GET /api/products  — lista cu filtre, sortare, paginare
app.get('/api/products', (req, res) => {
  let result = [...products];

  // Filtrare dupa categorie
  if (req.query.category) {
    result = result.filter(
      (p) => p.category.toLowerCase() === req.query.category.toLowerCase()
    );
  }

  // Cautare dupa nume / descriere
  if (req.query.search) {
    const s = req.query.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        (p.description && p.description.toLowerCase().includes(s))
    );
  }

  // Filtrare pret min / max
  if (req.query.minPrice) {
    result = result.filter((p) => p.price >= Number(req.query.minPrice));
  }
  if (req.query.maxPrice) {
    result = result.filter((p) => p.price <= Number(req.query.maxPrice));
  }

  // Filtrare in stock
  if (req.query.inStock === 'true') {
    result = result.filter((p) => p.stock > 0);
  }

  // Sortare
  const sortBy = req.query.sortBy || 'createdAt';
  const order = req.query.order === 'asc' ? 1 : -1;
  result.sort((a, b) => {
    if (a[sortBy] < b[sortBy]) return -1 * order;
    if (a[sortBy] > b[sortBy]) return 1 * order;
    return 0;
  });

  // Paginare
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
  const totalItems = result.length;
  const totalPages = Math.ceil(totalItems / limit);
  const start = (page - 1) * limit;
  const paginatedItems = result.slice(start, start + limit);

  res.json({
    success: true,
    data: paginatedItems,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
});

// GET /api/products/:id  — detalii produs
app.get('/api/products/:id', (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Produsul nu a fost gasit' });
  }
  res.json({ success: true, data: product });
});

// POST /api/products  — creare produs
app.post('/api/products', (req, res) => {
  const errors = validateProduct(req.body);
  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }

  const now = new Date().toISOString();
  const product = {
    id: uuidv4(),
    name: req.body.name.trim(),
    description: (req.body.description || '').trim(),
    price: req.body.price,
    category: (req.body.category || 'General').trim(),
    stock: req.body.stock !== undefined ? req.body.stock : 0,
    image: req.body.image || null,
    createdAt: now,
    updatedAt: now,
  };

  products.push(product);
  res.status(201).json({ success: true, data: product });
});

// PUT /api/products/:id  — actualizare completa
app.put('/api/products/:id', (req, res) => {
  const index = products.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Produsul nu a fost gasit' });
  }

  const errors = validateProduct(req.body);
  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }

  const updated = {
    ...products[index],
    name: req.body.name.trim(),
    description: (req.body.description || '').trim(),
    price: req.body.price,
    category: (req.body.category || 'General').trim(),
    stock: req.body.stock !== undefined ? req.body.stock : 0,
    image: req.body.image || null,
    updatedAt: new Date().toISOString(),
  };

  products[index] = updated;
  res.json({ success: true, data: updated });
});

// PATCH /api/products/:id  — actualizare partiala
app.patch('/api/products/:id', (req, res) => {
  const index = products.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Produsul nu a fost gasit' });
  }

  const errors = validateProduct(req.body, true);
  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }

  const allowedFields = ['name', 'description', 'price', 'category', 'stock', 'image'];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
    }
  }

  products[index] = {
    ...products[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  res.json({ success: true, data: products[index] });
});

// DELETE /api/products/:id  — stergere produs
app.delete('/api/products/:id', (req, res) => {
  const index = products.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Produsul nu a fost gasit' });
  }

  const deleted = products.splice(index, 1)[0];
  res.json({ success: true, message: 'Produs sters cu succes', data: deleted });
});

// ─── 404 catch-all ───────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Ruta nu a fost gasita' });
});

// ─── Error handler ───────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Eroare interna de server' });
});

// ─── Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server pornit pe port ${PORT}`);
  console.log(`📦 ${products.length} produse incarcate`);
});
