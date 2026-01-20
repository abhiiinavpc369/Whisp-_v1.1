import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ProfileSettings from './ProfileSettings';
import Login from './Login';

const Phone = () => {
  const [sidebarHidden, setSidebarHidden] = useState(true);
  const [activeTab, setActiveTab] = useState('message');
  const [viewTitle, setViewTitle] = useState('Messages');
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [callName, setCallName] = useState('Alex Rivera');
  const [callAvatar, setCallAvatar] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix');
  const [callStatus, setCallStatus] = useState('Calling...');
  const [callTimer, setCallTimer] = useState('');
  const [timerInterval, setTimerInterval] = useState(null);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const messagesEndRef = useRef();

  const API_BASE = process.env.REACT_APP_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}`;

  const toggleSidebar = () => {
    setSidebarHidden(!sidebarHidden);
  };

  const switchTab = (tabId, title) => {
    setActiveTab(tabId);
    setViewTitle(title);
  };



  const startCall = (name) => {
    setCallName(name);
    setCallAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`);
    setCallStatus('Calling...');
    setCallTimer('');
    if (window.innerWidth < 768) {
      setSidebarHidden(true);
    }
    setTimeout(() => {
      setCallStatus('Connected');
      setCallTimer('00:00');
      startTimer();
    }, 1800);
  };

  const startTimer = () => {
    let seconds = 0;
    const interval = setInterval(() => {
      seconds++;
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      setCallTimer(`${mins}:${secs}`);
    }, 1000);
    setTimerInterval(interval);
  };

  const endCall = () => {
    clearInterval(timerInterval);
    setCallStatus('Call Ended');
    setTimeout(() => {
      setCallStatus('Ready');
      setCallName('Phone');
      setCallTimer('');
      setCallAvatar('https://api.dicebear.com/7.x/avataaars/svg?seed=Phone');
    }, 1500);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await axios.get(`${API_BASE}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
        const usersRes = await axios.get(`${API_BASE}/api/users/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(usersRes.data);
        const friendsRes = await axios.get(`${API_BASE}/api/friends/friends`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFriends(friendsRes.data);
        const statusRes = await axios.get(`${API_BASE}/api/status/friends`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStatuses(statusRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUserData();
  }, []);

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
    const fetchConversations = async () => {
      if (!user) return;
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
    if (users.length > 0 && user) fetchConversations();
  }, [users, user]);

  useEffect(() => {
    if (selectedUser) {
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
      fetchMessages();
    }
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleUpdateUsers = (updatedUsers) => {
    setUsers(updatedUsers);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      setUser(null);
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

  const sendMessage = async () => {
    if (!message.trim()) return;
    const msg = {
      senderId: user.userId,
      receiverId: selectedUser.userId,
      messageType: 'text',
      content: message,
    };
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE}/api/messages`, msg, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => [...prev, res.data]);
      setMessage('');
    } catch (err) {
      alert('Failed to send message');
    }
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="bg-slate-900 text-white font-sans overflow-hidden">
      <div className="flex h-screen w-full overflow-hidden relative">
        {/* Sidebar (Left Rail) */}
        <aside id="sidebar" className={`fixed inset-y-0 left-0 z-50 w-full sm:w-80 bg-slate-800 text-white border-r border-slate-600 md:relative md:translate-x-0 ${sidebarHidden ? 'sidebar-hidden' : 'sidebar-visible'} flex flex-col shadow-2xl md:shadow-none ${(activeTab === 'call' || activeTab === 'message') ? '' : 'hidden'}`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-600 flex justify-between items-center bg-slate-800 sticky top-0">
            <h1 id="view-title" className="text-xl font-bold text-white">{viewTitle}<span className="ml-1 text-slate-400">...</span></h1>
            <div className="flex items-center gap-2">
              <button onClick={() => setSearchModalOpen(true)} className="p-1 hover:bg-slate-700 rounded-full">
                <i className="fas fa-search text-slate-400 hover:text-white"></i>
              </button>
              {activeTab === 'message' && (
                <div className="relative">
                  <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 hover:bg-slate-700 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                  </button>
                  {menuOpen && (
                    <div className="absolute top-full right-0 mt-1 w-40 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 text-white">
                      <button onClick={() => { switchTab('message', 'Messages'); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-700 rounded-t-lg"><i className="fas fa-comments mr-2"></i>Messages</button>
                      <button onClick={() => { switchTab('call', 'Calls'); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-700"><i className="fas fa-phone mr-2"></i>Calls</button>
                      <button onClick={() => { switchTab('status', 'Status'); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-700"><i className="fas fa-circle mr-2"></i>Status</button>
                      <button onClick={() => { switchTab('settings', 'Settings'); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-700"><i className="fas fa-cog mr-2"></i>Settings</button>
                      <div className="border-t border-slate-600"></div>
                      <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-700 rounded-b-lg"><i className="fas fa-sign-out-alt mr-2"></i>Logout</button>
                    </div>
                  )}
                </div>
              )}
              <button className="p-2 hover:bg-slate-700 rounded-full md:hidden" onClick={toggleSidebar}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 6-12 12"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* CALL TAB */}
            <div id="tab-call" className={`tab-content p-2 space-y-1 ${activeTab === 'call' ? 'active' : ''}`}>
              <div className="p-3 text-xs font-semibold text-white uppercase tracking-wider">Friends</div>
              {friends.map(friend => (
                <div key={friend.userId} className="flex items-center gap-3 p-3 hover:bg-slate-700 rounded-xl cursor-pointer transition-colors" onClick={() => startCall(friend.username)}>
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} className="w-12 h-12 rounded-full border-2 border-white shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate text-white">{friend.username}</h3>
                    <p className="text-xs text-slate-400">Tap to call</p>
                  </div>
                  <button className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </button>
                </div>
              ))}
              {friends.length === 0 && (
                <div className="p-3 text-center text-slate-400">
                  <p>No friends yet. Add some friends to start calling.</p>
                </div>
              )}
            </div>

            {/* MESSAGE TAB */}
            <div id="tab-message" className={`tab-content p-2 space-y-1 ${activeTab === 'message' ? 'active' : ''}`}>
              <div className="px-2 pb-2">
                <input
                  type="text"
                  placeholder="Search messages..."
                  className="w-full px-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {searchResults.length > 0 ? (
                searchResults.map(user => (
                  <div key={user.userId} className="flex items-center gap-3 p-3 hover:bg-slate-700 rounded-xl cursor-pointer">
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
                  <div key={conv.userId} className="flex items-center gap-3 p-3 hover:bg-slate-700 rounded-xl cursor-pointer" onClick={() => setSelectedUser(conv)}>
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

            {/* STATUS TAB */}
            <div id="tab-status" className={`tab-content p-2 space-y-4 ${activeTab === 'status' ? 'active' : ''}`}>
              <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                <div className="relative">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} className="w-12 h-12 rounded-full border-2 border-blue-500 p-0.5" alt="" />
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
                {statuses.filter(s => s.userId !== user?.userId).map(status => (
                  <div key={status._id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer">
                    <div className="w-12 h-12 rounded-full border-2 border-green-500 p-0.5">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${status.userId}`} className="w-full h-full rounded-full" alt="" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold">{status.userId}</h3>
                      <p className="text-xs text-slate-500">{new Date(status.createdAt).toLocaleTimeString()}</p>
                    </div>
                    <div className="text-xs text-slate-400">{status.views.length} views</div>
                  </div>
                ))}
              </div>
            </div>

            {/* SETTINGS TAB */}
            <div id="tab-settings" className={`tab-content ${activeTab === 'settings' ? 'active' : ''}`}>
              {activeTab === 'settings' && user && <ProfileSettings user={user} onUpdate={handleUpdateUser} onLogout={handleLogout} />}
            </div>
          </div>
        </aside>

        {/* Main Window */}
        <main id="call-main" className={`flex-1 flex flex-col relative overflow-hidden transition-all duration-300 ${activeTab === 'call' ? 'bg-slate-900' : 'bg-slate-900 text-white'}`}>
          {/* Background Decoration */}
          <div className={`absolute inset-0 opacity-30 pointer-events-none ${activeTab === 'call' ? '' : 'hidden'}`}>
            <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] bg-blue-600/40 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-indigo-600/40 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          {/* Header (Mobile Only Toggle) */}
          <header className={`md:hidden h-16 px-4 flex items-center z-20 absolute top-0 left-0 w-full glass-header ${activeTab === 'call' ? '' : 'hidden'}`}>
            <button className="p-2 bg-white/10 text-white rounded-lg active:bg-white/20 transition-colors" onClick={toggleSidebar}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <span className="ml-4 text-white/80 font-medium text-sm">Return to phone</span>
          </header>

          {/* Call Content Container */}
          <div id="active-call-view" className={`flex-1 flex flex-col items-center justify-center p-6 text-white z-10 ${activeTab === 'call' ? '' : 'hidden'}`}>
            <div className="pulse-animation mb-6 sm:mb-10">
              <img id="call-avatar" src={callAvatar} className="w-36 h-36 sm:w-56 sm:h-56 rounded-full border-4 border-white/20 shadow-2xl object-cover" alt="Avatar" />
            </div>

            <div className="text-center">
              <h2 id="call-name" className="text-3xl sm:text-5xl font-bold mb-2 tracking-tight">{callName}</h2>
              <p id="call-status" className="text-blue-400 font-bold tracking-[0.2em] uppercase text-xs sm:text-sm">{callStatus}</p>
              <p id="call-timer" className={`hidden text-xl sm:text-2xl mt-3 font-mono text-white/90 ${callTimer ? '' : 'hidden'}`}>{callTimer}</p>
            </div>

            {/* Responsive Control Grid */}
            <div className="grid grid-cols-3 gap-6 sm:gap-12 mt-12 sm:mt-20 max-w-xs sm:max-w-md w-full px-4">
              <div className="flex flex-col items-center gap-2">
                <button className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 flex items-center justify-center active:bg-white/30 sm:hover:bg-white/20 transition-all backdrop-blur-md">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12"/><circle cx="17" cy="7" r="5"/></svg>
                </button>
                <span className="text-[10px] sm:text-xs text-white/60 font-medium">Mute</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 flex items-center justify-center active:bg-white/30 sm:hover:bg-white/20 transition-all backdrop-blur-md">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/></svg>
                </button>
                <span className="text-[10px] sm:text-xs text-white/60 font-medium">Keypad</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 flex items-center justify-center active:bg-white/30 sm:hover:bg-white/20 transition-all backdrop-blur-md">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3z"/><path d="M8 8a2 2 0 1 1 4 0 2 2 0 1 1-4 0z"/><path d="M7 15a6 6 0 0 1 10 0"/></svg>
                </button>
                <span className="text-[10px] sm:text-xs text-white/60 font-medium">Speaker</span>
              </div>
            </div>

            {/* Big Red End Call */}
            <button onClick={endCall} className="mt-12 sm:mt-20 w-20 h-20 sm:w-24 sm:h-24 bg-red-500 rounded-full flex items-center justify-center shadow-2xl active:bg-red-600 sm:hover:bg-red-600 transition-all transform hover:scale-105 active:scale-95 group">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="rotate-[135deg] sm:w-10 sm:h-10"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </button>
          </div>
          {activeTab === 'message' && selectedUser && (
            <div className="flex-1 flex flex-col bg-slate-800">
              <header className="h-16 border-b border-slate-600 px-4 md:px-6 flex items-center justify-between shrink-0 bg-slate-800 z-10">
                <div className="flex items-center gap-3">
                  <button className="md:hidden p-2 -ml-2 hover:bg-slate-100 rounded-lg" onClick={toggleSidebar}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <div className="relative">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`} className="w-10 h-10 rounded-full border border-slate-100" alt="" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm leading-none mb-1">{selectedUser.username}</h2>
                    <p className="text-xs text-slate-500">Online</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600" onClick={() => startCall(selectedUser.username)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 10 4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14V10z"/><rect width="14" height="12" x="3" y="6" rx="2"/></svg>
                  </button>
                </div>
              </header>
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/50 custom-scrollbar">
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
                        <p>{msg.content}</p>
                      </div>
                      <span className={`text-[10px] text-slate-400 mt-1 ${msg.senderId === user.userId ? 'mr-1 text-right' : 'ml-1'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <footer className="p-3 md:p-4 bg-white border-t border-slate-200">
                <div className="max-w-4xl mx-auto flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <button className="p-2 text-slate-400 hover:text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                  </button>
                  <input
                    placeholder="Type a message..."
                    className="w-full bg-transparent border-none focus:ring-0 text-sm py-2 px-1"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  />
                  <button
                    className="p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all"
                    onClick={sendMessage}
                    disabled={!message.trim()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                  </button>
                </div>
              </footer>
            </div>
          )}
          {activeTab === 'status' && (
            <div className="flex-1 p-4">
              <div className="flex items-center mb-4">
                <button onClick={() => switchTab('message', 'Messages')} className="p-2 hover:bg-slate-700 rounded-full text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <h2 className="text-xl font-bold ml-4 text-white">Status</h2>
              </div>
              <p>Your current status: {user?.status || 'Online'}</p><p>View and update your status.</p>
            </div>
          )}
          {activeTab === 'settings' && user && <ProfileSettings user={user} onUpdate={handleUpdateUser} onBack={() => switchTab('message', 'Messages')} />}
        </main>

        {/* Search Modal */}
        {searchModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-slate-800 rounded-lg p-6 w-96 max-w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Search Users</h3>
                <button onClick={() => setSearchModalOpen(false)} className="text-slate-400 hover:text-white">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <input
                type="text"
                placeholder="Enter username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <div className="max-h-64 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map(user => (
                    <div key={user.userId} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg mb-2">
                      <div className="flex items-center gap-3">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-10 h-10 rounded-full" alt="" />
                        <div>
                          <p className="text-white font-medium">{user.username}</p>
                          <p className="text-slate-400 text-sm">{user.userId}</p>
                        </div>
                      </div>
                      <button onClick={() => sendRequest(user.userId)} className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm">
                        Add Friend
                      </button>
                    </div>
                  ))
                ) : searchQuery ? (
                  <p className="text-slate-400 text-center">No users found</p>
                ) : (
                  <p className="text-slate-400 text-center">Start typing to search users</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Phone;