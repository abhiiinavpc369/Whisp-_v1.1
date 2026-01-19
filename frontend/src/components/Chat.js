import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import ProfileSettings from './ProfileSettings';

const API_BASE = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:3001`;

const Chat = ({ user, users, onUpdateUser, onUpdateUsers }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [pastedImage, setPastedImage] = useState(false);
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const [calling, setCalling] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [deleteOptions, setDeleteOptions] = useState(null);
  const [showCallLogs, setShowCallLogs] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const socketRef = useRef();
  const messagesEndRef = useRef();
  const fileInputRef = useRef();
  const imageInputRef = useRef();

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
    socketRef.current.on('incomingCall', (data) => {
      setIncomingCall(data);
    });
    socketRef.current.on('callAccepted', (data) => {
      setCalling(true);
    });
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    return () => socketRef.current.disconnect();
  }, [user.userId]);

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

  useEffect(() => {
    let interval;
    if (calling) {
      interval = setInterval(() => {
        setCallTimer(prev => {
          if (prev >= 30) {
            setCalling(false);
            setCallTimer(0);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => clearInterval(interval);
  }, [calling]);

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

  const sendMessage = async () => {
    if (!message && !file) return;
    const token = localStorage.getItem('token');
    let messageType = 'text';
    let content = message;
    let fileMeta = null;
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await axios.post(`${API_BASE}/api/files/upload`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        messageType = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'file';
        content = res.data.fileURL;
        fileMeta = {
          fileName: res.data.fileName,
          fileSize: res.data.fileSize,
          fileType: res.data.fileType
        };
      } catch (err) {
        alert('File upload failed');
        return;
      }
    }
    const msg = {
      senderId: user.userId,
      receiverId: selectedUser.userId,
      messageType,
      content,
      fileMeta,
      replyTo: replyTo?._id
    };
    try {
      const res = await axios.post(`${API_BASE}/api/messages`, msg, {
        headers: { Authorization: `Bearer ${token}` }
      });
      socketRef.current.emit('sendMessage', res.data);
      setMessages(prev => [...prev, res.data]);
      setMessage('');
      setFile(null);
      setReplyTo(null);
      setPastedImage(false);
    } catch (err) {
      alert('Failed to send message');
    }
  };

  const handleReaction = async (msgId, emoji) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(`${API_BASE}/api/messages/${msgId}/react`, { emoji }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => prev.map(m => m._id === msgId ? res.data : m));
      setShowMessageMenu(null); // Close menu after reaction
    } catch (err) {
      alert('Reaction failed');
    }
  };

  const handleEdit = async (msgId, newContent) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.put(`${API_BASE}/api/messages/${msgId}`, { content: newContent }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => prev.map(m => m._id === msgId ? res.data : m));
      setEditingMessage(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Edit failed');
    }
  };

  const handleDelete = async (msgId, type) => {
    if (type === 'everyone') {
      const token = localStorage.getItem('token');
      try {
        await axios.delete(`${API_BASE}/api/messages/${msgId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(prev => prev.filter(m => m._id !== msgId));
      } catch (err) {
        alert(err.response?.data?.message || 'Delete failed');
      }
    } else if (type === 'me') {
      setMessages(prev => prev.filter(m => m._id !== msgId));
    }
    setDeleteOptions(null);
  };

  const handlePin = async (msgId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.put(`${API_BASE}/api/messages/${msgId}/pin`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => prev.map(m => m._id === msgId ? res.data : m));
    } catch (err) {
      alert('Pin failed');
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const handlePhoneCall = () => {
    socketRef.current.emit('startCall', { to: selectedUser.userId, from: user.userId });
    setCalling(true);
    if (Notification.permission === 'granted') {
      new Notification('Outgoing call', { body: `Calling ${selectedUser.username}` });
    }
  };

  const handlePlusClick = () => {
    setShowAttachmentOptions(!showAttachmentOptions);
  };

  const handleMicrophoneClick = () => {
    // Placeholder for voice message
    alert('Voice message feature coming soon!');
  };

  const handleImageClick = () => {
    imageInputRef.current.click();
  };

  const handleSmileClick = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setShowAttachmentOptions(false);
    }
  };

  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0];
    if (selectedImage) {
      setFile(selectedImage);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleAcceptCall = () => {
    socketRef.current.emit('acceptCall', { to: incomingCall.from, from: user.userId });
    setIncomingCall(null);
    setCalling(true);
  };

  const handleRejectCall = () => {
    socketRef.current.emit('rejectCall', { to: incomingCall.from, from: user.userId });
    setIncomingCall(null);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className={`w-full md:w-80 bg-gray-800 bg-opacity-80 backdrop-blur-md border-r border-gray-700 flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 bg-green-600 text-white flex justify-between items-center sticky top-0 z-10">
          <h3 className="text-lg font-semibold">Chats</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowStatus(true)} className="text-white hover:text-gray-400"><i className="fas fa-circle"></i></button>
            <button onClick={() => setShowCallLogs(true)} className="text-white hover:text-gray-400"><i className="fas fa-phone"></i></button>
            <button onClick={() => setShowSettings(true)} className="text-white hover:text-gray-400"><i className="fas fa-cog"></i></button>
            <button onClick={handleLogout} className="text-white hover:text-gray-400"><i className="fas fa-sign-out-alt"></i></button>
          </div>
        </div>
        <input
          className="p-3 border-b border-gray-600 bg-gray-700 text-white placeholder-gray-400"
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {friendRequests.length > 0 && (
          <div className="p-3">
            <h4 className="text-gray-400 mb-2">Friend Requests</h4>
            {friendRequests.map(req => (
              <div key={req.userId} className="flex items-center p-2 hover:bg-gray-700 cursor-pointer">
                <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center mr-3">{req.userId.charAt(0).toUpperCase()}</div>
                <div className="flex-1">
                  <h4 className="font-semibold">{req.userId}</h4>
                  <button onClick={() => acceptRequest(req.userId)} className="bg-green-600 text-white px-3 py-1 rounded text-sm"><i className="fas fa-check"></i> Accept</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {searchResults.length > 0 ? (
            searchResults.map(user => (
              <div key={user.userId} className="flex items-center p-3 hover:bg-gray-700 cursor-pointer">
                <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center mr-3">{user.username.charAt(0).toUpperCase()}</div>
                <div className="flex-1">
                  <h4 className="font-semibold">{user.username}</h4>
                  <button onClick={() => sendRequest(user.userId)} className="bg-purple-600 text-white px-3 py-1 rounded text-sm"><i className="fas fa-user-plus"></i> Add</button>
                </div>
              </div>
            ))
          ) : (
            conversations.map(conv => (
              <div key={conv.userId} className="flex items-center p-3 hover:bg-gray-700 cursor-pointer" onClick={() => setSelectedUser(conv)}>
                <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center mr-3 relative overflow-hidden">
                  {conv.profilePicture ? (
                    <img src={conv.profilePicture} alt={conv.username} className="w-full h-full object-cover" />
                  ) : (
                    conv.username.charAt(0).toUpperCase()
                  )}
                  <div className={`absolute bottom-0 left-0 w-3 h-3 rounded-full border-2 border-gray-800 ${
                    conv.isOnline ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{conv.username}</h4>
                  <p className="text-gray-400 text-sm">{conv.lastMessage ? (conv.lastMessage.messageType === 'text' ? conv.lastMessage.content : 'File') : 'Tap to chat'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className={`w-full md:flex-1 flex flex-col bg-gray-800 bg-opacity-80 backdrop-blur-md ${selectedUser ? 'flex' : 'hidden md:flex'}`}>
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <i className="fas fa-comments text-6xl mb-4"></i>
              <h2 className="text-2xl font-semibold">Select a chat to start messaging</h2>
              <p>Choose a friend from the list to begin a conversation.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 bg-green-600 text-white flex items-center justify-between">
              <div className="flex items-center">
                <button onClick={() => { setSelectedUser(null); setMessages([]); }} className="mr-3 md:hidden"><i className="fas fa-arrow-left"></i></button>
                <div className="w-10 h-10 bg-gray-700 text-purple-400 rounded-full flex items-center justify-center mr-3 cursor-pointer relative overflow-hidden" onClick={() => setShowProfile(true)}>
                  {selectedUser.profilePicture ? (
                    <img src={selectedUser.profilePicture} alt={selectedUser.username} className="w-full h-full object-cover" />
                  ) : (
                    selectedUser.username.charAt(0).toUpperCase()
                  )}
                  <div className={`absolute bottom-0 left-0 w-3 h-3 rounded-full border-2 border-gray-800 ${
                    selectedUser.isOnline ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                </div>
                <div>
                  <h3 className="font-semibold">{selectedUser.username}</h3>
                  <span className="text-sm opacity-75">{selectedUser.status}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handlePhoneCall} className="hover:text-gray-400"><i className="fas fa-phone"></i></button>
                <button onClick={() => setShowSettings(true)} className="hover:text-gray-400"><i className="fas fa-ellipsis-v"></i></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={msg._id || i} className={`flex ${msg.senderId === user.userId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-3xl relative ${msg.senderId === user.userId ? 'bg-green-500 text-white' : 'bg-white text-black'}`}>
                    {msg.replyTo && (
                      <div className="text-xs opacity-75 mb-1 border-l-2 border-gray-500 pl-2">
                        Replying to: {msg.replyTo.messageType === 'text' ? msg.replyTo.content : 'File'}
                      </div>
                    )}
                    {msg.messageType === 'text' ? (
                      editingMessage === msg._id ? (
                        <input
                          className="w-full bg-transparent border-none outline-none text-white"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEdit(msg._id, message);
                            if (e.key === 'Escape') setEditingMessage(null);
                          }}
                        />
                      ) : (
                        <p>{msg.content}</p>
                      )
                    ) : msg.messageType === 'image' ? (
                      <img src={`${API_BASE}${msg.content}`} alt="Shared" className="max-w-full rounded" />
                    ) : msg.messageType === 'video' ? (
                      <video src={`${API_BASE}${msg.content}`} controls className="max-w-full rounded" />
                    ) : (
                      <a href={`${API_BASE}${msg.content}`} className="text-purple-300"><i className="fas fa-file"></i> {msg.fileMeta?.fileName}</a>
                    )}
                    {msg.edited && <span className="text-xs opacity-75"> (edited)</span>}
                    {msg.pinned && <i className="fas fa-thumbtack text-xs ml-1"></i>}
                    <div className="text-xs opacity-75 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                    <div className="flex gap-1 mt-1">
                      {msg.reactions.map((r, idx) => (
                        <span key={idx} className="text-xs bg-gray-600 text-white px-1 rounded">{r.emoji} {r.userId === user.userId ? 'You' : ''}</span>
                      ))}
                    </div>
                    <button className="absolute top-0 right-0 text-xs opacity-50 hover:opacity-100" onClick={() => setShowMessageMenu(msg._id === showMessageMenu ? null : msg._id)}><i className="fas fa-ellipsis-h"></i></button>
                    {showMessageMenu === msg._id && (
                      <div className="absolute top-0 right-0 mt-2 bg-gray-600 rounded shadow-lg z-10 max-w-xs">
                        <div className="grid grid-cols-6 gap-1 p-2">
                          {['👍', '❤️', '😂', '😢', '😮', '🙄', '😡', '😴', '🤔', '👏', '🔥', '💯'].map(emoji => (
                            <button key={emoji} onClick={() => handleReaction(msg._id, emoji)} className="text-lg hover:bg-gray-500 rounded p-1">{emoji}</button>
                          ))}
                        </div>
                        {msg.senderId === user.userId && (
                          <>
                            <button onClick={() => setEditingMessage(msg._id)} className="block px-2 py-1 text-xs hover:bg-gray-500">Edit</button>
                            <button onClick={() => setDeleteOptions(msg._id)} className="block px-2 py-1 text-xs hover:bg-gray-500">Delete</button>
                          </>
                        )}
                        <button onClick={() => setReplyTo(msg)} className="block px-2 py-1 text-xs hover:bg-gray-500">Reply</button>
                        <button onClick={() => handlePin(msg._id)} className="block px-2 py-1 text-xs hover:bg-gray-500">{msg.pinned ? 'Unpin' : 'Pin'}</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            {replyTo && (
              <div className="p-2 bg-gray-700 border-t border-gray-600 flex items-center justify-between">
                <span className="text-sm text-white">Replying to: {replyTo.messageType === 'text' ? replyTo.content : 'File'}</span>
                <button onClick={() => setReplyTo(null)} className="text-red-500">×</button>
              </div>
            )}
            {file && (
              <div className="p-2 bg-gray-700 border-t border-gray-600">
                {file.type.startsWith('image') && <img src={URL.createObjectURL(file)} alt="Preview" className="max-h-20 rounded" />}
                {file.type.startsWith('video') && <video src={URL.createObjectURL(file)} className="max-h-20 rounded" />}
                <span className="text-white">{file.name}</span>
              </div>
            )}
            {pastedImage && <div className="p-2 bg-yellow-600 text-center text-white">Image pasted! Ready to send.</div>}
            <div className="sticky bottom-0 p-3 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3 rounded-t-3xl">
              <button onClick={handlePlusClick} className="w-9 h-9 bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-full flex items-center justify-center hover:scale-95 transition-transform">
                <i className="fas fa-plus text-sm"></i>
              </button>
              {showAttachmentOptions && (
                <div className="absolute bottom-12 left-3 bg-white dark:bg-gray-700 rounded-lg shadow-lg p-2 flex gap-2">
                  <button onClick={() => fileInputRef.current.click()} className="text-gray-600 dark:text-gray-300 hover:text-purple-500">
                    <i className="fas fa-file text-lg"></i>
                  </button>
                  <button onClick={handleImageClick} className="text-gray-600 dark:text-gray-300 hover:text-purple-500">
                    <i className="fas fa-image text-lg"></i>
                  </button>
                </div>
              )}
              <div className="flex-1 relative">
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                />
              </div>
              <button onClick={handleMicrophoneClick} className="w-9 h-9 text-gray-500 hover:text-purple-500 transition-colors">
                <i className="fas fa-microphone text-lg"></i>
              </button>
              <button onClick={handleImageClick} className="w-9 h-9 text-gray-500 hover:text-purple-500 transition-colors">
                <i className="fas fa-image text-lg"></i>
              </button>
              <button onClick={handleSmileClick} className="w-9 h-9 text-gray-500 hover:text-purple-500 transition-colors">
                <i className="fas fa-smile text-lg"></i>
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-12 right-3 bg-white dark:bg-gray-700 rounded-lg shadow-lg p-2 grid grid-cols-6 gap-1 max-w-xs">
                  {['😊', '😂', '❤️', '👍', '😢', '😮', '🙄', '😡', '😴', '🤔', '👏', '🔥', '💯', '😍', '🥰', '🤗', '😉', '🙌', '✨', '🎉'].map(emoji => (
                    <button key={emoji} onClick={() => handleEmojiSelect(emoji)} className="text-2xl hover:bg-gray-200 dark:hover:bg-gray-600 rounded p-1">
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              {message && (
                <button onClick={sendMessage} className="w-9 h-9 bg-purple-500 text-white rounded-full hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors">
                  <i className="fas fa-paper-plane text-sm"></i>
                </button>
              )}
            </div>
          </>
        )}
      </div>
      {showSettings && <ProfileSettings user={user} onClose={() => setShowSettings(false)} onUpdate={onUpdateUser} />}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" onClick={() => setShowProfile(false)}>
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl relative">
                <div className="absolute bottom-0 left-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800"></div>
                {selectedUser.username.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-semibold">{selectedUser.username}</h2>

              <p>Bio: {selectedUser.bio || 'No bio'}</p>
              <p>Status: {selectedUser.status || 'No status'}</p>
              <p>Last Seen: {selectedUser.lastSeen ? new Date(selectedUser.lastSeen).toLocaleString() : 'Unknown'}</p>
              <button onClick={() => setShowProfile(false)} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Close</button>
            </div>
          </div>
        </div>
      )}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" onClick={() => setIncomingCall(null)}>
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">{incomingCall.from.charAt(0).toUpperCase()}</div>
              <h2 className="text-xl font-semibold">Incoming Call</h2>
              <p>{incomingCall.from} is calling you</p>
              <div className="flex gap-4 mt-4">
                <button onClick={handleAcceptCall} className="flex-1 px-4 py-2 bg-green-600 text-white rounded">Accept</button>
                <button onClick={handleRejectCall} className="flex-1 px-4 py-2 bg-red-600 text-white rounded">Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {calling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" onClick={() => setCalling(false)}>
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">{selectedUser.username.charAt(0).toUpperCase()}</div>
              <h2 className="text-xl font-semibold">Calling {selectedUser.username}</h2>
              <p>{selectedUser.isOnline ? 'Ringing...' : 'Calling...'}</p>
              <p className="text-sm opacity-75">{Math.floor(callTimer / 60)}:{(callTimer % 60).toString().padStart(2, '0')}</p>
              <button onClick={() => setCalling(false)} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">Hang Up</button>
            </div>
          </div>
        </div>
      )}
      {deleteOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" onClick={() => setDeleteOptions(null)}>
          <div className="bg-gray-800 p-6 rounded-lg max-w-sm w-full mx-4 text-white" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Delete Message</h3>
            <div className="space-y-3">
              <button onClick={() => handleDelete(deleteOptions, 'me')} className="w-full p-3 bg-gray-700 text-white rounded hover:bg-gray-600">Delete for me</button>
              <button onClick={() => handleDelete(deleteOptions, 'everyone')} className="w-full p-3 bg-red-600 text-white rounded hover:bg-red-700">Delete for everyone</button>
            </div>
            <button onClick={() => setDeleteOptions(null)} className="mt-4 w-full p-2 bg-gray-600 text-white rounded">Cancel</button>
          </div>
        </div>
      )}
      {showCallLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" onClick={() => setShowCallLogs(false)}>
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 text-white" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Call Logs</h3>
            <div className="space-y-2">
              <div className="flex items-center p-3 bg-gray-700 rounded">
                <i className="fas fa-phone text-green-500 mr-3"></i>
                <div>
                  <p className="font-semibold">AbhinavJi</p>
                  <p className="text-sm text-gray-400">Outgoing • 5 min</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-700 rounded">
                <i className="fas fa-phone text-red-500 mr-3"></i>
                <div>
                  <p className="font-semibold">Friend1</p>
                  <p className="text-sm text-gray-400">Missed • 2 hours ago</p>
                </div>
              </div>
            </div>
            <button onClick={() => setShowCallLogs(false)} className="mt-4 w-full p-2 bg-green-600 text-white rounded">Close</button>
          </div>
        </div>
      )}
      {showStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" onClick={() => setShowStatus(false)}>
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 text-white" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Status</h3>
            <div className="space-y-4">
              <div className="p-3 bg-gray-700 rounded">
                <p className="font-semibold mb-2">Update Your Status</p>
                <textarea
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded resize-none"
                  placeholder="What's on your mind?"
                  rows="3"
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      // Placeholder: In a real app, save to server
                      alert('Status updated: ' + message);
                      setMessage('');
                      setShowStatus(false);
                    }
                  }}
                ></textarea>
              </div>
              <div className="flex items-center p-3 bg-gray-700 rounded">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold">F</span>
                </div>
                <div>
                  <p className="font-semibold">Friend Status</p>
                  <p className="text-sm text-gray-400">Available</p>
                </div>
              </div>
            </div>
            <button onClick={() => setShowStatus(false)} className="mt-4 w-full p-2 bg-green-600 text-white rounded">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;