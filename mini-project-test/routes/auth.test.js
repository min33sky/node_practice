const request = require('supertest');
const { sequelize } = require('../models');
const app = require('../app');

beforeAll(async () => {
  await sequelize.sync();
});

describe('POST /join', () => {
  test('로그인 안 했으면 가입', (done) => {
    request(app)
      .post('/auth/join')
      .send({
        email: 'messi@naver.com',
        nick: 'messi',
        password: 'qwe123',
      })
      .expect('location', '/')
      .expect(302, done);
  });
});

describe('POST /login', () => {
  //? agent: 테스트 대상의 상태를 유지시켜준다 (예: 로그인 상태)
  const agent = request.agent(app);
  //? beforeEach: 각각의 테스트 실행 전 호출
  beforeEach((done) => {
    agent
      .post('/auth/login')
      .send({
        email: 'messi@naver.com',
        password: 'qwe123',
      })
      .end(done);
  });

  test('이미 로그인했으면 회원가입 할 때 redirect /', (done) => {
    const message = encodeURIComponent('로그인 한 상태입니다.');
    agent
      .post('/auth/join')
      .send({
        email: 'messi@naver.com',
        nick: 'messi',
        password: 'qwe123',
      })
      .expect('Location', `/?error=${message}`)
      .expect(302, done);
  });
});

describe('POST /login', () => {
  test('가입되지 않은 회원이 로그인할 때', (done) => {
    const message = encodeURIComponent('가입되지 않은 회원입니다.');
    request(app)
      .post('/auth/login')
      .send({
        email: 'general-zho@naver.com',
        password: '123123123',
      })
      .expect('Location', `/?loginError=${message}`)
      .expect(302, done);
  });

  test('정상 로그인', (done) => {
    request(app)
      .post('/auth/login')
      .send({
        email: 'messi@naver.com',
        password: 'qwe123',
      })
      .expect('Location', '/')
      .expect(302, done);
  });

  test('비밀번호 틀림', (done) => {
    const message = encodeURIComponent('비밀번호가 일치하지 않습니다.');
    request(app)
      .post('/auth/login')
      .send({
        email: 'messi@naver.com',
        password: '123123123',
      })
      .expect('Location', `/?loginError=${message}`)
      .expect(302, done);
  });
});

describe('GET /logout', () => {
  test('로그인 되어있지 않으면 403', (done) => {
    request(app).get('/auth/logout').expect(403, done);
  });

  const agent = request.agent(app);
  beforeEach((done) => {
    agent
      .post('/auth/login')
      .send({
        email: 'messi@naver.com',
        password: 'qwe123',
      })
      .end(done);
  });

  test('로그아웃 수행', (done) => {
    agent.get('/auth/logout').expect('Location', '/').expect(302, done);
  });
});

afterAll(async () => {
  // DB 초기화하기
  await sequelize.sync({ force: true });
});
