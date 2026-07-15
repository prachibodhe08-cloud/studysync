const state = {
  room: 'calc-room',
  user: 'Student',
  groups: [],
  resources: [],
  quizzes: [],
  tutors: []
};

const roomInput = document.getElementById('roomName');
const userInput = document.getElementById('userName');
const chatInput = document.getElementById('chatInput');
const chatFeed = document.getElementById('chatFeed');
const sendButton = document.getElementById('sendButton');
const clearButton = document.getElementById('clearButton');
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

const groupsList = document.getElementById('groupsList');
const resourcesList = document.getElementById('resourcesList');
const quizzesList = document.getElementById('quizzesList');
const tutorsList = document.getElementById('tutorsList');

const groupCount = document.getElementById('groupCount');
const resourceCount = document.getElementById('resourceCount');
const quizCount = document.getElementById('quizCount');
const tutorCount = document.getElementById('tutorCount');

let isDrawing = false;
let lastPoint = null;

function renderLists() {
  groupsList.innerHTML = state.groups.map((group) => `<li><strong>${group.name}</strong> · ${group.members} members · invite ${group.inviteCode}</li>`).join('');
  resourcesList.innerHTML = state.resources.map((resource) => `<li>${resource.title} · ${resource.type}</li>`).join('');
  quizzesList.innerHTML = state.quizzes.map((quiz) => `<li>${quiz.title} · ${quiz.cards} cards</li>`).join('');
  tutorsList.innerHTML = state.tutors.map((tutor) => `<li>${tutor.name} · ${tutor.specialty} · $${tutor.rate}/hr</li>`).join('');

  groupCount.textContent = state.groups.length;
  resourceCount.textContent = state.resources.length;
  quizCount.textContent = state.quizzes.length;
  tutorCount.textContent = state.tutors.length;
}

async function loadData() {
  const [groupsRes, resourcesRes, quizzesRes, tutorsRes] = await Promise.all([
    fetch('/api/groups'),
    fetch('/api/resources'),
    fetch('/api/quizzes'),
    fetch('/api/tutors')
  ]);

  state.groups = await groupsRes.json();
  state.resources = await resourcesRes.json();
  state.quizzes = await quizzesRes.json();
  state.tutors = await tutorsRes.json();
  renderLists();
}

function appendMessage(message) {
  const item = document.createElement('div');
  item.innerHTML = `<strong>${message.user}</strong>: ${message.text}`;
  chatFeed.appendChild(item);
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawLine(x1, y1, x2, y2) {
  ctx.strokeStyle = '#2c7be5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function handlePointerDown(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  isDrawing = true;
  lastPoint = { x, y };
}

function handlePointerMove(event) {
  if (!isDrawing || !lastPoint) return;
  const rect = canvas.getBoundingClientRect();
  const x2 = event.clientX - rect.left;
  const y2 = event.clientY - rect.top;
  drawLine(lastPoint.x, lastPoint.y, x2, y2);
  lastPoint = { x: x2, y: y2 };
}

function handlePointerUp() {
  isDrawing = false;
  lastPoint = null;
}

roomInput.addEventListener('change', () => {
  state.room = roomInput.value;
});

userInput.addEventListener('change', () => {
  state.user = userInput.value;
});

sendButton.addEventListener('click', () => {
  const text = chatInput.value.trim();
  if (!text) return;
  appendMessage({ user: state.user, text });
  chatInput.value = '';
});

clearButton.addEventListener('click', clearCanvas);
canvas.addEventListener('pointerdown', handlePointerDown);
canvas.addEventListener('pointermove', handlePointerMove);
canvas.addEventListener('pointerup', handlePointerUp);
canvas.addEventListener('pointerleave', handlePointerUp);

loadData();
