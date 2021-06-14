const express = require('express');
const jwt = require('jsonwebtoken');
const { Domain, User } = require('../models');
const { verifyToken } = require('./middlewares');

const router = express.Router();

//* JWT 토큰을 클라이언트에게 제공
router.post('/token', async (req, res) => {
  const { clientSecret } = req.body; // API 서버에서 발급받은 키
  try {
    const domain = await Domain.findOne({
      where: {
        clientSecret,
      },
      include: {
        modle: User,
        attributes: ['id', 'nick'],
      },
    });

    if (!domain) {
      return res.status(401).json({
        code: 401,
        message: '등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요',
      });
    }

    const token = jwt.sign(
      {
        // JWT payload
        id: domain.User.id,
        nick: domain.User.nick,
      },
      process.env.JWT_SECRET, // JWT signiture를 만들 비밀키
      {
        expiresIn: '1m', //1분
        issuer: 'min33sky',
      }
    );

    return res.json({
      code: 200,
      message: '토큰이 발급되었습니다.',
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

// JWT 토큰 테스트
router.get('/test', verifyToken, (req, res) => {
  res.json(req.decoded);
});

module.exports = router;
