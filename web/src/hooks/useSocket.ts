import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message, ChatUser } from '../types/chat';

const SOCKET_SERVER_URL = 'http://localhost:3001'; // 后端服务器地址

export const useSocket = (
  onReceiveMessage: (message: Message) => void,
  onUserJoin?: (username: string) => void,
  onUserLeave?: (username: string) => void,
  onUserListUpdate?: (users: string[]) => void,
  user?: ChatUser | null
) => {
  const socketRef = useRef<Socket>();
  const isConnected = useRef(false);

  // 使用 useCallback 包装回调函数以避免不必要的重新创建
  const handleReceiveMessage = useCallback((message: Message) => {
    console.log('收到消息:', message);
    onReceiveMessage(message);
  }, [onReceiveMessage]);

  const handleUserJoin = useCallback((username: string) => {
    console.log('用户加入:', username);
    onUserJoin?.(username);
  }, [onUserJoin]);

  const handleUserLeave = useCallback((username: string) => {
    console.log('用户离开:', username);
    onUserLeave?.(username);
  }, [onUserLeave]);

  const handleUserList = useCallback((users: string[]) => {
    console.log('在线用户列表更新:', users);
    onUserListUpdate?.(users);
  }, [onUserListUpdate]);

  useEffect(() => {
    // 如果已经连接，则不重新连接
    if (isConnected.current) return;

    // 建立 socket 连接
    socketRef.current = io(SOCKET_SERVER_URL);
    isConnected.current = true;

    // 设置事件监听器
    socketRef.current.on('message', handleReceiveMessage);
    socketRef.current.on('userJoined', handleUserJoin);
    socketRef.current.on('userLeft', handleUserLeave);
    socketRef.current.on('userList', handleUserList);

    // 如果有用户信息，发送加入事件
    if (user) {
      socketRef.current.emit('join', user.username);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off('message', handleReceiveMessage);
        socketRef.current.off('userJoined', handleUserJoin);
        socketRef.current.off('userLeft', handleUserLeave);
        socketRef.current.off('userList', handleUserList);
        socketRef.current.disconnect();
        isConnected.current = false;
      }
    };
  }, [user?.username]); // 只在用户名变化时重新连接

  // 发送消息的方法
  const sendMessage = useCallback((message: Message) => {
    console.log('发送消息:', message);
    socketRef.current?.emit('message', message);
  }, []);

  return { sendMessage };
}; 