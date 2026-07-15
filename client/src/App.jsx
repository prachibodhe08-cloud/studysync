import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

function App() {
  const canvasRef = useRef(null);
  const [groups, setGroups] = useState([]);
  const [resources, setResources] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [room, setRoom] = useState('calc-room');
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [name, setName] = useState('Student');
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState(null);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#2c7be5');
  const [lineWidth, setLineWidth] = useState(2);
  const [fontSize, setFontSize] = useState(18);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [strokes, setStrokes] = useState([]);
  const [stickies, setStickies] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [studyStreak, setStudyStreak] = useState(0);
  const [totalMinutesStudied, setTotalMinutesStudied] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({ tutorId: null, tutorName: '', date: '', time: '', duration: 60, notes: '' });
  const [bookingConfirmation, setBookingConfirmation] = useState(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourcePreview, setResourcePreview] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [quizSession, setQuizSession] = useState(null); // { quiz, index }

  useEffect(() => {
    if (!isLoggedIn) return;
    
    // Mock data for real-world content
    const mockGroups = [
      { id: 1, name: 'Advanced Calculus', members: 12, inviteCode: 'ADV-CALC-2024' },
      { id: 2, name: 'Data Science Basics', members: 8, inviteCode: 'DS-101-2024' },
      { id: 3, name: 'Web Development', members: 15, inviteCode: 'WEB-DEV-2024' },
      { id: 4, name: 'Machine Learning Basics', members: 10, inviteCode: 'ML-101-2024' },
    ];
    
    const mockResources = [
      { id: 1, title: 'Calculus Fundamentals PDF', type: 'PDF', groupId: 1, content: 'PDF content: Limits, derivatives, examples and solved problems.' },
      { id: 2, title: 'Python for Data Science', type: 'Video', groupId: 2, content: 'https://example.com/videos/python-data-science.mp4' },
      { id: 3, title: 'React Hooks Tutorial', type: 'Article', groupId: 3, content: 'Article: Using useState, useEffect and custom hooks in React.' },
      { id: 4, title: 'Linear Algebra Notes', type: 'PDF', groupId: 4, content: 'PDF content: Vectors, matrices, eigenvalues.' },
      { id: 5, title: 'JavaScript Async/Await Guide', type: 'Article', groupId: 3, content: 'Article: How to use async/await and promises effectively.' },
      { id: 6, title: 'ML Model Training Video', type: 'Video', groupId: 4, content: 'https://example.com/videos/ml-training.mp4' },
    ];
    
    const mockQuizzes = [
      { id: 1, title: 'Derivatives Test', cards: [ 'Define derivative', 'Power rule examples', 'Chain rule question', 'Product rule question', 'Integration hint' ] , groupId:1},
      { id: 2, title: 'Python Basics Quiz', cards: [ 'What is a list?', 'Explain dicts', 'Write a for-loop example' ], groupId:2},
      { id: 3, title: 'React Concepts', cards: [ 'What is JSX?', 'useState example', 'useEffect lifecycle' ], groupId:3},
      { id: 4, title: 'Statistics Challenge', cards: [ 'Mean/median/mode', 'Standard deviation question', 'Probability basics' ], groupId:4},
    ];
    
    const mockTutors = [
      { id: 1, name: 'Dr. Sarah Chen', specialty: 'Mathematics', rate: 45 },
      { id: 2, name: 'Alex Rodriguez', specialty: 'Python Programming', rate: 35 },
      { id: 3, name: 'Emily Watson', specialty: 'Web Development', rate: 40 },
      { id: 4, name: 'Raj Patel', specialty: 'Machine Learning', rate: 50 },
    ];

    setGroups(mockGroups);
    setResources(mockResources);
    setQuizzes(mockQuizzes);
    setTutors(mockTutors);

    socket.emit('joinRoom', room);
    socket.on('chatMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });
    socket.on('draw', (payload) => {
      // add stroke and draw
      setStrokes((prev) => [...prev, payload]);
      drawFromSocket(payload);
    });
    socket.on('drawText', (payload) => {
      drawTextFromSocket(payload);
    });
    socket.on('boardState', ({ strokes: s, stickies: st }) => {
      setStrokes(s || []);
      setStickies(st || []);
      // redraw full board
      setTimeout(() => redrawCanvas(s || [], st || []), 0);
    });
    socket.on('createSticky', (sticky) => setStickies(prev => [...prev, sticky]));
    socket.on('updateSticky', (sticky) => setStickies(prev => prev.map(s => s.id === sticky.id ? sticky : s)));
    socket.on('deleteSticky', (id) => setStickies(prev => prev.filter(s => s.id !== id)));
    socket.on('cursorMove', ({ user, x, y }) => {
      setRemoteCursors(prev => ({ ...prev, [user]: { x, y } }));
    });
    socket.on('clearBoard', () => {
      clearCanvas();
    });
    socket.on('notesSaved', ({ notes }) => {
      setNotes(notes);
      addNotification('Notes updated in room');
    });
    socket.on('userJoined', (user) => {
      setOnlineUsers((prev) => [...new Set([...prev, user])]);
      addNotification(`${user} joined the room`);
    });
    socket.on('userLeft', (user) => {
      setOnlineUsers((prev) => prev.filter((u) => u !== user));
      addNotification(`${user} left the room`);
    });

    return () => {
      socket.off('chatMessage');
      socket.off('draw');
      socket.off('clearBoard');
      socket.off('userJoined');
      socket.off('userLeft');
    };
  }, [room, isLoggedIn]);

  // Timer effect with streak tracking
  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        if (timerSeconds > 0) {
          setTimerSeconds(timerSeconds - 1);
        } else if (timerMinutes > 0) {
          setTimerMinutes(timerMinutes - 1);
          setTimerSeconds(59);
        } else {
          setIsTimerRunning(false);
          const minutesCompleted = timerMinutes === 0 ? timerSeconds : 25; // Update based on what was set
          setTotalMinutesStudied(prev => prev + minutesCompleted);
          setStudyStreak(prev => prev + 1);
          addNotification('🎉 Study session complete!');
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerMinutes, timerSeconds]);

  const stats = useMemo(() => ({
    groups: groups.length,
    resources: resources.length,
    quizzes: quizzes.length,
    tutors: tutors.length,
  }), [groups, resources, quizzes, tutors]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    socket.emit('chatMessage', { room, user: name, text: messageText });
    setMessageText('');
  };

  const getCanvasContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return ctx;
  };

  const redrawCanvas = (s = strokes, st = stickies) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if (s && s.length) {
      s.forEach(seg => {
        ctx.strokeStyle = seg.color || '#2c7be5';
        ctx.lineWidth = seg.lineWidth || 2;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
      });
    }
    // draw stickies as text
    if (st && st.length) {
      st.forEach(sticky => {
        ctx.fillStyle = sticky.color || '#222';
        ctx.font = `${sticky.fontSize || 18}px sans-serif`;
        ctx.fillText(sticky.text, sticky.x, sticky.y);
      });
    }
  };

  const drawFromSocket = ({ x1, y1, x2, y2 }) => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    ctx.strokeStyle = (arguments[0] && arguments[0].color) || color || '#2c7be5';
    ctx.lineWidth = (arguments[0] && arguments[0].lineWidth) || lineWidth || 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  const drawTextFromSocket = ({ x, y, text, color: tColor, fontSize: fSize }) => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    ctx.fillStyle = tColor || '#222';
    ctx.font = `${fSize || 18}px sans-serif`;
    ctx.fillText(text, x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handlePointerDown = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (tool === 'text') {
      // create a sticky
      const sticky = { id: Date.now() + '-' + Math.random().toString(36).slice(2,6), x, y, text: 'New note', color, fontSize };
      setStickies(prev => [...prev, sticky]);
      socket.emit('createSticky', { room, sticky });
      return;
    }

    setLastPoint({ x, y });
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (event) => {
    if (!isDrawing || !lastPoint) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x2 = event.clientX - rect.left;
    const y2 = event.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    socket.emit('draw', { room, x1: lastPoint.x, y1: lastPoint.y, x2, y2, color, lineWidth });
    setLastPoint({ x: x2, y: y2 });
  };

  const handleUndo = () => {
    socket.emit('undo', room);
  };

  const handleRedo = () => {
    socket.emit('redo', room);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${room}-whiteboard.png`;
    a.click();
  };

  const joinGroup = (group) => {
    // increment members locally and notify
    setGroups(prev => prev.map(g => g.id === group.id ? { ...g, members: g.members + 1 } : g));
    addNotification(`You joined ${group.name}`);
  };

  const viewGroup = (group) => {
    setSelectedGroup(group);
    setShowGroupModal(true);
  };

  const openResource = (resource) => {
    setResourcePreview(resource);
    setShowResourceModal(true);
  };

  const startQuiz = (quiz) => {
    setQuizSession({ quiz, index: 0 });
  };

  const advanceQuiz = (delta) => {
    setQuizSession(prev => {
      if (!prev) return prev;
      const next = prev.index + delta;
      if (next < 0 || next >= prev.quiz.cards.length) return prev;
      return { ...prev, index: next };
    });
  };

  const finishQuiz = () => {
    addNotification('Quiz complete');
    setQuizSession(null);
  };

  const openBooking = (tutor) => {
    setBookingForm({ tutorId: tutor.id, tutorName: tutor.name, date: '', time: '', duration: 60, notes: '' });
    setBookingModalOpen(true);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      addNotification('Please fill in all fields');
      return;
    }
    // Mock authentication
    setUserProfile({ email, name: email.split('@')[0], avatar: '👤' });
    setIsLoggedIn(true);
    setName(email.split('@')[0]);
    setEmail('');
    setPassword('');
    addNotification(`Welcome, ${email.split('@')[0]}!`);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserProfile(null);
    setMessages([]);
    setNotes('');
    setStudyStreak(0);
    setTotalMinutesStudied(0);
    addNotification('Logged out successfully');
  };

  const addNotification = (message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 3000);
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerMinutes(25);
    setTimerSeconds(0);
  };

  const setQuickTimer = (minutes) => {
    setIsTimerRunning(false);
    setTimerMinutes(minutes);
    setTimerSeconds(0);
  };

  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === 'all' || r.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [resources, searchQuery, filterType]);

  const filteredGroups = useMemo(() => {
    return groups.filter(g => 
      g.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [groups, searchQuery]);

  return (
    <div className={`app-shell ${darkMode ? 'dark' : 'light'}`}>
      {/* Notifications */}
      <div className="notifications-container">
        {notifications.map(notif => (
          <div key={notif.id} className="notification">
            {notif.message}
          </div>
        ))}
      </div>

      {!isLoggedIn ? (
        /* Login Screen */
        <div className="login-container">
          <div className="login-card">
            <h1>📚 StudySync</h1>
            <p className="login-tagline">Your AI-powered study companion</p>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" className="login-btn">Sign In</button>
            </form>
            <p className="login-footer">Demo: Use any email/password to continue</p>
          </div>
        </div>
      ) : (
        <>
          {/* Header with Profile */}
          <header className="app-header">
            <div className="header-left">
              <h1>📚 StudySync</h1>
              <span className="user-badge">{userProfile?.name}</span>
            </div>
            <div className="header-right">
              <button className="icon-btn" onClick={() => setShowSettings(!showSettings)}>⚙️</button>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </header>

          {/* Settings Panel */}
          {showSettings && (
            <div className="settings-panel">
              <label>
                <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
                Dark Mode
              </label>
            </div>
          )}

          {/* Stats Bar */}
          <div className="achievements-bar">
            <div className="achievement">🔥 Streak: {studyStreak} days</div>
            <div className="achievement">⏱️ Studied: {totalMinutesStudied} mins</div>
            <div className="achievement">🟢 Online: {onlineUsers.length}</div>
          </div>

          {/* Navigation Tabs */}
          <nav className="tabs">
            <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📊 Overview</button>
            <button className={`tab ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => setActiveTab('groups')}>👥 Groups</button>
            <button className={`tab ${activeTab === 'timer' ? 'active' : ''}`} onClick={() => setActiveTab('timer')}>⏱️ Timer</button>
            <button className={`tab ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>📝 Notes</button>
            <button className={`tab ${activeTab === 'collaborate' ? 'active' : ''}`} onClick={() => setActiveTab('collaborate')}>🤝 Collaborate</button>
          </nav>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <section className="stats-grid">
                <article className="stat-card">
                  <strong>{groups.length}</strong>
                  <span>Study Groups</span>
                  <small>Join a community</small>
                </article>
                <article className="stat-card">
                  <strong>{resources.length}</strong>
                  <span>Resources</span>
                  <small>Learning materials</small>
                </article>
                <article className="stat-card">
                  <strong>{quizzes.length}</strong>
                  <span>Quizzes</span>
                  <small>Test yourself</small>
                </article>
                <article className="stat-card">
                  <strong>{tutors.length}</strong>
                  <span>Tutors</span>
                  <small>Get help</small>
                </article>
              </section>

              <main className="content-grid">
                <section className="panel">
                  <h3>📚 Study Groups</h3>
                  <ul className="items-list">
                    {groups.map((group) => (
                      <li key={group.id} className="item-card">
                        <div className="item-title">{group.name}</div>
                        <div className="item-meta">{group.members} members · Code: {group.inviteCode}</div>
                        <button className="join-btn" onClick={() => joinGroup(group)}>Join Group</button>
                        <button onClick={() => viewGroup(group)}>📋 View</button>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="panel">
                  <h3>📁 Resources</h3>
                  <div className="filter-controls">
                    <input
                      type="text"
                      placeholder="Search resources..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
                      <option value="all">All Types</option>
                      <option value="PDF">PDF</option>
                      <option value="Video">Video</option>
                      <option value="Article">Article</option>
                    </select>
                  </div>
                  <ul className="items-list">
                    {filteredResources.map((resource) => (
                      <li key={resource.id} className="item-card">
                        <div className="item-title">{resource.title}</div>
                        <div className="item-meta">{resource.type}</div>
                        <button className="download-btn" onClick={() => openResource(resource)}>📥 Access</button>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="panel">
                  <h3>📝 Quizzes</h3>
                  <ul className="items-list">
                    {quizzes.map((quiz) => (
                      <li key={quiz.id} className="item-card">
                        <div className="item-title">{quiz.title}</div>
                        <div className="item-meta">{quiz.cards.length} flashcards</div>
                        <button className="start-btn" onClick={() => startQuiz(quiz)}>▶️ Start</button>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="panel">
                  <h3>👨‍🏫 Tutor Marketplace</h3>
                  <ul className="items-list">
                    {tutors.map((tutor) => (
                      <li key={tutor.id} className="item-card">
                        <div className="item-title">{tutor.name}</div>
                        <div className="item-meta">{tutor.specialty}</div>
                        <div className="item-price">${tutor.rate}/hour</div>
                          <button className="book-btn" onClick={() => openBooking(tutor)}>📅 Book Session</button>
                      </li>
                    ))}
                  </ul>
                </section>
                {bookingModalOpen && (
                  <div className="modal-backdrop">
                    <div className="modal">
                      <h3>Book session with {bookingForm.tutorName}</h3>
                      <label>Date: <input type="date" value={bookingForm.date} onChange={(e) => setBookingForm(f => ({ ...f, date: e.target.value }))} /></label>
                      <label>Time: <input type="time" value={bookingForm.time} onChange={(e) => setBookingForm(f => ({ ...f, time: e.target.value }))} /></label>
                      <label>Duration (mins): <input type="number" min="15" value={bookingForm.duration} onChange={(e) => setBookingForm(f => ({ ...f, duration: Number(e.target.value) }))} /></label>
                      <label>Notes: <textarea value={bookingForm.notes} onChange={(e) => setBookingForm(f => ({ ...f, notes: e.target.value }))} /></label>
                      <div className="modal-actions">
                        <button onClick={() => { setBookingModalOpen(false); setBookingForm({ tutorId: null, tutorName: '', date: '', time: '', duration: 60, notes: '' }); }}>Cancel</button>
                        <button onClick={async () => {
                          const payload = { ...bookingForm, studentName: userProfile?.name || name };
                          try {
                            const res = await fetch('http://localhost:3001/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                            const data = await res.json();
                            if (res.ok) {
                              setBookingConfirmation(data.booking);
                              addNotification('Booking confirmed');
                            } else {
                              addNotification(data.message || 'Booking failed');
                            }
                          } catch (err) {
                            addNotification('Booking request failed');
                          }
                          setBookingModalOpen(false);
                        }}>Confirm Booking</button>
                      </div>
                    </div>
                  </div>
                )}
                {showResourceModal && resourcePreview && (
                  <div className="modal-backdrop">
                    <div className="modal">
                      <h3>{resourcePreview.title}</h3>
                      <p>Type: {resourcePreview.type}</p>
                      {resourcePreview.type === 'Article' && (
                        <div className="resource-article">
                          <p>{resourcePreview.content}</p>
                        </div>
                      )}
                      {resourcePreview.type === 'PDF' && (
                        <div className="resource-pdf">
                          <p>{resourcePreview.content}</p>
                        </div>
                      )}
                      {resourcePreview.type === 'Video' && (
                        <div className="resource-video">
                          <p>Video URL: {resourcePreview.content}</p>
                        </div>
                      )}
                      <div className="modal-actions">
                        <button onClick={() => setShowResourceModal(false)}>Close</button>
                        <button onClick={() => { setShowResourceModal(false); addNotification('Resource accessed'); }}>Open</button>
                      </div>
                    </div>
                  </div>
                )}

                {showGroupModal && selectedGroup && (
                  <div className="modal-backdrop">
                    <div className="modal">
                      <h3>{selectedGroup.name}</h3>
                      <p>Members: {selectedGroup.members}</p>
                      <p>Invite Code: {selectedGroup.inviteCode}</p>
                      <h4>Related Resources</h4>
                      <ul>
                        {resources.filter(r => r.groupId === selectedGroup.id).map(r => (
                          <li key={r.id}>{r.title} — <button onClick={() => { setShowGroupModal(false); openResource(r); }}>Open</button></li>
                        ))}
                      </ul>
                      <h4>Related Quizzes</h4>
                      <ul>
                        {quizzes.filter(q => q.groupId === selectedGroup.id).map(q => (
                          <li key={q.id}>{q.title} — <button onClick={() => { setShowGroupModal(false); startQuiz(q); }}>Start</button></li>
                        ))}
                      </ul>
                      <div className="modal-actions">
                        <button onClick={() => setShowGroupModal(false)}>Close</button>
                        <button onClick={() => { navigator.clipboard?.writeText(selectedGroup.inviteCode); addNotification('Invite code copied'); }}>Copy Code</button>
                      </div>
                    </div>
                  </div>
                )}

                {quizSession && (
                  <div className="modal-backdrop">
                    <div className="modal quiz-modal">
                      <h3>{quizSession.quiz.title}</h3>
                      <p>Card {quizSession.index + 1} / {quizSession.quiz.cards}</p>
                      <div className="quiz-card">
                        <p>{quizSession.quiz.cards[quizSession.index]}</p>
                      </div>
                      <div className="modal-actions">
                        <button onClick={() => advanceQuiz(-1)} disabled={quizSession.index === 0}>Prev</button>
                        {quizSession.index < quizSession.quiz.cards - 1 ? (
                          <button onClick={() => advanceQuiz(1)}>Next</button>
                        ) : (
                          <button onClick={finishQuiz}>Finish</button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </main>
            </>
          )}

          {/* Groups Tab */}
          {activeTab === 'groups' && (
            <section className="panel">
              <h2>👥 My Study Groups</h2>
              <div className="groups-grid">
                {filteredGroups.map((group) => (
                  <div key={group.id} className="group-card">
                    <div className="group-header">
                      <h3>{group.name}</h3>
                      <span className="member-badge">{group.members}</span>
                    </div>
                    <p className="group-code">Invite: <code>{group.inviteCode}</code></p>
                    <div className="group-actions">
                      <button>📋 View</button>
                      <button>📤 Share</button>
                      <button>⚙️ Settings</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Timer Tab */}
          {activeTab === 'timer' && (
            <section className="panel timer-section">
              <h2>⏱️ Pomodoro Study Timer</h2>
              <div className="timer-display">
                {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
              </div>
              <p className="timer-status">{isTimerRunning ? '⏸️ Timer Running...' : '⏹️ Timer Paused'}</p>
              <div className="timer-controls">
                <button onClick={toggleTimer}>{isTimerRunning ? 'Pause' : 'Start'}</button>
                <button onClick={resetTimer}>Reset</button>
              </div>
              <div className="quick-presets">
                <p>Quick Presets:</p>
                <button onClick={() => setQuickTimer(5)}>5 min</button>
                <button onClick={() => setQuickTimer(15)}>15 min</button>
                <button onClick={() => setQuickTimer(25)}>25 min</button>
                <button onClick={() => setQuickTimer(45)}>45 min</button>
                <button onClick={() => setQuickTimer(60)}>60 min</button>
              </div>
            </section>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <section className="panel notes-section">
              <h2>📝 Study Notes</h2>
              <textarea
                className="notes-area"
                placeholder="📌 Write your notes here...
                
Example:
# Chapter 1: Calculus Basics
- Definition of derivatives
- Chain rule
- Integration techniques"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="notes-footer">
                <span>📊 Words: {notes.split(/\s+/).filter(w => w).length}</span>
                <button className="save-btn" onClick={() => { socket.emit('saveNotes', { room, notes }); addNotification('Notes saved to room'); }}>💾 Save</button>
              </div>
            </section>
          )}

          {/* Collaborate Tab */}
          {activeTab === 'collaborate' && (
            <section className="room-layout">
              <div className="panel">
                <h3>💬 Live Chat</h3>
                <div className="room-selector">
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="Room name"
                    className="room-input"
                  />
                </div>
                <div className="chat-feed">
                  {messages.length === 0 ? (
                    <div className="empty-chat">👋 Start a conversation...</div>
                  ) : (
                    messages.map((message, index) => (
                      <div key={`${message.user}-${index}`} className="message">
                        <strong className="user-name">{message.user}</strong>
                        <span className="message-text">{message.text}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="chat-inputs">
                  <input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                  />
                  <button onClick={handleSendMessage}>Send</button>
                </div>
              </div>

              <div className="panel">
                <h3>🎨 Whiteboard</h3>
                <div className="whiteboard-toolbar">
                  <label>Tool: 
                    <select value={tool} onChange={(e) => setTool(e.target.value)}>
                      <option value="pen">Pen</option>
                      <option value="text">Text</option>
                    </select>
                  </label>
                  <button onClick={handleUndo}>↶ Undo</button>
                  <button onClick={handleRedo}>↷ Redo</button>
                  <label>Color: <input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label>
                  <label>Brush: <input type="range" min="1" max="12" value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} /></label>
                  <label>Font: <input type="number" min="10" max="64" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} /></label>
                  <button onClick={handleExport}>⬇️ Export PNG</button>
                </div>
                <canvas
                  ref={canvasRef}
                  width={520}
                  height={320}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  onDoubleClick={(e) => {
                    // allow quick text sticky via double click
                    const rect = canvasRef.current.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const sticky = { id: Date.now() + '-' + Math.random().toString(36).slice(2,6), x, y, text: 'Double-click edit', color, fontSize };
                    setStickies(prev => [...prev, sticky]);
                    socket.emit('createSticky', { room, sticky });
                  }}
                  className="whiteboard-canvas"
                />
                <div className="stickies-layer">
                  {stickies.map(s => (
                    <div key={s.id} className="sticky" style={{ position: 'absolute', left: s.x, top: s.y }} contentEditable suppressContentEditableWarning onBlur={(e) => { const updated = { ...s, text: e.target.innerText }; setStickies(prev => prev.map(it => it.id === s.id ? updated : it)); socket.emit('updateSticky', { room, sticky: updated }); }}>{s.text}</div>
                  ))}
                  {Object.entries(remoteCursors).map(([user, pos]) => (
                    <div key={user} className="remote-cursor" style={{ position: 'absolute', left: pos.x + 4, top: pos.y + 4, pointerEvents: 'none' }}>{user}</div>
                  ))}
                </div>
                <div className="actions">
                  <button onClick={() => socket.emit('clearBoard', room)}>🗑️ Clear</button>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default App;
