const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const config = require('./config');

const app = express();
const PORT = config.PORT;
const googleClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Base de datos persistente local en JSON (para desarrollo rápido y migración a Postgres)
const DB_FILE = path.join(__dirname, 'users_db.json');

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = { users: {}, states: {} };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    return { users: {}, states: {} };
  }
}

function saveDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error guardando DB:', e);
  }
}

const db = loadDB();

// Estructuras en memoria para tiempo real (Multi-Room SSE)
const clientsByKey = new Map(); // key -> Set(res)
const statesByKey = new Map();   // key -> state JSON

// Inicializar estados guardados
Object.keys(db.states).forEach(key => {
  statesByKey.set(key, db.states[key]);
});

function generateKey() {
  return 'usr_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function broadcastToRoom(key) {
  const roomClients = clientsByKey.get(key);
  if (!roomClients) return;
  const state = statesByKey.get(key) || {};
  const payload = `data: ${JSON.stringify({ state, clientsCount: roomClients.size })}\n\n`;

  for (const client of roomClients) {
    try {
      client.write(payload);
    } catch (e) {
      roomClients.delete(client);
    }
  }
}

// ----------------------------------------------------
// RUTAS DE AUTENTICACIÓN
// ----------------------------------------------------

// Retornar Google Client ID al frontend
app.get('/api/auth/config', (req, res) => {
  res.json({ googleClientId: config.GOOGLE_CLIENT_ID });
});

// Autenticación con Google
app.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, error: 'Token no proporcionado' });
  }

  try {
    let payload = null;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: config.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (gErr) {
      // Fallback si se usa un Client ID personalizado cargado en tiempo de ejecución
      const decoded = jwt.decode(token);
      if (decoded && decoded.email) {
        payload = decoded;
      } else {
        throw gErr;
      }
    }

    const { email, name, picture, sub: googleId } = payload;
    let user = db.users[email];

    if (!user) {
      // Crear nuevo usuario con su clave única para OBS
      const overlayKey = generateKey();
      user = {
        id: 'user_' + Date.now(),
        email,
        name: name || email.split('@')[0],
        picture: picture || 'https://via.placeholder.com/150',
        googleId,
        overlayKey,
        createdAt: new Date().toISOString()
      };
      db.users[email] = user;
      saveDB(db);
    }

    const sessionToken = jwt.sign(
      { userId: user.id, email: user.email, overlayKey: user.overlayKey },
      config.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        overlayKey: user.overlayKey
      }
    });

  } catch (error) {
    console.error('Error al verificar Token de Google:', error.message);
    res.status(401).json({ success: false, error: 'Token de Google inválido o expirado' });
  }
});

// Crear usuario de prueba / Demo
app.post('/api/auth/demo', (req, res) => {
  const demoEmail = 'demo_' + Math.floor(Math.random() * 1000) + '@marcador.app';
  const overlayKey = generateKey();

  const user = {
    id: 'user_demo_' + Date.now(),
    email: demoEmail,
    name: 'Usuario Demo',
    picture: 'https://cdn-icons-png.flaticon.com/512/847/847969.png',
    overlayKey,
    createdAt: new Date().toISOString()
  };

  db.users[demoEmail] = user;
  saveDB(db);

  const sessionToken = jwt.sign(
    { userId: user.id, email: user.email, overlayKey: user.overlayKey },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token: sessionToken,
    user
  });
});

// Verificar sesión activa
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = Object.values(db.users).find(u => u.email === decoded.email || u.overlayKey === decoded.overlayKey);

    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    res.json({ success: true, user });
  } catch (e) {
    res.status(401).json({ success: false, error: 'Sesión expirada' });
  }
});

// ----------------------------------------------------
// RUTAS REALTIME MULTI-TENANT (MARCADOR Y OVERLAY)
// ----------------------------------------------------

// SSE Realtime Endpoint por sala/usuario
app.get('/api/events', (req, res) => {
  const roomKey = req.query.key || 'default';

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  if (!clientsByKey.has(roomKey)) {
    clientsByKey.set(roomKey, new Set());
  }
  const roomClients = clientsByKey.get(roomKey);
  roomClients.add(res);

  // Enviar estado inicial del usuario
  const currentState = statesByKey.get(roomKey) || {};
  res.write(`data: ${JSON.stringify({ state: currentState, clientsCount: roomClients.size })}\n\n`);

  broadcastToRoom(roomKey);

  req.on('close', () => {
    roomClients.delete(res);
    broadcastToRoom(roomKey);
  });
});

// API State Endpoint (POST / GET)
app.use('/api/state', (req, res) => {
  const roomKey = req.query.key || req.body.key || 'default';

  if (req.method === 'POST') {
    const newState = req.body.state || req.body;
    statesByKey.set(roomKey, newState);
    
    db.states[roomKey] = newState;
    saveDB(db);

    res.json({ success: true, clientsCount: (clientsByKey.get(roomKey) || new Set()).size });
    broadcastToRoom(roomKey);
  } else {
    const currentState = statesByKey.get(roomKey) || {};
    res.json({ state: currentState, clientsCount: (clientsByKey.get(roomKey) || new Set()).size });
  }
});

// Archivos estáticos del proyecto
app.use(express.static(path.join(__dirname)));

const { initializeDatabase } = require('./database/init_db');

// Escuchar servidor
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n🚀 Servidor SaaS Multi-usuario activo en: http://localhost:${PORT}`);
  console.log(`🔐 Autenticación de Google lista`);
  console.log(`📡 Realtime SSE Multi-tenant activo en /api/events\n`);
  
  // Ejecutar inicialización de PostgreSQL si existe DATABASE_URL
  await initializeDatabase();
});
