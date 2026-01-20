import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Chat from './Chat';
import ProfileSettings from './ProfileSettings';
import Login from './Login';

const Phone = () => {
  const [sidebarHidden, setSidebarHidden] = useState(true);
  const [activeTab, setActiveTab] = useState('message');
  const [viewTitle, setViewTitle] = useState('Messages');
  const [dialDisplay, setDialDisplay] = useState('');
  const [callName, setCallName] = useState('Alex Rivera');
  const [callAvatar, setCallAvatar] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix');
  const [callStatus, setCallStatus] = useState('Calling...');
  const [callTimer, setCallTimer] = useState('');
  const [timerInterval, setTimerInterval] = useState(null);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const API_BASE = process.env.REACT_APP_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}`;

  const toggleSidebar = () => {
    setSidebarHidden(!sidebarHidden);
  };

  const switchTab = (tabId, title) => {
    setActiveTab(tabId);
    setViewTitle(title);
  };

  const appendDigit = (digit) => {
    if (dialDisplay.length < 15) {
      setDialDisplay(dialDisplay + digit);
    }
  };

  const clearDigit = () => {
    setDialDisplay(dialDisplay.slice(0, -1));
  };

  const startCall = (name) => {
    const finalName = (name === 'Unknown' && dialDisplay) ? dialDisplay : name;
    setCallName(finalName);
    setCallAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${finalName}`);
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

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="bg-slate-900 text-white font-sans overflow-hidden">
      <div className="flex h-screen w-full overflow-hidden relative">
        {/* Sidebar (Left Rail) */}
        <aside id="sidebar" className={`fixed inset-y-0 left-0 z-50 w-full sm:w-80 bg-slate-800 text-white border-r border-slate-600 md:relative md:translate-x-0 ${sidebarHidden ? 'sidebar-hidden' : 'sidebar-visible'} flex flex-col shadow-2xl md:shadow-none ${(activeTab === 'call' || activeTab === 'message') ? '' : 'hidden'}`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-800 sticky top-0">
            <div className="flex items-center gap-2 flex-1">
              <h1 id="view-title" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{viewTitle}<span className="ml-1 text-slate-400">...</span></h1>
              <button onClick={() => setSearchModalOpen(true)} className="p-1 hover:bg-slate-700 rounded-full">
                <i className="fas fa-search text-slate-400 hover:text-white"></i>
              </button>
              {activeTab === 'message' && (
                <div className="relative">
                  <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 hover:bg-slate-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                  </button>
                  {menuOpen && (
                    <div className="absolute top-full right-0 mt-1 w-32 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 text-white">
                      <button onClick={() => { switchTab('settings', 'Settings'); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-700 rounded-t-lg">Settings</button>
                      <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-700 rounded-b-lg">Logout</button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-full md:hidden" onClick={toggleSidebar}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 6-12 12"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* CALL TAB */}
            <div id="tab-call" className={`tab-content p-2 space-y-1 ${activeTab === 'call' ? 'active' : ''}`}>
              <div className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent</div>
              <div className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors" onClick={() => startCall('Alex Rivera')}>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold truncate">Alex Rivera</h3>
                  <p className="text-xs text-red-500">Missed • 10:30 AM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors" onClick={() => startCall('Sarah Chen')}>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 10 4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14V10z"/><rect width="14" height="12" x="3" y="6" rx="2"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold truncate">Sarah Chen</h3>
                  <p className="text-xs text-slate-500">Outgoing • Yesterday</p>
                </div>
              </div>
              <div id="dial-display" className="text-3xl font-light tracking-widest h-12 mb-6 mt-4 flex items-center justify-center">{dialDisplay}</div>
              <div className="grid grid-cols-3 gap-4 sm:gap-6">
                <button className="w-16 h-16 rounded-full bg-slate-100 flex flex-col items-center justify-center active:bg-slate-200 sm:hover:bg-slate-200 transition-colors" onClick={() => appendDigit('1')}><span className="text-xl">1</span><span className="text-[8px] text-slate-400">&nbsp;</span></button>
                <button className="w-16 h-16 rounded-full bg-slate-100 flex flex-col items-center justify-center active:bg-slate-200 sm:hover:bg-slate-200 transition-colors" onClick={() => appendDigit('2')}><span className="text-xl">2</span><span className="text-[8px] text-slate-400">ABC</span></button>
                <button className="w-16 h-16 rounded-full bg-slate-100 flex flex-col items-center justify-center active:bg-slate-200 sm:hover:bg-slate-200 transition-colors" onClick={() => appendDigit('3')}><span className="text-xl">3</span><span className="text-[8px] text-slate-400">DEF</span></button>
                <button className="w-16 h-16 rounded-full bg-slate-100 flex flex-col items-center justify-center active:bg-slate-200 sm:hover:bg-slate-200 transition-colors" onClick={() => appendDigit('4')}><span className="text-xl">4</span><span className="text-[8px] text-slate-400">GHI</span></button>
                <button className="w-16 h-16 rounded-full bg-slate-100 flex flex-col items-center justify-center active:bg-slate-200 sm:hover:bg-slate-200 transition-colors" onClick={() => appendDigit('5')}><span className="text-xl">5</span><span className="text-[8px] text-slate-400">JKL</span></button>
                <button className="w-16 h-16 rounded-full bg-slate-100 flex flex-col items-center justify-center active:bg-slate-200 sm:hover:bg-slate-200 transition-colors" onClick={() => appendDigit('6')}><span className="text-xl">6</span><span className="text-[8px] text-slate-400">MNO</span></button>
                <button className="w-16 h-16 rounded-full bg-slate-100 flex flex-col items-center justify-center active:bg-slate-200 sm:hover:bg-slate-200 transition-colors" onClick={() => appendDigit('7')}><span className="text-xl">7</span><span className="text-[8px] text-slate-400">PQRS</span></button>
                <button className="w-16 h-16 rounded-full bg-slate-100 flex flex-col items-center justify-center active:bg-slate-200 sm:hover:bg-slate-200 transition-colors" onClick={() => appendDigit('8')}><span className="text-xl">8</span><span className="text-[8px] text-slate-400">TUV</span></button>
                <button className="w-16 h-16 rounded-full bg-slate-100 flex flex-col items-center justify-center active:bg-slate-200 sm:hover:bg-slate-200 transition-colors" onClick={() => appendDigit('9')}><span className="text-xl">9</span><span className="text-[8px] text-slate-400">WXYZ</span></button>
                <button className="w-16 h-16 rounded-full bg-slate-100 flex flex-col items-center justify-center active:bg-slate-200 sm:hover:bg-slate-200 transition-colors" onClick={() => appendDigit('*')}><span className="text-xl">*</span></button>
                <button className="w-16 h-16 rounded-full bg-slate-100 flex flex-col items-center justify-center active:bg-slate-200 sm:hover:bg-slate-200 transition-colors" onClick={() => appendDigit('0')}><span className="text-xl">0</span></button>
                <button className="w-16 h-16 rounded-full bg-slate-100 flex flex-col items-center justify-center active:bg-slate-200 sm:hover:bg-slate-200 transition-colors" onClick={() => appendDigit('#')}><span className="text-xl">#</span></button>
              </div>
              <div className="mt-8 flex gap-8">
                <button className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg active:bg-green-600 sm:hover:bg-green-600 transition-all" onClick={() => startCall('Unknown')}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </button>
                <button className="w-16 h-16 flex items-center justify-center text-slate-400 active:text-slate-600 sm:hover:text-slate-600 transition-colors" onClick={clearDigit}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
                </button>
              </div>
            </div>

            {/* MESSAGE TAB */}
            <div id="tab-message" className={`tab-content ${activeTab === 'message' ? 'active' : ''}`}>
            </div>

            {/* STATUS TAB */}
            <div id="tab-status" className={`tab-content ${activeTab === 'status' ? 'active' : ''}`}></div>

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
          {activeTab === 'status' && <div className="flex-1 p-4"><h2>Status</h2><p>Your current status: {user?.status || 'Online'}</p><p>View and update your status.</p></div>}
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