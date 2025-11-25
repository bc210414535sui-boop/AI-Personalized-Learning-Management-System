import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import AuthContext from '../context/AuthContext';

const StudentDashboard = () => {
    const { logout } = useContext(AuthContext);
    const [profile, setProfile] = useState({});

    // Chat States
    const [chatMsg, setChatMsg] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Quiz States
    const [quizTopic, setQuizTopic] = useState('');
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [userAnswers, setUserAnswers] = useState({});
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(false);

    // Data Lists
    const [teacherQuizzes, setTeacherQuizzes] = useState([]);
    const [courses, setCourses] = useState([]);

    // Features States
    const [editing, setEditing] = useState(false);
    const [newName, setNewName] = useState('');
    const [activeCourse, setActiveCourse] = useState(null);
    const [showProgress, setShowProgress] = useState(false);
    const [progressData, setProgressData] = useState({ history: [], stats: {} });
    const [aiRecommendation, setAiRecommendation] = useState('');

    // Initial Load
    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const p = await API.get('/student/profile');
            setProfile(p.data); setNewName(p.data.name);
            const q = await API.get('/student/assigned-quizzes');
            setTeacherQuizzes(q.data);
            const c = await API.get('/student/courses');
            setCourses(c.data);
            const prog = await API.get('/progress/');
            setProgressData(prog.data);
        } catch (e) { console.error("Load Error", e); }
    };

    // --- FUNCTIONS ---

    const getAIPlan = async () => {
        setAiRecommendation("Analyzing... 🤖");
        try {
            const res = await API.get('/ai/recommendation');
            setAiRecommendation(res.data.message);
        } catch (e) { setAiRecommendation("Could not generate plan."); }
    };

    const handleAdaptiveQuiz = async () => {
        setLoading(true); setScore(null); setActiveQuiz(null); setUserAnswers({});
        try {
            const res = await API.post('/ai/generate-adaptive-quiz');
            if (res.data?.quiz?.length > 0) {
                setActiveQuiz(res.data.quiz);
                setQuizTopic(res.data.topic + " (Remedial)");
            } else { alert("AI could not generate quiz."); }
        } catch (e) { alert("Error generating adaptive quiz"); }
        setLoading(false);
    };

    const handleUpdateProfile = async () => {
        if (!newName) return alert("Enter Name");
        try { await API.put('/student/update-profile', { name: newName }); setProfile({ ...profile, name: newName }); setEditing(false); alert("Updated!"); } catch (e) { }
    };

    const handleChat = async () => {
        if (!chatMsg.trim()) return;
        const newHist = [...chatHistory, { sender: 'You', text: chatMsg }];
        setChatHistory(newHist); setChatMsg('');
        try {
            const res = await API.post('/ai/chat', { message: chatMsg });
            setChatHistory([...newHist, { sender: 'AI', text: res.data.reply }]);
        } catch (e) { setChatHistory([...newHist, { sender: 'AI', text: "Error: AI Offline." }]); }
    };

    const handleGenerateQuiz = async () => {
        if (!quizTopic) return alert("Enter Topic");
        setLoading(true); setScore(null); setActiveQuiz(null); setUserAnswers({});
        try {
            const res = await API.post('/ai/generate-quiz', { topic: quizTopic, difficulty: 'Medium' });
            if (res.data?.length > 0) setActiveQuiz(res.data);
        } catch (e) { alert("Error"); }
        setLoading(false);
    };

    const submitQuiz = async () => {
        let correct = 0;
        activeQuiz.forEach((q, i) => { if (userAnswers[i] === q.answer) correct++; });
        const finalScore = Math.round((correct / activeQuiz.length) * 100);
        setScore(finalScore);
        try {
            await API.post('/progress/update', { topic: quizTopic || "Teacher Quiz", score: finalScore, status: "Completed" });
            await loadData();
        } catch (e) { }
    };

    const startTeacherQuiz = (quiz) => {
        setScore(null); setUserAnswers({});
        setActiveQuiz(quiz.questions);
        setQuizTopic(quiz.topic);
    };

    const handleEnroll = async (id) => {
        try {
            await API.post('/student/enroll', { course_id: id });
            loadData();
            alert("Enrolled!");
        } catch (e) { alert("Enrollment failed"); }
    };

    // --- INTEGRATION LOGIC (REQ #8) ---
    const getPlatformLink = (platform) => {
        const query = encodeURIComponent(quizTopic || "Computer Science");
        if (platform === 'Coursera') return `https://www.coursera.org/search?query=${query}`;
        if (platform === 'Udemy') return `https://www.udemy.com/courses/search/?q=${query}`;
        if (platform === 'EdX') return `https://www.edx.org/search?q=${query}`; // Similar to Moodle content
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="profile-card">
                <div>
                    {editing ? (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input value={newName} onChange={e => setNewName(e.target.value)} style={{ width: '150px', color: 'black' }} />
                            <button onClick={handleUpdateProfile} style={{ color: 'black' }}>Save</button>
                        </div>
                    ) : (
                        <><h1>🎓 {profile.name}</h1><button onClick={() => setEditing(true)} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', border: 'none' }}>Edit</button></>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setShowProgress(true)} style={{ background: 'white', color: '#4f46e5' }}>📊 Progress</button>
                    <button onClick={logout} className="danger-btn">Logout</button>
                </div>
            </div>

            {/* MODALS */}
            {showProgress && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '10px', width: '70%', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><h2>Performance</h2><button onClick={() => setShowProgress(false)}>Close</button></div>
                        <table style={{ width: '100%', marginTop: '20px' }}>
                            <thead><tr><th>Topic</th><th>Score</th><th>Date</th></tr></thead>
                            <tbody>
                                {progressData.history?.map((h, i) => (
                                    <tr key={i} style={{ textAlign: 'center', borderBottom: '1px solid #eee' }}>
                                        <td>{h.topic || "Unknown"}</td>
                                        <td style={{ color: h.score >= 50 ? 'green' : 'red' }}>{h.score}%</td>
                                        <td>{new Date(h.last_updated).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeCourse && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '10px', width: '60%', maxHeight: '80vh', overflowY: 'auto' }}>
                        <h2>{activeCourse.title}</h2>
                        <p style={{ fontSize: '1.1rem', whiteSpace: 'pre-wrap' }}>{activeCourse.content}</p>
                        <button onClick={() => setActiveCourse(null)} style={{ float: 'right' }}>Close</button>
                    </div>
                </div>
            )}

            <div className="grid-layout" style={{ gridTemplateColumns: '2fr 1fr' }}>
                <div className="card">
                    <h2>📝 Quiz Zone</h2>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <input placeholder="Topic (e.g. React)" onChange={e => setQuizTopic(e.target.value)} />
                        <button onClick={handleGenerateQuiz} disabled={loading} style={{ width: '30%' }}>{loading ? '...' : 'Generate'}</button>
                    </div>

                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <button onClick={handleAdaptiveQuiz} disabled={loading} style={{ width: '100%', background: '#ef4444', fontWeight: 'bold' }}>🔥 Take Smart Remedial Quiz</button>
                    </div>

                    {activeQuiz ? (
                        <div className="quiz-box">
                            {score !== null ? (
                                <div className="text-center" style={{ padding: '20px', background: '#d1fae5' }}>
                                    <h2>Score: {score}%</h2>
                                    <p>✅ Saved!</p>
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                        <button onClick={() => setShowProgress(true)} style={{ background: '#4f46e5', fontSize: '0.9rem' }}>Check History</button>
                                        <button onClick={() => { setActiveQuiz(null); setScore(null) }}>Close</button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {activeQuiz.map((q, idx) => (
                                        <div key={idx} style={{ marginBottom: '10px' }}>
                                            <p><strong>Q{idx + 1}: {q.question}</strong></p>
                                            {q.options.map((opt, i) => (<label key={i} className="quiz-option"><input type="radio" name={`q-${idx}`} onChange={() => setUserAnswers({ ...userAnswers, [idx]: opt })} /> {opt}</label>))}
                                        </div>
                                    ))}
                                    <button onClick={submitQuiz} style={{ width: '100%' }}>Submit</button>
                                </div>
                            )}
                        </div>
                    ) : <p className="text-muted text-center">Enter a topic above.</p>}

                    <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        <h4 style={{ color: '#7c3aed' }}>🧠 Personalized Recommendations</h4>
                        {!aiRecommendation ? (
                            <button onClick={getAIPlan} style={{ background: '#7c3aed', width: '100%' }}>💡 Get AI Study Plan</button>
                        ) : (
                            <div style={{ background: '#f5f3ff', padding: '15px', borderRadius: '8px' }}>
                                <p style={{ whiteSpace: 'pre-wrap', color: '#5b21b6' }}>{aiRecommendation}</p>
                                <button onClick={() => setAiRecommendation('')} style={{ background: 'transparent', color: '#555', border: '1px solid #ccc' }}>Clear</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <h3>📚 Learning Hub</h3>
                    <div className="mt-4">
                        {courses.map(c => (
                            <div key={c._id} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
                                <strong>{c.title}</strong>
                                {c.is_enrolled ? <button onClick={() => setActiveCourse(c)} style={{ width: '100%', background: '#10b981', fontSize: '0.8rem' }}>Start</button> : <button onClick={() => handleEnroll(c._id)} style={{ width: '100%', fontSize: '0.8rem' }}>Enroll</button>}
                            </div>
                        ))}
                    </div>

                    {/* --- INTEGRATION SECTION (REQ #8) --- */}
                    <div className="mt-4" style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        <h4 style={{ color: '#ea580c' }}>🌐 Integration</h4>
                        <p style={{ fontSize: '0.8rem', color: '#666' }}>Find resources on:</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <a href={getPlatformLink('Coursera')} target="_blank" rel="noreferrer"><button style={{ width: '100%', background: '#0056D2' }}>Coursera ↗</button></a>
                            <a href={getPlatformLink('Udemy')} target="_blank" rel="noreferrer"><button style={{ width: '100%', background: '#a435f0' }}>Udemy ↗</button></a>
                            <a href={getPlatformLink('EdX')} target="_blank" rel="noreferrer"><button style={{ width: '100%', background: '#0b0c0c' }}>EdX / Moodle ↗</button></a>
                        </div>
                    </div>

                    <div className="mt-4" style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        <h4 style={{ color: 'var(--secondary-color)' }}>Teacher Quizzes</h4>
                        {teacherQuizzes.map(q => (
                            <div key={q._id} style={{ marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{q.topic}</span><button onClick={() => startTeacherQuiz(q)} style={{ fontSize: '0.7rem', padding: '2px 5px' }}>Start</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <button className="chat-fab" onClick={() => setIsChatOpen(!isChatOpen)}>🤖</button>
            {isChatOpen && (
                <div className="chat-popup">
                    <div className="chat-header"><h3>AI Tutor</h3><button className="close-btn" onClick={() => setIsChatOpen(false)}>×</button></div>
                    <div className="chat-window" style={{ flex: 1 }}>{chatHistory.map((m, i) => (<div key={i} className={`msg ${m.sender}`}><strong>{m.sender}:</strong> {m.text}</div>))}</div>
                    <div style={{ padding: '10px', display: 'flex', background: 'white' }}><input value={chatMsg} onChange={e => setChatMsg(e.target.value)} placeholder="Ask..." /><button onClick={handleChat}>Send</button></div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;