const { Server } = require('socket.io');
const http = require('http');

// Criar servidor HTTP
const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Porta do servidor WebSocket
const PORT = process.env.WEBSOCKET_PORT || 3001;

// Armazenar conexões ativas
const connectedClients = new Set();

io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);
  connectedClients.add(socket.id);

  // Evento quando um cliente se desconecta
  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`);
    connectedClients.delete(socket.id);
  });

  // Evento para receber notificações de novos agendamentos
  socket.on('appointment:created', (appointment) => {
    console.log('Novo agendamento recebido:', appointment.id);
    // Emitir para todos os clientes conectados (exceto o remetente)
    socket.broadcast.emit('appointment:new', appointment);
  });

  // Evento para receber notificações de atualizações de agendamentos
  socket.on('appointment:updated', (appointment) => {
    console.log('Agendamento atualizado:', appointment.id);
    socket.broadcast.emit('appointment:update', appointment);
  });

  // Evento para receber notificações de cancelamento de agendamentos
  socket.on('appointment:cancelled', (appointmentId) => {
    console.log('Agendamento cancelado:', appointmentId);
    socket.broadcast.emit('appointment:cancel', appointmentId);
  });

  // Evento para confirmar conexão
  socket.emit('connected', { message: 'Conectado ao servidor WebSocket' });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor WebSocket rodando na porta ${PORT}`);
  console.log(`📡 Aguardando conexões...`);
});

// Tratamento de erros
server.on('error', (error) => {
  console.error('Erro no servidor WebSocket:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Encerrando servidor WebSocket...');
  server.close(() => {
    console.log('Servidor WebSocket encerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Encerrando servidor WebSocket...');
  server.close(() => {
    console.log('Servidor WebSocket encerrado');
    process.exit(0);
  });
});

