const passport = require('passport');
const local = require('./localStrategy');
const kakao = require('./kakaoStrategy');

const User = require('../models/user');

module.exports = () => {
  //? id값만 저장해서 자원을 아낀다.
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  //? 로그인할 때 req.user에 id값을 이용하여 데이터를 채워놓는다.
  passport.deserializeUser((id, done) => {
    User.findOne({
      where: {
        id,
      },
      include: [
        {
          model: User,
          attributes: ['id', 'nick'],
          as: 'Followers',
        },
        {
          model: User,
          attributes: ['id', 'nick'],
          as: 'Followings',
        },
      ],
    })
      .then((user) => done(null, user))
      .catch((err) => done(errs));
  });

  local();
  kakao();
};
