const express = require('express');
const path = require('path');
const session = require('express-session');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const ColorHash = require('color-hash').default;

dotenv.config();

const webSocket = require('./socket');
const indexRouter = require('./routes');

const connect = require('./schema'); // MONGO DB 연결 함수

const app = express();

app.set('port', process.env.PORT || 8005);
app.set('view engine', 'html');
nunjucks.configure('views', {
  express: app,
  watch: true,
});

connect();

// Socket.IO에서 세션 미들웨어를 사용하기 위해 변수에 담기
const sessionMiddleware = session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
  },
});

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/gif', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(sessionMiddleware);

//? Session에 고유 컬러 아이디를 저장하는 미들웨어
app.use((req, res, next) => {
  if (!req.session.color) {
    const colorHash = new ColorHash();
    req.session.color = colorHash.hex(req.sessionID);
  }
  console.log('$$$$$$$$$$ req.session.color: ', req.session.color);
  next();
});

app.use('/', indexRouter);

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

const server = app.listen(app.get('port'), () => {
  console.log(app.get('port'), '번 포트에서 대기 중');
});

webSocket(server, app, sessionMiddleware);
