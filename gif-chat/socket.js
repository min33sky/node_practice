const SocketIO = require('socket.io');
const cookieParser = require('cookie-parser');
const axios = require('axios');

/**
 * ? Socker.IO에는 session이 없기 때문에 express의 session 미들웨어를 인자로 받아 사용한다.
 * @param {*} server
 * @param {*} app
 * @param {*} sessionMiddleware
 */
module.exports = (server, app, sessionMiddleware) => {
  const io = SocketIO(server, { path: '/socket.io' }); // path: 클라이언트에서 연결하는 주소
  app.set('io', io); //? 라우터에서 req.app.get('io')로 접근 가능

  //? io.of: 해당 네임스페이스에 접근하는 메서드
  const room = io.of('/room');
  const chat = io.of('/chat');

  //? 세션 미들웨어 등록
  io.use((socket, next) => {
    cookieParser(process.env.COOKIE_SECRET)(socket.request, socket.request.res, next);
    sessionMiddleware(socket.request, socket.request.res, next);
  });

  room.on('connection', (socket) => {
    console.log('room 네임스페이스에 접속');
    socket.on('disconnect', () => {
      console.log('room 네임스페이스 접속 해제');
    });
  });

  chat.on('connection', (socket) => {
    console.log('chat 네임스페이스에 접속');
    const req = socket.request;
    // console.log('## socket.request : ', req);
    const {
      headers: { referer },
    } = req; // 요청 주소가 들어있음

    const roomId = referer.split('/')[referer.split('/').length - 1].replace(/\?.+/, '');
    console.log('### 방 아이디: ', roomId, referer);
    console.log('### req.session: ', req.session);
    socket.join(roomId);

    socket.to(roomId).emit('join', {
      user: 'system',
      chat: `${req.session.color}님이 입장하셨습니다.`,
    });

    socket.on('disconnect', () => {
      console.log('chat 네임스페이스 접속 해제');
      socket.leave(roomId);

      const currentRoom = socket.adapter.rooms[roomId];
      const userCount = currentRoom ? currentRoom.length : 0;
      // 유저가 0명이면 방을 제거한다.
      if (userCount === 0) {
        //? 서버 -> 서버는 쿠키를 수동으로 넣어줘야된다.
        axios
          .delete(`http://localhost:8005/room/${roomId}`)
          .then(() => {
            console.log('방 제거 요청 성공');
          })
          .catch((err) => {
            console.error(err);
          });
      } else {
        socket.to(roomId).emit('exit', {
          user: 'system',
          chat: `${req.session.color}님이 퇴장하셨습니다.`,
        });
      }
    });

    // socket.on('chat', (data) => {
    //   socket.to(data.room).emit('chat', data);
    // });
  });
};
