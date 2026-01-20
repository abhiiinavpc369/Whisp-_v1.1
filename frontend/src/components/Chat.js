import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import ProfileSettings from './ProfileSettings';

const API_BASE = process.env.REACT_APP_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}`;

const Chat = ({ user, users, onUpdateUser, onUpdateUsers }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('messages');
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const socketRef = useRef();
  const messagesEndRef = useRef();
  const messageInputRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem('token');
    socketRef.current = io(API_BASE, { query: { token } });
    socketRef.current.emit('join');
    socketRef.current.on('message', (msg) => {
      if (msg.senderId !== user.userId) {
        setMessages(prev => [...prev, msg]);
        setConversations(prev => prev.map(conv =>
          conv.userId === msg.senderId ? { ...conv, lastMessage: { content: msg.content, messageType: msg.messageType } } : conv
        ));
        if (Notification.permission === 'granted') {
          new Notification('New message', { body: msg.content });
        }
      }
    });
    socketRef.current.on('userStatusUpdate', (data) => {
      onUpdateUsers(users.map(u => u.userId === data.userId ? { ...u, isOnline: data.isOnline } : u));
    });
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    return () => socketRef.current.disconnect();
  }, [user.userId, onUpdateUsers, users]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

  useEffect(() => {
    const fetchConversations = async () => {
      const token = localStorage.getItem('token');
      const convs = await Promise.all(users.filter(u => u.userId !== user.userId).map(async (u) => {
        try {
          const res = await axios.get(`${API_BASE}/api/messages/last/${u.userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return { ...u, lastMessage: res.data };
        } catch {
          return { ...u, lastMessage: null };
        }
      }));
      setConversations(convs);
    };
    if (users.length > 0) fetchConversations();
  }, [users, user.userId]);

  useEffect(() => {
    if (searchQuery) {
      const search = async () => {
        const token = localStorage.getItem('token');
        try {
          const res = await axios.get(`${API_BASE}/api/friends/search?q=${searchQuery}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setSearchResults(res.data);
        } catch {
          setSearchResults([]);
        }
      };
      search();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    const fetchRequests = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get(`${API_BASE}/api/friends/requests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFriendRequests(res.data);
      } catch {
        setFriendRequests([]);
      }
    };
    fetchRequests();
  }, []);



  const fetchMessages = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_BASE}/api/messages/${selectedUser.userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };





  const sendRequest = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_BASE}/api/friends/send-request/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Friend request sent');
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      alert(`Failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const acceptRequest = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API_BASE}/api/friends/accept/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Friend request accepted');
      setFriendRequests(friendRequests.filter(req => req.userId !== userId));
      window.location.reload();
    } catch (err) {
      alert(`Failed: ${err.response?.data?.message || err.message}`);
    }
  };



  const handlePhoneCall = () => {
    socketRef.current.emit('startCall', { to: selectedUser.userId, from: user.userId });
    // Placeholder for call functionality
    alert('Call feature coming soon!');
  };

  const toggleSidebar = () => {
    setSidebarHidden(!sidebarHidden);
  };

  const switchTab = (tabId, title) => {
    setActiveTab(tabId);
    // Update view title if needed
  };

  const openChat = (name) => {
    const user = conversations.find(conv => conv.username === name);
    if (user) {
      setSelectedUser(user);
      if (window.innerWidth < 768) {
        setSidebarHidden(true);
      }
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const msg = {
      senderId: user.userId,
      receiverId: selectedUser.userId,
      messageType: 'text',
      content: message,
    };

    try {
      const res = await axios.post(`${API_BASE}/api/messages`, msg, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      socketRef.current.emit('sendMessage', res.data);
      setMessages(prev => [...prev, res.data]);
      setMessage('');
      messageInputRef.current.style.height = 'auto';
    } catch (err) {
      alert('Failed to send message');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };



  return (
    <div className="bg-slate-900 text-white font-sans overflow-hidden">
      <div className="flex h-screen w-full overflow-hidden">
        {/* Sidebar */}
        <aside id="sidebar" className={`fixed inset-y-0 left-0 z-50 w-full md:w-80 bg-slate-800 border-r border-slate-600 md:relative md:translate-x-0 flex flex-col ${sidebarHidden ? '-translate-x-full' : ''}`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
            <h1 id="view-title" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {activeTab === 'messages' ? 'Messages' : activeTab === 'calls' ? 'Call Logs' : 'Status'}
            </h1>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-slate-100 rounded-full md:hidden" onClick={toggleSidebar}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 6-12 12"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* MESSAGES TAB */}
            <div id="tab-messages" className={`tab-content p-2 space-y-1 ${activeTab === 'messages' ? 'active' : ''}`}>
              <div className="px-2 pb-2">
                <input
                  type="text"
                  placeholder="Search messages..."
                  className="w-full px-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Friend Requests */}
              {friendRequests.length > 0 && (
                <div className="px-2 pb-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Friend Requests</p>
                  {friendRequests.map(req => (
                    <div key={req.userId} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${req.userId}`} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt="" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-sm">{req.userId}</h3>
                          <button onClick={() => acceptRequest(req.userId)} className="bg-green-600 text-white px-3 py-1 rounded text-xs">Accept</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Conversations */}
              {searchResults.length > 0 ? (
                searchResults.map(user => (
                  <div key={user.userId} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-12 h-12 rounded-full border border-slate-100" alt="" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-sm">{user.username}</h3>
                        <button onClick={() => sendRequest(user.userId)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Add</button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                conversations.map(conv => (
                  <div key={conv.userId} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer" onClick={() => openChat(conv.username)}>
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.username}`} className="w-12 h-12 rounded-full border border-slate-100 relative" alt="" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-sm">{conv.username}</h3>
                        <span className="text-[10px] text-slate-500">2m</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {conv.lastMessage ? (conv.lastMessage.messageType === 'text' ? conv.lastMessage.content : 'File') : 'Tap to chat'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* CALL LOGS TAB */}
            <div id="tab-calls" className={`tab-content p-2 space-y-1 ${activeTab === 'calls' ? 'active' : ''}`}>
              <div className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent Calls</div>
              {/* Placeholder call logs - you can integrate real call data here */}
              <div className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">Alex Rivera</h3>
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="23" y1="1" x2="1" y2="23"/><path d="M17 2l4 4-4 4"/>
                    </svg> Missed • 10:30 AM
                  </p>
                </div>
              </div>
            </div>

            {/* STATUS TAB */}
            <div id="tab-status" className={`tab-content p-2 space-y-4 ${activeTab === 'status' ? 'active' : ''}`}>
              <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                <div className="relative">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-12 h-12 rounded-full border-2 border-blue-500 p-0.5" alt="" />
                  <button className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-0.5 border-2 border-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">My Status</h3>
                  <p className="text-xs text-slate-500">Tap to add status update</p>
                </div>
              </div>
              <div className="p-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Recent Updates</p>
                <div className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer">
                  <div className="w-12 h-12 rounded-full border-2 border-green-500 p-0.5">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" className="w-full h-full rounded-full" alt="" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold">Alex Rivera</h3>
                    <p className="text-xs text-slate-500">12 minutes ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Navigation Bar */}
          <nav className="flex border-t border-slate-100 bg-white">
            <button onClick={() => switchTab('messages', 'Messages')} className={`nav-item flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${activeTab === 'messages' ? 'active' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="text-[10px] font-medium">Chats</span>
            </button>
            <button onClick={() => switchTab('status', 'Status')} className={`nav-item flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${activeTab === 'status' ? 'active' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              <span className="text-[10px] font-medium">Status</span>
            </button>
            <button onClick={() => switchTab('calls', 'Call Logs')} className={`nav-item flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${activeTab === 'calls' ? 'active' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span className="text-[10px] font-medium">Calls</span>
            </button>
          </nav>
        </aside>

        {/* Main Chat Window */}
        <main id="chat-window" className={`flex-1 flex flex-col bg-slate-800 ${!sidebarHidden ? 'hidden md:flex' : ''}`}>
          <header className="h-16 border-b border-slate-600 px-4 md:px-6 flex items-center justify-between shrink-0 bg-slate-800 z-10">
            <div className="flex items-center gap-3">
              <button className="md:hidden p-2 -ml-2 hover:bg-slate-100 rounded-lg" onClick={toggleSidebar}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              {selectedUser ? (
                <>
                  <div className="relative">
                    <img id="chat-avatar" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`} className="w-10 h-10 rounded-full border border-slate-100" alt="" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                  </div>
                  <div>
                    <h2 id="chat-name" className="font-bold text-sm leading-none mb-1">{selectedUser.username}</h2>
                    <p className="text-xs text-slate-500">Online</p>
                  </div>
                </>
              ) : (
                <div>
                  <h2 className="font-bold text-sm leading-none mb-1">Select a chat</h2>
                  <p className="text-xs text-slate-500">Choose a conversation to start messaging</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              {selectedUser && (
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hidden sm:block" onClick={handlePhoneCall}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m15 10 4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14V10z"/>
                    <rect width="14" height="12" x="3" y="6" rx="2"/>
                  </svg>
                </button>
              )}
              <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600" onClick={() => setShowSettings(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
                </svg>
              </button>
            </div>
          </header>

          <div id="message-container" className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/50 custom-scrollbar">
            {selectedUser ? (
              <>
                <div className="flex justify-center">
                  <span className="px-3 py-1 bg-white border border-slate-200 text-slate-400 text-[10px] font-medium rounded-full uppercase tracking-wider">
                    Start of conversation with {selectedUser.username}
                  </span>
                </div>
                {messages.map((msg, i) => (
                  <div key={msg._id || i} className={`flex items-end gap-3 max-w-[85%] md:max-w-[70%] ${msg.senderId === user.userId ? 'ml-auto flex-row-reverse' : ''}`}>
                    {msg.senderId !== user.userId && (
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`} className="w-8 h-8 rounded-full mb-1 shrink-0" alt="" />
                    )}
                    <div>
                      <div className={`p-3 md:p-4 rounded-2xl shadow-sm text-sm ${msg.senderId === user.userId ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 rounded-bl-none'}`}>
                        {msg.messageType === 'text' ? (
                          <p>{msg.content}</p>
                        ) : msg.messageType === 'image' ? (
                          <img src={`${API_BASE}${msg.content}`} alt="Shared" className="max-w-full rounded" />
                        ) : (
                          <a href={`${API_BASE}${msg.content}`} className="text-blue-300">
                            <i className="fas fa-file"></i> {msg.fileMeta?.fileName}
                          </a>
                        )}
                      </div>
                      <span className={`text-[10px] text-slate-400 mt-1 ${msg.senderId === user.userId ? 'mr-1 text-right' : 'ml-1'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-4">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <h2 className="text-2xl font-semibold mb-2">Select a chat to start messaging</h2>
                  <p>Choose a friend from the list to begin a conversation.</p>
                </div>
              </div>
            )}
          </div>

          {selectedUser && (
            <footer className="p-3 md:p-4 bg-white border-t border-slate-200">
              <div className="max-w-4xl mx-auto flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <button className="p-2 text-slate-400 hover:text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </button>
                <textarea
                  ref={messageInputRef}
                  placeholder="Type a message..."
                  className="w-full bg-transparent border-none focus:ring-0 text-sm py-2 px-1 max-h-32 resize-none"
                  rows="1"
                  value={message}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />
                <button
                  id="send-btn"
                  className="p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all"
                  onClick={sendMessage}
                  disabled={!message.trim()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
                  </svg>
                </button>
              </div>
            </footer>
          )}
        </main>
      </div>

      {/* Profile Settings Modal */}
      {showSettings && <ProfileSettings user={user} onClose={() => setShowSettings(false)} onUpdate={onUpdateUser} />}
    </div>
  );
};

export default Chat;