# Chat Application - WebSocket Based

A modern real-time chat application built using **HTML, CSS, JavaScript (frontend)** and **Node.js + WebSocket (backend)**.

## 🚀 Features

* 👥 Join or create chat rooms
* 💬 Real-time messaging
* 😊 Emoji picker support
* 👨‍💻 Username prompt and validation
* 🧭 Responsive UI design

---

## 🧾 Requirements

* Node.js (v14 or later)
* A modern web browser (Chrome, Edge, Firefox, etc.)

---

## 📂 Project Structure

```
├── index.html         # Frontend UI
├── style.css          # Styling for chat app
├── script.js          # Main frontend logic (WebSocket + UI handling)
├── server.js          # WebSocket server using Node.js
├── README.md          # Project documentation
```

---

## 🛠 Installation & Running

### 1. Clone the repo or download it

```bash
(https://github.com//chat-app.git](https://github.com/ishu7219/Chat-Application)
```

### 2. Install dependencies (WebSocket only)

```bash
npm install ws
```

### 3. Start the WebSocket server

```bash
node server.js
```

### 4. Open the app in browser

Double-click `index.html` or open via Live Server:

```
http://127.0.0.1:5500/index.html
```

Make sure server.js is running at:

```
ws://localhost:8080
```

---

## 😊 Emoji Picker

Powered by [@joeattardi/emoji-button](https://github.com/joeattardi/emoji-button).

---

## 🔐 Username Rules

* 3–16 characters
* Only letters, numbers, and underscores
* Must be unique (case-insensitive)

---

## ✨ Future Improvements

* Message timestamps in full date/time format
* Drag & drop file support
* Image preview before sending
* Server-side file storage (optional)
* Typing indicators

---

## 📄 License

MIT License. Free for personal and academic use.

---

Built with ❤️ using WebSockets.
