import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createSocketHandlers, getBoard, setBoard } from '../socket/index.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());

const groups = [
  { id: 'g1', name: 'Calculus 101', members: 12, inviteCode: 'CALC-101' },
  { id: 'g2', name: 'Biology Sprint', members: 8, inviteCode: 'BIO-204' },
];

const resources = [
  { id: 'r1', title: 'Limits Cheat Sheet', type: 'PDF', groupId: 'g1' },
  { id: 'r2', title: 'Cell Structure Notes', type: 'PNG', groupId: 'g2' },
];

const quizzes = [
  { id: 'q1', title: 'Derivative Warm-Up', cards: 6, groupId: 'g1' },
  { id: 'q2', title: 'Photosynthesis Quiz', cards: 4, groupId: 'g2' },
];

const tutors = [
  { id: 't1', name: 'Mina K.', specialty: 'Calculus', rate: 22, available: true },
  { id: 't2', name: 'Aiden R.', specialty: 'Biology', rate: 19, available: true },
];

const bookings = []; // in-memory bookings store

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'studysync-server' });
});

app.get('/api/groups', (_req, res) => {
  res.json(groups);
});

app.post('/api/groups', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Group name is required' });
  }

  const group = {
    id: `${Date.now()}`,
    name,
    members: 1,
    inviteCode: `${name.toUpperCase().replace(/\s+/g, '-')}-${Math.floor(Math.random() * 90 + 10)}`,
  };

  groups.push(group);
  res.status(201).json(group);
});

app.get('/api/resources', (_req, res) => {
  res.json(resources);
});

app.get('/api/quizzes', (_req, res) => {
  res.json(quizzes);
});

app.get('/api/tutors', (_req, res) => {
  res.json(tutors);
});

app.get('/api/bookings', (_req, res) => {
  res.json(bookings);
});

app.post('/api/bookings', (req, res) => {
  const { tutorId, studentName, date, time, duration, notes } = req.body;
  if (!tutorId || !studentName || !date || !time) {
    return res.status(400).json({ message: 'Missing required booking fields' });
  }
  const id = `bk_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
  const tutor = tutors.find(t => t.id === tutorId) || null;
  const booking = { id, tutorId, tutorName: tutor?.name || 'Unknown', studentName, date, time, duration: duration || 60, notes: notes || '' };
  bookings.push(booking);
  res.status(201).json({ message: 'booking created', booking });
});

app.get('/api/board/:room', (req, res) => {
  const { room } = req.params;
  const board = getBoard(room);
  res.json(board);
});

app.post('/api/board/:room', (req, res) => {
  const { room } = req.params;
  const board = req.body;
  setBoard(room, board);
  res.status(200).json({ message: 'saved' });
});

createSocketHandlers(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`StudySync server listening on ${PORT}`);
});
