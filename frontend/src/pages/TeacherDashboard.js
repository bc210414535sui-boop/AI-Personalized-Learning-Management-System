import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import AuthContext from '../context/AuthContext';

const TeacherDashboard = () => {
    const { logout } = useContext(AuthContext);

    // Data States
    const [analytics, setAnalytics] = useState({ stats: {}, students: [] });
    const [loading, setLoading] = useState(false);

    // Course State
    const [courseData, setCourseData] = useState({ title: '', content: '', subject: 'General' });

    // --- QUIZ STATES (UPDATED) ---
    const [quizMode, setQuizMode] = useState('AI'); // 'AI' or 'Manual'
    const [quizTopic, setQuizTopic] = useState(''); // Common for both

    // Manual Quiz Specific States
    const [manualQuestions, setManualQuestions] = useState([]);
    const [currentQ, setCurrentQ] = useState({
        question: '',
        options: ['', '', '', ''],
        answer: ''
    });

    // Initial Load
    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const res = await API.get('/teacher/analytics');
            setAnalytics(res.data);
        } catch (e) { console.error("Access Denied"); }
    };

    // --- HELPER: Handle Manual Question Input ---
    const handleOptionChange = (index, value) => {
        const newOptions = [...currentQ.options];
        newOptions[index] = value;
        setCurrentQ({ ...currentQ, options: newOptions });
    };

    const addManualQuestion = () => {
        // Validation
        if (!currentQ.question || currentQ.options.some(o => !o) || !currentQ.answer) {
            return alert("Please fill Question, All 4 Options, and Select Correct Answer.");
        }
        // Answer Validation (Must match one option)
        if (!currentQ.options.includes(currentQ.answer)) {
            return alert("Correct Answer must match exactly one of the options (Case sensitive).");
        }

        setManualQuestions([...manualQuestions, currentQ]);
        // Reset Form
        setCurrentQ({ question: '', options: ['', '', '', ''], answer: '' });
    };

    // --- MAIN ACTION: Publish Quiz ---
    const handlePublishQuiz = async () => {
        if (!quizTopic) return alert("Please enter a Quiz Topic/Title.");

        setLoading(true);
        try {
            let payload = {};

            if (quizMode === 'AI') {
                // AI Mode
                payload = { topic: quizTopic, mode: 'AI' };
            } else {
                // Manual Mode
                if (manualQuestions.length === 0) {
                    setLoading(false);
                    return alert("Please add at least 1 question.");
                }
                payload = {
                    topic: quizTopic,
                    mode: 'Manual',
                    questions: manualQuestions
                };
            }

            await API.post('/teacher/create-quiz', payload);
            alert("✅ Quiz Published Successfully!");

            // Reset UI
            setQuizTopic('');
            setManualQuestions([]);
            loadData(); // Refresh stats

        } catch (e) {
            alert("Failed to publish quiz. check console.");
            console.error(e);
        }
        setLoading(false);
    };

    // Create Course
    const handleCreateCourse = async () => {
        if (!courseData.title || !courseData.content) return alert("Fill all fields");
        try {
            alert("Feature: Course Created Successfully! (Mock)");
            setCourseData({ title: '', content: '', subject: 'General' });
        } catch (e) { alert("Failed"); }
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="profile-card" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                <div>
                    <h1>👨‍🏫 Teacher Dashboard</h1>
                    <p>Monitor Student Progress & Assign Work</p>
                </div>
                <button onClick={logout} className="danger-btn">Logout</button>
            </div>

            {/* --- ANALYTICS CARDS --- */}
            <div className="grid-layout">
                <div className="card text-center">
                    <h3 style={{ color: '#059669' }}>👥 Total Students</h3>
                    <h1 style={{ fontSize: '2.5rem', margin: '10px 0' }}>{analytics.stats?.total_students || 0}</h1>
                </div>
                <div className="card text-center">
                    <h3 style={{ color: '#2563eb' }}>📊 Class Average</h3>
                    <h1 style={{ fontSize: '2.5rem', margin: '10px 0' }}>{analytics.stats?.class_average || 0}%</h1>
                </div>
                <div className="card text-center">
                    <h3 style={{ color: '#d97706' }}>📝 Quizzes Assigned</h3>
                    <h1 style={{ fontSize: '2.5rem', margin: '10px 0' }}>{analytics.stats?.total_quizzes || 0}</h1>
                </div>
            </div>

            <div className="grid-layout" style={{ gridTemplateColumns: '1.5fr 1fr' }}>

                {/* LEFT: Quiz Creator (Updated) */}
                <div className="card">
                    <h2>🚀 Create & Assign Quiz</h2>

                    {/* Toggle Mode */}
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', padding: '10px', background: '#f9fafb', borderRadius: '8px' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <input type="radio" name="mode" checked={quizMode === 'AI'} onChange={() => setQuizMode('AI')} style={{ marginRight: '8px', width: 'auto' }} />
                            🤖 AI Generator
                        </label>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <input type="radio" name="mode" checked={quizMode === 'Manual'} onChange={() => setQuizMode('Manual')} style={{ marginRight: '8px', width: 'auto' }} />
                            ✍️ Manual Entry
                        </label>
                    </div>

                    {/* Topic Input (Common) */}
                    <input
                        placeholder="Enter Quiz Topic / Title (e.g. Data Structures)"
                        value={quizTopic}
                        onChange={e => setQuizTopic(e.target.value)}
                        style={{ border: '2px solid #e5e7eb' }}
                    />

                    {/* --- MANUAL MODE FORM --- */}
                    {quizMode === 'Manual' && (
                        <div style={{ border: '1px solid #e5e7eb', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                            <h4 style={{ marginTop: 0 }}>Add Question {manualQuestions.length + 1}</h4>

                            <input
                                placeholder="Question Text?"
                                value={currentQ.question}
                                onChange={e => setCurrentQ({ ...currentQ, question: e.target.value })}
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {currentQ.options.map((opt, i) => (
                                    <input
                                        key={i}
                                        placeholder={`Option ${i + 1}`}
                                        value={opt}
                                        onChange={e => handleOptionChange(i, e.target.value)}
                                        style={{ marginBottom: 0 }}
                                    />
                                ))}
                            </div>

                            <div style={{ marginTop: '10px' }}>
                                <label style={{ fontSize: '0.9rem' }}>Correct Answer (Copy exact text from options above):</label>
                                <input
                                    placeholder="e.g. Option 1 Text"
                                    value={currentQ.answer}
                                    onChange={e => setCurrentQ({ ...currentQ, answer: e.target.value })}
                                />
                            </div>

                            <button onClick={addManualQuestion} style={{ background: '#4b5563', width: '100%', marginTop: '5px' }}>+ Add Question to List</button>

                            {/* Preview List */}
                            {manualQuestions.length > 0 && (
                                <div style={{ marginTop: '15px', padding: '10px', background: '#f0fdf4', borderRadius: '5px' }}>
                                    <p style={{ margin: 0, color: '#166534', fontWeight: 'bold' }}>✅ {manualQuestions.length} Questions Ready to Publish</p>
                                </div>
                            )}
                        </div>
                    )}

                    <button onClick={handlePublishQuiz} disabled={loading} style={{ width: '100%', padding: '12px', fontSize: '1rem' }}>
                        {loading ? 'Publishing...' : (quizMode === 'AI' ? '✨ Generate & Assign' : '📤 Publish Quiz')}
                    </button>
                </div>

                {/* RIGHT: Course Publisher */}
                <div className="card">
                    <h2>📚 Publish Course Material</h2>
                    <input placeholder="Title" value={courseData.title} onChange={e => setCourseData({ ...courseData, title: e.target.value })} />
                    <input placeholder="Subject" value={courseData.subject} onChange={e => setCourseData({ ...courseData, subject: e.target.value })} />
                    <textarea
                        placeholder="Content..."
                        rows="6"
                        style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                        value={courseData.content}
                        onChange={e => setCourseData({ ...courseData, content: e.target.value })}
                    ></textarea>
                    <button onClick={handleCreateCourse} style={{ width: '100%', marginTop: '10px', background: '#4b5563' }}>Publish Course</button>
                </div>

            </div>

            {/* BOTTOM: Student Report */}
            <div className="card" style={{ marginTop: '20px' }}>
                <h2>🎓 Student Performance Report</h2>
                <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '12px' }}>Name</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Quizzes</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Avg Score</th>
                                <th style={{ padding: '12px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analytics.students?.map((s) => (
                                <tr key={s._id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px' }}><strong>{s.name}</strong><br /><span style={{ fontSize: '0.85rem', color: '#666' }}>{s.email}</span></td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>{s.quizzes_taken}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', background: s.average_score >= 50 ? '#dcfce7' : '#fee2e2', color: s.average_score >= 50 ? '#166534' : '#991b1b' }}>
                                            {s.average_score}%
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}><span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '10px', background: s.status === 'Active' ? '#dbeafe' : '#f3f4f6', color: s.status === 'Active' ? '#1e40af' : '#6b7280' }}>{s.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;