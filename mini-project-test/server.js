const app = require('./app');

//? 통합테스트를 위해 app의 서버 실행 부분을 분리했다.
app.listen(app.get('port'), () => {
  console.log(app.get('port'), '번 포트에서 대기중');
});
