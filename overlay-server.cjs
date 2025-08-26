const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
const server = http.createServer(app);

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// --- In-memory Storage for Broadcast State ---
let broadcastState = {
  canvases: {},
  scores: { host: 0, guest: 0 },
  hostName: 'Player 1',
  guestName: 'Player 2',
  civPicksHost: [],
  civBansHost: [],
  civPicksGuest: [],
  civBansGuest: [],
  mapPicksHost: [],
  mapBansHost: [],
  mapPicksGuest: [],
  mapBansGuest: [],
  mapPicksGlobal: [],
  mapBansGlobal: [],
  hostColor: null,
  guestColor: null,
  hostFlag: null,
  guestFlag: null,
  boxSeriesFormat: null,
  boxSeriesGames: [],
  aoe2cmRawDraftOptions: undefined,
  forceMapPoolUpdate: 0,
};

// --- REST Endpoint ---
app.get('/broadcast_state', (req, res) => {
  console.log(`[HTTP] GET /broadcast_state`);
  res.json(broadcastState);
});

// --- Socket.io Logic ---
io.on('connection', (socket) => {
  console.log(`[Socket] A user connected: ${socket.id}`);

  // Listener for canvas updates
  socket.on('updateCanvas', (data) => {
    if (data && data.canvasId) {
      if (!broadcastState.canvases[data.canvasId]) {
        broadcastState.canvases[data.canvasId] = {};
      }
      broadcastState.canvases[data.canvasId] = {
        ...broadcastState.canvases[data.canvasId],
        ...data
      };
      // Broadcast the specific canvas update to all clients
      io.emit('canvasUpdated', data);
      console.log(`[Socket] Received 'updateCanvas' for ${data.canvasId}. Broadcasting 'canvasUpdated'.`);
    }
  });

  // Listener for draft data updates
  socket.on('updateDraftData', (data) => {
    if (data && typeof data === 'object') {
      broadcastState = { ...broadcastState, ...data };
      // Broadcast the draft data update to all clients
      io.emit('draftDataUpdated', data);
      console.log(`[Socket] Received 'updateDraftData'. Broadcasting 'draftDataUpdated'.`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.id}`);
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Overseer Caster Overlay Server listening on port ${PORT}`);
});
