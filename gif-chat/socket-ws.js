const WebSocket = require('ws');

//? express 서버를 인자로 받아서 연결한다.
module.exports = (server) => {
  const wss = new WebSocket.Server({ server }); // 웹소켓 서버

  wss.on('connection', (ws, req) => {
    // 웹소켓 연결 시
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress; // 프록시 서버를 거쳤을 경우도 확인
    console.log('새로운 클라이언트 접속: ', ip);

    //* 클라이언트로 부터 메세지 받았을 때
    ws.on('message', (message) => {
      console.log(message);
    });

    //* 에러 이벤트 발생 시
    ws.on('error', (error) => {
      console.error(error);
    });

    //* 연결 종료 시
    ws.on('close', () => {
      console.log('클라이언트 접속 해제', ip);
      clearInterval(ws.interval);
    });

    ws.interval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.send('서버에서 클라이언트로 메시지를 보냅니다.');
      }
    }, 3000);
  });
};
