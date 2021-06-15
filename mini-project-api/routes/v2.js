const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const { verifyToken, apiLimiter } = require('./middlewares');
const { Domain, User, Post, Hashtag } = require('../models');

const router = express.Router();

/**
 * ? CORS 미들웨어 확장하기
 */
router.use(async (req, res, next) => {
  try {
    const domain = await Domain.findOne({
      where: {
        host: new URL(req.get('origin')).host, // Call 서버에서 요청 헤더에 설정한 origin 값 가져와서 프로토콜 떼어내기
      },
    });

    if (domain) {
      cors({
        origin: req.get('origin'), // 해당 주소의 요청만 적용
        credentials: true, // 쿠키도 함께 전송
      })(req, res, next);
    } else {
      next();
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

/**
 * 토큰을 발급하는 라우터
 */
router.post('/token', apiLimiter, async (req, res) => {
  const { clientSecret } = req.body; //? API서버에서 도메인 등록 시 발급 받은 Key

  try {
    const domain = await Domain.findOne({
      where: { clientSecret },
      include: {
        model: User,
        attribute: ['nick', 'id'],
      },
    });

    if (!domain) {
      return res.status(401).json({
        code: 401,
        message: '등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요',
      });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        id: domain.User.id,
        nick: domain.User.nick,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1m', // 1분
        issuer: 'mingtype',
      }
    );

    return res.json({
      code: 200,
      message: '토큰이 발급되었습니다',
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
});

/**
 * 내가 작성한 게시물을 보여준다
 */
router.get('/posts/my', verifyToken, apiLimiter, (req, res) => {
  Post.findAll({
    where: {
      UserId: req.decoded.id,
    },
  })
    .then((posts) => {
      console.log(posts);
      res.json({
        code: 200,
        payload: posts,
      });
    })
    .catch((error) => {
      console.error(error);
      return res.status(500).json({
        code: 500,
        message: '서버 에러',
      });
    });
});

/**
 * 해당 해시태그의 글을 가져온다.
 */
router.get('/posts/hashtag/:title', verifyToken, apiLimiter, async (req, res) => {
  try {
    const hashtag = await Hashtag.findOne({
      where: {
        title: req.params.title,
      },
    });

    if (!hashtag) {
      return res.status(404).json({
        code: 404,
        message: '검색 결과가 없습니다.',
      });
    }

    const posts = await hashtag.getPosts();
    return res.json({
      code: 200,
      payload: posts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
});

module.exports = router;
