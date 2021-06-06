// event 모듈 사용
var events = require('events');

// EventEmitter 객체 생성
var eventEmitter = new events.EventEmitter();

// EventHandler 함수 생성
var connectHandler = function connected() {
  console.log('Connection Successful');

  // data recevied 이벤트를 발생시키기
  eventEmitter.emit('data_received');
};

// connection 이벤트와 connectHandler 이벤트 핸들러를 연동
eventEmitter.on('connection', connectHandler);

// data received 이벤트와 익명 함수와 연동
eventEmitter.on('data_received', function () {
  console.log('Data Received');
});

// connection 이벤트 발생시키기
eventEmitter.emit('connection');

console.log('Program has ended');
