const boards = {}; // { [room]: { strokes: [], stickies: [], notes: '' } }
const redoStacks = {}; // { [room]: [] }

export function getBoard(room) {
  return boards[room] || { strokes: [], stickies: [], notes: '' };
}

export function setBoard(room, board) {
  boards[room] = board;
}

export function createSocketHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('joinRoom', (room) => {
      socket.join(room);
      socket.emit('roomJoined', room);
    });

    socket.on('chatMessage', ({ room, user, text }) => {
      io.to(room).emit('chatMessage', {
        user,
        text,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on('draw', (payload) => {
      const { room } = payload;
      boards[room] = boards[room] || { strokes: [], stickies: [], notes: '' };
      boards[room].strokes.push(payload);
      redoStacks[room] = [];
      socket.to(room).emit('draw', payload);
    });

    socket.on('undo', (room) => {
      boards[room] = boards[room] || { strokes: [], stickies: [], notes: '' };
      redoStacks[room] = redoStacks[room] || [];
      const stroke = boards[room].strokes.pop();
      if (stroke) redoStacks[room].push(stroke);
      io.to(room).emit('boardState', { strokes: boards[room].strokes, stickies: boards[room].stickies });
    });

    socket.on('redo', (room) => {
      redoStacks[room] = redoStacks[room] || [];
      boards[room] = boards[room] || { strokes: [], stickies: [], notes: '' };
      const stroke = redoStacks[room].pop();
      if (stroke) boards[room].strokes.push(stroke);
      io.to(room).emit('boardState', { strokes: boards[room].strokes, stickies: boards[room].stickies });
    });

    socket.on('drawText', (payload) => {
      const { room } = payload;
      boards[room] = boards[room] || { strokes: [], stickies: [], notes: '' };
      // store as a sticky
      const sticky = { id: Date.now() + '-' + Math.random().toString(36).slice(2,6), x: payload.x, y: payload.y, text: payload.text, color: payload.color, fontSize: payload.fontSize };
      boards[room].stickies.push(sticky);
      socket.to(room).emit('drawText', { ...sticky });
    });

    socket.on('createSticky', ({ room, sticky }) => {
      boards[room] = boards[room] || { strokes: [], stickies: [], notes: '' };
      boards[room].stickies.push(sticky);
      socket.to(room).emit('createSticky', sticky);
    });

    socket.on('updateSticky', ({ room, sticky }) => {
      boards[room] = boards[room] || { strokes: [], stickies: [], notes: '' };
      const idx = boards[room].stickies.findIndex(s => s.id === sticky.id);
      if (idx >= 0) boards[room].stickies[idx] = sticky;
      socket.to(room).emit('updateSticky', sticky);
    });

    socket.on('deleteSticky', ({ room, id }) => {
      boards[room] = boards[room] || { strokes: [], stickies: [], notes: '' };
      boards[room].stickies = boards[room].stickies.filter(s => s.id !== id);
      socket.to(room).emit('deleteSticky', id);
    });

    socket.on('saveNotes', ({ room, notes }) => {
      boards[room] = boards[room] || { strokes: [], stickies: [], notes: '' };
      boards[room].notes = notes;
      socket.to(room).emit('notesSaved', { notes });
    });

    socket.on('cursorMove', ({ room, user, x, y }) => {
      socket.to(room).emit('cursorMove', { user, x, y });
    });

    socket.on('clearBoard', (room) => {
      io.to(room).emit('clearBoard');
    });
  });
}
