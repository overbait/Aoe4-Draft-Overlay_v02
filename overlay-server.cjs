const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
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

// --- In-memory Storage ---
// A single store for the combined state (layout + draft)
let fullState = {};

// --- REST Endpoint ---
// A single endpoint for the Broadcast View to get the initial combined state.
app.get('/state', (req, res) => {
  console.log(`[HTTP] GET /state`);
  res.json(fullState);
});

// --- Socket.io Logic ---
io.on('connection', (socket) => {
  console.log(`[Socket] A user connected: ${socket.id}`);

  // Listener for the initial combined state from the main app
  socket.on('initState', (initialState) => {
    if (initialState && typeof initialState === 'object') {
        fullState = initialState;
        console.log(`[Socket] Received 'initState'. State cache primed.`);
    }
  });

  // Listener for subsequent state updates
  socket.on('updateState', (newState) => {
    if (newState && typeof newState === 'object') {
        fullState = newState;
        // Broadcast the full state to all clients
        io.emit('stateUpdated', fullState);
        console.log(`[Socket] Received 'updateState'. Broadcasting 'stateUpdated'.`);
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
