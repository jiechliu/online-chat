import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Image, Layout, Avatar } from 'antd';
import './App.css';
import { Message, ChatUser, TextMessage, ImageMessage, ChatSession } from './types/chat';
import { generateRandomUsername } from './utils/nameGenerator';
import { useSocket } from './hooks/useSocket';
import ChatSessionList from './components/ChatSessionList';
import { animalIcons, getAnimalFromUsername } from './utils/avatarMapping';

const { Sider, Content } = Layout;

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [user, setUser] = useState<ChatUser | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: 'group',
      name: '群聊',
      type: 'group',
      hasUnread: false
    }
  ]);
  const [activeSession, setActiveSession] = useState<string>('group');

  // 处理接收到的消息
  const handleReceiveMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
    
    // 更新会话列表
    setSessions(prev => {
      const newSessions = [...prev];
      if (message.isPrivate) {
        // 私聊消息
        const otherUser = message.username === user?.username ? message.to! : message.username;
        const sessionIndex = newSessions.findIndex(s => 
          s.type === 'private' && s.name === otherUser
        );
        
        // 判断是否需要增加未读计数：
        // 1. 我是消息接收者（消息是别人发给我的）
        // 2. 不是当前活动会话
        const shouldMarkUnread = 
          message.username !== user?.username && // 消息不是我发的
          message.to === user?.username && // 消息是发给我的
          activeSession !== `private-${otherUser}`; // 不是当前会话
        
        if (sessionIndex === -1) {
          // 创建新会话
          newSessions.push({
            id: `private-${otherUser}`,
            name: otherUser,
            type: 'private',
            lastMessage: message,
            hasUnread: shouldMarkUnread
          });
        } else {
          // 更新现有会话
          newSessions[sessionIndex].lastMessage = message;
          if (shouldMarkUnread) {
            newSessions[sessionIndex].hasUnread = true;
          }
        }
      } else {
        // 群聊消息
        const groupSession = newSessions.find(s => s.id === 'group');
        if (groupSession) {
          groupSession.lastMessage = message;
          // 群聊消息：不是自己发的且不是当前会话时增加未读数
          if (message.username !== user?.username && activeSession !== 'group') {
            groupSession.hasUnread = true;
          }
        }
      }
      return newSessions;
    });
  };

  // 处理用户加入
  const handleUserJoin = (username: string) => {
    setOnlineUsers(prev => [...prev, username]);
    setMessages(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        username: 'System',
        content: `${username} 加入了聊天室`,
        timestamp: Date.now(),
        type: 'text' as const
      }
    ]);
  };

  // 处理用户离开
  const handleUserLeave = (username: string) => {
    setOnlineUsers(prev => prev.filter(user => user !== username));
    setMessages(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        username: 'System',
        content: `${username} 离开了聊天室`,
        timestamp: Date.now(),
        type: 'text' as const
      }
    ]);
  };

  // 处理用户列表更新
  const handleUserListUpdate = (users: string[]) => {
    setOnlineUsers(users);
  };

  // 使用 socket hook
  const { sendMessage } = useSocket(
    handleReceiveMessage,
    handleUserJoin,
    handleUserLeave,
    handleUserListUpdate,
    user
  );

  useEffect(() => {
    // 初始化用户
    const storedUser = localStorage.getItem('chatUser');
    if (!storedUser) {
      const newUser: ChatUser = {
        username: generateRandomUsername(),
        id: Math.random().toString(36).substr(2, 9)
      };
      localStorage.setItem('chatUser', JSON.stringify(newUser));
      setUser(newUser);
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!currentMessage.trim() && !fileInputRef.current?.files?.length) || !user) return;

    // 清除当前会话的未读状态
    setSessions(prev =>
      prev.map(session =>
        session.id === activeSession
          ? { ...session, hasUnread: false }
          : session
      )
    );

    if (currentMessage.trim()) {
      const newMessage: TextMessage = {
        id: Math.random().toString(36).substr(2, 9),
        username: user.username,
        content: currentMessage,
        timestamp: Date.now(),
        type: 'text',
        isPrivate: !!selectedUser,
        to: selectedUser || undefined
      };
      sendMessage(newMessage);
      setCurrentMessage('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result as string;
      const newMessage: ImageMessage = {
        id: Math.random().toString(36).substr(2, 9),
        username: user.username,
        content: '发送了一张图片',
        imageUrl,
        timestamp: Date.now(),
        type: 'image',
        isPrivate: !!selectedUser,
        to: selectedUser || undefined
      };
      sendMessage(newMessage);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 处理会话选择
  const handleSessionSelect = (sessionId: string) => {
    setActiveSession(sessionId);
    setSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, hasUnread: false }
          : session
      )
    );
    
    // 如果是私聊，设置选中的用户
    if (sessionId !== 'group') {
      const targetUser = sessions.find(s => s.id === sessionId)?.name;
      setSelectedUser(targetUser || '');
    } else {
      setSelectedUser('');
    }
  };

  // 过滤当前会话的消息
  const currentMessages = useMemo(() => {
    if (activeSession === 'group') {
      return messages.filter(m => !m.isPrivate);
    }
    const targetUser = sessions.find(s => s.id === activeSession)?.name;
    return messages.filter(m => 
      m.isPrivate && (
        (m.username === user?.username && m.to === targetUser) ||
        (m.username === targetUser && m.to === user?.username)
      )
    );
  }, [messages, activeSession, sessions, user]);

  // 处理头像点击事件
  const handleAvatarClick = (username: string) => {
    if (username === user?.username || username === 'System') return;
    
    // 查找或创建私聊会话
    const existingSession = sessions.find(s => 
      s.type === 'private' && s.name === username
    );

    if (!existingSession) {
      // 创建新的私聊会话
      setSessions(prev => [...prev, {
        id: `private-${username}`,
        name: username,
        type: 'private',
        hasUnread: false
      }]);
    }

    // 切换到私聊会话
    setActiveSession(existingSession?.id || `private-${username}`);
    setSelectedUser(username);
  };

  // 在消息渲染部分修改头像渲染函数
  const renderUserAvatar = (username: string) => {
    const animal = getAnimalFromUsername(username);
    const IconComponent = animalIcons[animal];
    return (
      <Avatar
        icon={<IconComponent />}
        style={{ 
          backgroundColor: '#f0f0f0',
          color: '#666',
          cursor: username !== 'System' && username !== user?.username ? 'pointer' : 'default'
        }}
        onClick={() => handleAvatarClick(username)}
      />
    );
  };

  if (!user) return <div>加载中...</div>;

  return (
    <Layout className="chat-layout">
      <Sider width={250} className="chat-sider">
        <ChatSessionList
          sessions={sessions}
          activeSession={activeSession}
          onSessionSelect={handleSessionSelect}
        />
      </Sider>
      <Content className="chat-content">
        <div className="chat-container">
          <div className="chat-header">
            <h2>{activeSession === 'group' ? '群聊' : `与 ${sessions.find(s => s.id === activeSession)?.name} 的对话`}</h2>
            {activeSession === 'group' && (
              <div className="online-users">
                在线用户 ({onlineUsers.length}): {onlineUsers.join(', ')}
              </div>
            )}
          </div>
          
          <div className="messages-container">
            {currentMessages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.username === user.username ? 'own-message' : ''} 
                  ${message.username === 'System' ? 'system-message' : ''} 
                  ${message.isPrivate ? 'private-message' : ''}`}
              >
                <div className="message-header">
                  {renderUserAvatar(message.username)}
                  <span className="username">{message.username}</span>
                  <span className="timestamp">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-content">
                  {message.type === 'image' ? (
                    <Image
                      src={message.imageUrl}
                      alt="用户上传的图片"
                      className="message-image"
                      preview={{
                        maskClassName: 'message-image-mask',
                        toolbarRender: () => null, // 隐藏底部工具栏
                      }}
                    />
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="message-input-form">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder={selectedUser ? `私聊 ${selectedUser}` : "输入消息..."}
              className="message-input"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              ref={fileInputRef}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <label htmlFor="image-upload" className="upload-button">
              <span role="img" aria-label="upload image">📷</span>
            </label>
            <button type="submit" className="send-button">发送</button>
          </form>
        </div>
      </Content>
    </Layout>
  );
}

export default App;
