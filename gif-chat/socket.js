const SocketIO = require('socket.io');

module.exports = (server, app) => {
  const io = SocketIO(server, { path: '/socket.io' });
  app.set('io', io); //? 라우터에서 req.app.get('io')로 접근 가능

  //? io.of: 해당 네임스페이스에 접근하는 메서드
  const room = io.of('/room');
  const chat = io.of('/chat');

  room.on('connection', (socket) => {
    console.log('room 네임스페이스에 접속');
    socket.on('disconnect', () => {
      console.log('room 네임스페이스 접속 해제');
    });
  });

  chat.on('connection', (socket) => {
    console.log('chat 네임스페이스에 접속');
    const req = socket.request;
    console.log('## socket.request : ', req);
    const {
      headers: { referer },
    } = req; // 요청 주소가 들어있음

    const roomId = referer.split('/')[referer.split('/').length - 1].replace(/\?.+/, '');
    console.log('### 방 아이디: ', roomId, referer);
    socket.join(roomId);

    socket.on('disconnect', () => {
      console.log('chat 네임스페이스 접속 해제');
      socket.leave(roomId);
    });
  });
};
