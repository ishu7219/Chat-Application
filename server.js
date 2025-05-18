// server.js
const WebSocket = require('ws');
const http = require('http');

const PORT = 8080;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

let rooms = {}; // { roomName: Set of clients }
let usernames = new Map(); // client -> username

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch {
      return ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
    }

    switch (msg.type) {
      case 'user':
        usernames.set(ws, msg.user);
        sendRoomList(ws);
        break;

      case 'create_room':
        if (!rooms[msg.room]) {
          rooms[msg.room] = new Set();
        }
        broadcastRoomList();
        break;

      case 'join':
        leaveCurrentRoom(ws);
        if (!rooms[msg.room]) rooms[msg.room] = new Set();
        rooms[msg.room].add(ws);
        ws.room = msg.room;
        broadcastUserList(msg.room);
        break;

      case 'leave':
        leaveCurrentRoom(ws);
        break;

      case 'message':
        if (!ws.room) return;
        broadcastToRoom(ws.room, {
          type: 'message',
          room: ws.room,
          message: msg.message,
          user: usernames.get(ws),
          timestamp: msg.timestamp || Date.now()
        });
        break;
    }
  });

  ws.on('close', () => {
    leaveCurrentRoom(ws);
    usernames.delete(ws);
  });
});

function sendRoomList(ws) {
  ws.send(JSON.stringify({ type: 'room_list', rooms: Object.keys(rooms) }));
}

function broadcastRoomList() {
  const msg = JSON.stringify({ type: 'room_list', rooms: Object.keys(rooms) });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

function broadcastUserList(room) {
  if (!rooms[room]) return;
  const users = [...rooms[room]].map(ws => usernames.get(ws));
  const msg = JSON.stringify({ type: 'user_list', room, users });
  rooms[room].forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

function broadcastToRoom(room, message) {
  if (!rooms[room]) return;
  const msg = JSON.stringify(message);
  rooms[room].forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

function leaveCurrentRoom(ws) {
  if (ws.room && rooms[ws.room]) {
    rooms[ws.room].delete(ws);
    if (rooms[ws.room].size === 0) {
      delete rooms[ws.room];
    } else {
      broadcastUserList(ws.room);
    }
    delete ws.room;
  }
}

server.listen(PORT, () => {
  console.log(`WebSocket server running at ws://localhost:${PORT}`);
});
