(() => {
  // Elements
  const modal = document.getElementById('modal');
  const usernameInput = document.getElementById('username-input');
  const usernameSubmit = document.getElementById('username-submit');
  const usernameError = document.getElementById('username-error');
  const usernameDisplay = document.getElementById('username-display');
  const socket = new WebSocket("wss://chat-application-1-k8ef.onrender.com");

  const roomList = document.getElementById('room-list');
  const userList = document.getElementById('user-list');
  const newRoomInput = document.getElementById('new-room-name');
  const createRoomBtn = document.getElementById('btn-create-room');

  const roomTitle = document.getElementById('room-title');
  const messagesDiv = document.getElementById('messages');

  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const fileInput = document.getElementById('file-input');
  const emojiBtn = document.getElementById('emoji-btn');
  const fileBtn = document.getElementById('file-btn');

  const mainSection = document.querySelector('.chat-container');

  // State
  let username = '';
  let currentRoom = '';
  let ws;
  let rooms = [];
  let usersInRoom = new Set();
  let usedUsernames = new Set();

  function formatMessage(text) {
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    return text;
  }

  function showModalError(msg) {
    usernameError.textContent = msg;
    usernameError.style.display = 'block';
  }

  function validateUsername(name) {
    if (!name) return "Username cannot be empty";
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(name)) return "Username must be 3-16 chars, letters, numbers, underscore";
    if (usedUsernames.has(name.toLowerCase())) return "Username already in use";
    return null;
  }

  function setStatus(message) {
    roomTitle.textContent = message;
  }

  function addRoomToList(room) {
    if (rooms.includes(room)) return;
    rooms.push(room);
    const li = document.createElement('li');
    li.textContent = room;
    li.tabIndex = 0;
    li.setAttribute('role', 'option');
    li.addEventListener('click', () => selectRoom(room));
    li.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectRoom(room);
      }
    });
    roomList.appendChild(li);
  }

  function updateUserList(users) {
    usersInRoom = new Set(users);
    userList.innerHTML = '';
    users.forEach(user => {
      const li = document.createElement('li');
      li.textContent = user;
      userList.appendChild(li);
    });
  }

  function clearMessages() {
    messagesDiv.innerHTML = '';
  }

  function renderMessage({ username: sender, message, file, filename, timestamp, self = false }) {
    const el = document.createElement('div');
    el.classList.add('message', self ? 'sent' : 'received');

    const meta = document.createElement('div');
    meta.className = 'meta';
    const timeStr = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    meta.textContent = `${sender} • ${timeStr}`;
    el.appendChild(meta);

    const messageContent = document.createElement('div');

    if (file) {
      if (file.startsWith("data:image")) {
        messageContent.innerHTML = `<img src="${file}" alt="image" style="max-width: 200px; border-radius: 8px;" />`;
      } else {
        messageContent.innerHTML = `<a href="${file}" download="${filename}" target="_blank">📎 ${filename}</a>`;
      }
    } else {
      messageContent.innerHTML = formatMessage(message);
    }

    el.appendChild(messageContent);
    messagesDiv.appendChild(el);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function selectRoom(room) {
    if (room === currentRoom) return;
    if (ws) {
      ws.send(JSON.stringify({ type: 'leave', room: currentRoom, user: username }));
    }
    currentRoom = room;
    updateRoomListUI();
    setStatus(`Room: ${room}`);
    clearMessages();
    if (ws) {
      ws.send(JSON.stringify({ type: 'join', room, user: username }));
      sendBtn.disabled = false;
      messageInput.disabled = false;
      messageInput.focus();
    }
    updateUserList([]);
  }

  function updateRoomListUI() {
    [...roomList.children].forEach(li => {
      li.classList.toggle('active', li.textContent === currentRoom);
    });
  }

  function connectWebSocket() {
    ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
      if (currentRoom) {
        ws.send(JSON.stringify({ type: 'join', room: currentRoom, user: username }));
      }
      ws.send(JSON.stringify({ type: 'user', user: username }));
      sendBtn.disabled = false;
      messageInput.disabled = false;
      messageInput.focus();
    };

    ws.onmessage = ({ data }) => {
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch {
        console.warn('Invalid JSON:', data);
        return;
      }

      switch (parsed.type) {
        case 'room_list':
          rooms = parsed.rooms || [];
          roomList.innerHTML = '';
          rooms.forEach(addRoomToList);
          if (!currentRoom && rooms.length > 0) {
            selectRoom(rooms[0]);
          }
          break;
        case 'user_list':
          if (parsed.room === currentRoom) {
            updateUserList(parsed.users);
          }
          break;
        case 'message':
          if (parsed.room === currentRoom) {
            renderMessage({
              username: parsed.user,
              message: parsed.message,
              file: parsed.file,
              filename: parsed.filename,
              timestamp: parsed.timestamp || Date.now(),
              self: parsed.user === username,
            });
          }
          break;
        case 'error':
          alert(`Error from server: ${parsed.message || 'Unknown error'}`);
          break;
      }
    };

    ws.onclose = () => {
      sendBtn.disabled = true;
      messageInput.disabled = true;
      console.log('WebSocket closed. Reconnecting in 3 seconds...');
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      ws.close();
    };
  }

  function sendMessage() {
    const msg = messageInput.value.trim();
    if (!msg && !fileInput.files[0]) return;

    const payload = {
      type: 'message',
      room: currentRoom,
      message: msg,
      user: username,
      timestamp: Date.now()
    };

    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        payload.file = reader.result;
        payload.filename = file.name;
        ws.send(JSON.stringify(payload));
      };
      reader.readAsDataURL(file);
      fileInput.value = '';
    } else {
      ws.send(JSON.stringify(payload));
    }

    messageInput.value = '';
    messageInput.style.height = 'auto';
  }

  function createRoom() {
    const newRoom = newRoomInput.value.trim();
    if (!newRoom) return;
    if (rooms.includes(newRoom)) {
      alert('Room already exists');
      return;
    }
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'create_room', room: newRoom }));
      newRoomInput.value = '';
      selectRoom(newRoom);
    }
  }

  // UI Event Bindings
  messageInput.addEventListener('input', e => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  });

  sendBtn.addEventListener('click', e => {
    e.preventDefault();
    sendMessage();
  });

  createRoomBtn.addEventListener('click', createRoom);

  newRoomInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      createRoomBtn.click();
    }
  });

  messageInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  usernameSubmit.addEventListener('click', () => {
    const val = usernameInput.value.trim();
    const err = validateUsername(val);
    if (err) {
      showModalError(err);
      return;
    }
    username = val;
    usedUsernames.add(username.toLowerCase());
    usernameDisplay.textContent = username;
    modal.style.display = 'none';
    mainSection.style.display = 'flex';
    roomList.innerHTML = '';
    rooms = [];
    sendBtn.disabled = true;
    messageInput.disabled = true;
    connectWebSocket();
  });

  usernameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      usernameSubmit.click();
    }
  });

  fileBtn.addEventListener('click', () => {
    fileInput.click();
  });

  if (window.EmojiButton) {
    const picker = new EmojiButton();
    picker.on('emoji', emoji => {
      messageInput.value += emoji;
      messageInput.focus();
    });
    emojiBtn.addEventListener('click', () => picker.togglePicker(emojiBtn));
  }

  modal.style.display = 'flex';
  mainSection.style.display = 'none';
  usernameInput.focus();
})();
