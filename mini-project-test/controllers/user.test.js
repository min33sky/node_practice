jest.mock('../models/user'); //! 반드시 모킹 대상 모듈위에 위치
const User = require('../models/user');
const { addFollowing } = require('./user');

describe('addFollowing', () => {
  const req = {
    user: {
      id: 1,
    },
    params: {
      id: 2,
    },
  };
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  };
  const next = jest.fn();

  test('사용자를 찾아 팔로잉을 추가하고 success를 응답해야 함', async () => {
    //? mockReturnValue로 리턴값을 모킹 가능
    User.findOne.mockReturnValue(
      Promise.resolve({
        addFollowing(id) {
          return Promise.resolve(true);
        },
      })
    );
    await addFollowing(req, res, next);
    expect(res.send).toBeCalledWith('success');
  });

  test('사용자를 못 찾으면 res.status(404).send(no user)를 호출함', async () => {
    User.findOne.mockReturnValue(null);
    await addFollowing(req, res, next);
    expect(res.status).toBeCalledWith(404);
    expect(res.send).toBeCalledWith('no user');
  });

  test('에러 발생했을 때 next(error)를 호출함', async () => {
    const error = '사용자 찾는 중 DB 에러';
    User.findOne.mockReturnValue(Promise.reject(error));
    await addFollowing(req, res, next);
    expect(next).toBeCalledWith(error);
  });
});
