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

afterAll(async () => {
  // DB 초기화하기
  await sequelize.sync({ force: true });
});
