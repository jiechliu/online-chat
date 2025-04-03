import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:1232",
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 1e8 // 100 MB max message size
});

const onlineUsers = new Map<string, string>(); // socketId -> username
const userSocketMap = new Map<string, string>(); // username -> socketId

io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  // 发送当前在线用户列表
  socket.emit('userList', Array.from(onlineUsers.values()));

  socket.on('join', (username: string) => {
    console.log('用户加入:', username);
    onlineUsers.set(socket.id, username);
    userSocketMap.set(username, socket.id);
    io.emit('userJoined', username);
    // 广播更新后的用户列表
    io.emit('userList', Array.from(onlineUsers.values()));
  });

  socket.on('message', (message) => {
    console.log('收到消息类型:', message.type, '私聊:', message.isPrivate);
    
    if (message.isPrivate && message.to) {
      // 私聊消息
      const targetSocketId = userSocketMap.get(message.to);
      if (targetSocketId) {
        // 发送给目标用户
        io.to(targetSocketId).emit('message', message);
        // 发送给发送者自己
        socket.emit('message', message);
      }
    } else {
      // 群聊消息
      io.emit('message', message);
    }
  });

  socket.on('disconnect', () => {
    const username = onlineUsers.get(socket.id);
    if (username) {
      console.log('用户离开:', username);
      onlineUsers.delete(socket.id);
      userSocketMap.delete(username);
      io.emit('userLeft', username);
      // 广播更新后的用户列表
      io.emit('userList', Array.from(onlineUsers.values()));
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
}); 