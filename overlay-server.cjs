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
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
};

app.use(cors(corsOptions));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// In-memory storage for canvases.
// The Studio Interface is the source of truth. This is just a cache.
const canvases = {};

// REST endpoint for Broadcast View to get initial canvas data.
app.get('/canvas/:id', (req, res) => {
  const { id } = req.params;
  const canvasData = canvases[id] || {};
  console.log(`[HTTP] GET /canvas/${id} - Found: ${!!canvases[id]}`);
  res.json(canvasData);
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`[Socket] A user connected: ${socket.id}`);

  // Listener for initial bulk canvas data from Studio Interface
  socket.on('initCanvases', (allCanvases) => {
    if (allCanvases && typeof allCanvases === 'object') {
        // Replace the entire cache with the data from the source of truth
        Object.assign(canvases, allCanvases);
        console.log(`[Socket] Received 'initCanvases'. Cache is now primed with ${Object.keys(allCanvases).length} canvases.`);
    }
  });

  // Listener for a single canvas update from Studio Interface
  socket.on('updateCanvas', (data) => {
    if (data && data.canvasId) {
      canvases[data.canvasId] = data;
      // Broadcast the update to all connected clients (all OBS instances)
      io.emit('canvasUpdated', data);
      console.log(`[Socket] Received 'updateCanvas' for ${data.canvasId}. Broadcasting to all clients.`);
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
