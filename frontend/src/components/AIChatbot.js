import React, { useState } from 'react';
import API from '../services/api';

const AIChatbot = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([{ sender: 'ai', text: 'Hello! I am your AI Tutor. Ask me anything.' }]);

    const sendMessage = async () => {
        const newMessages = [...messages, { sender: 'user', text: input }];
        setMessages(newMessages);
        
        try {
            const res = await API.post('/ai/chat', { message: input });
            setMessages([...newMessages, { sender: 'ai', text: res.data.reply }]);
        } catch (error) {
            setMessages([...newMessages, { sender: 'ai', text: 'Error contacting AI.' }]);
        }
        setInput('');
    };

    return (
        <div className="chat-box">
            <h3>AI Tutor</h3>
            <div className="messages">
                {messages.map((msg, index) => (
                    <p key={index} className={msg.sender}><strong>{msg.sender}:</strong> {msg.text}</p>
                ))}
            </div>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question..." />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default AIChatbot;