import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      process.env.ADMIN_URL || 'http://localhost:3001',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Kết nối từ client
const clientIO = io.of('/client');
// Kết nối từ admin
const adminIO = io.of('/admin');

// Lưu danh sách admin đang online
let onlineAdmins: string[] = [];

// Xử lý kết nối từ client
clientIO.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Xử lý kết nối từ admin
adminIO.on('connection', (socket) => {
  console.log('Admin connected:', socket.id);

  // Thêm admin vào danh sách online
  onlineAdmins.push(socket.id);
  console.log('Online admins:', onlineAdmins.length);

  socket.on('disconnect', () => {
    console.log('Admin disconnected:', socket.id);
    onlineAdmins = onlineAdmins.filter((id) => id !== socket.id);
  });
});

app.post('/notify/new-order', (req, res) => {
  const {
    orderId,
    contactPhone,
    orderTotal,
    customerName,
    customerEmail,
    userId,
    items,
    status,
  } = req.body;

  if (!orderId) {
    res
      .status(400)
      .json({ success: false, message: 'Missing required fields' });
    return;
  }

  // Gửi thông báo tới tất cả admin đang online
  adminIO.emit('new-order', {
    id: orderId,
    contactPhone,
    orderTotal,
    customerName: customerName || 'Khách vãng lai',
    customerEmail,
    userId,
    items,
    status,
    time: new Date().toISOString(),
    read: false,
    type: 'order',
  });

  res.status(200).json({ success: true, message: 'Notification sent' });
});

app.post('/notify/expiring-promotions', (req, res) => {
  const { promotions } = req.body;

  if (!promotions || !Array.isArray(promotions) || promotions.length === 0) {
    res
      .status(400)
      .json({ success: false, message: 'Missing or invalid promotions data' });
    return;
  }

  adminIO.emit('expiring-promotions', {
    promotions: promotions.map((promo) => ({
      id: promo.id,
      name: promo.name,
      code: promo.code,
      expiryDate: promo.expiryDate,
      daysRemaining: promo.daysRemaining,
      discountValue: promo.discountValue,
    })),
    time: new Date().toISOString(),
    read: false,
    type: 'promotion',
  });

  res.status(200).json({
    success: true,
    message: 'Promotion expiration notification sent',
    adminCount: onlineAdmins.length,
  });
});

const PORT = process.env.SOCKET_PORT || 3003;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
