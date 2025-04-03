import React from 'react';
import { List, Badge, Avatar } from 'antd';
import { TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Message, ChatSession } from '../types/chat';

interface ChatSessionListProps {
  sessions: ChatSession[];
  activeSession: string;
  onSessionSelect: (sessionId: string) => void;
}

// 生成头像颜色的函数
const generateColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = '#' + ('00000' + (hash & 0xFF).toString(16)).slice(-6);
  return color;
};

const ChatSessionList: React.FC<ChatSessionListProps> = ({
  sessions,
  activeSession,
  onSessionSelect
}) => {
  return (
    <List
      className="session-list"
      itemLayout="horizontal"
      dataSource={sessions}
      renderItem={(session) => (
        <List.Item
          className={`session-item ${activeSession === session.id ? 'active' : ''}`}
          onClick={() => onSessionSelect(session.id)}
        >
          <div className="session-avatar">
            {session.type === 'group' ? (
              <Avatar
                size={40}
                icon={<TeamOutlined />}
                style={{ backgroundColor: '#40a9ff' }}
              />
            ) : (
              <Avatar
                size={40}
                style={{ 
                  backgroundColor: generateColor(session.name),
                  verticalAlign: 'middle' 
                }}
              >
                {session.name[0].toUpperCase()}
              </Avatar>
            )}
          </div>
          <div className="session-content">
            <div className="session-header">
              <span className="session-name">
                {session.name}
                {session.hasUnread && <span className="unread-dot" />}
              </span>
              {session.lastMessage && (
                <span className="session-time">
                  {new Date(session.lastMessage.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="session-info">
              <span className="last-message">
                {session.lastMessage?.content || '暂无消息'}
              </span>
            </div>
          </div>
        </List.Item>
      )}
    />
  );
};

export default ChatSessionList; 