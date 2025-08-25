const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Allow requests from the default Vite port and other common development ports
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

// --- In-memory Storage ---
// The Studio Interface is the source of truth. This is just a cache.
const canvases = {};      // Stores layout data per canvasId
let draftState = {};      // Stores the global draft state

// --- REST Endpoints ---

// Endpoint for Broadcast View to get initial canvas layout data.
app.get('/canvas/:id', (req, res) => {
  const { id } = req.params;
  const canvasData = canvases[id] || {};
  console.log(`[HTTP] GET /canvas/${id} - Found: ${!!canvases[id]}`);
  res.json(canvasData);
});

// New endpoint for Broadcast View to get initial global draft state.
app.get('/draft', (req, res) => {
  console.log(`[HTTP] GET /draft`);
  res.json(draftState);
});


// --- Socket.io Logic ---
io.on('connection', (socket) => {
  console.log(`[Socket] A user connected: ${socket.id}`);

  // Listener for initial bulk layout data from Studio
  socket.on('initLayouts', (allCanvases) => {
    if (allCanvases && typeof allCanvases === 'object') {
        Object.assign(canvases, allCanvases);
        console.log(`[Socket] Received 'initLayouts'. Cache primed with ${Object.keys(allCanvases).length} layouts.`);
    }
  });

  // Listener for initial draft state from Studio
  socket.on('initDraft', (initialDraftState) => {
      if (initialDraftState && typeof initialDraftState === 'object') {
          draftState = initialDraftState;
          console.log(`[Socket] Received 'initDraft'. Draft state cache primed.`);
      }
  });

  // Listener for layout updates for a single canvas
  socket.on('updateLayout', (data) => {
    if (data && data.id) {
      canvases[data.id] = data;
      io.emit('layoutUpdated', data); // Broadcast layout change
      console.log(`[Socket] 'updateLayout' for ${data.id}. Broadcasting 'layoutUpdated'.`);
    }
  });

  // Listener for global draft state updates
  socket.on('updateDraft', (newDraftState) => {
      if (newDraftState && typeof newDraftState === 'object') {
          draftState = newDraftState;
          io.emit('draftUpdated', draftState); // Broadcast draft change
          console.log(`[Socket] Received 'updateDraft'. Broadcasting 'draftUpdated'.`);
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
