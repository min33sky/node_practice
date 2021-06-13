const express = require('express');
const axios = require('axios');

const router = express.Router();

//* 토큰 테스트 라우터
router.get('/test', async (req, res, next) => {
  try {
    //? 세션에 토큰이 없으면 토큰 발급 시도
    if (!req.session.jwt) {
      const tokenResult = await axios.post('http://localhost:8002/v1/token', {
        clientSecret: process.env.CLIENT_SECRET,
      });
      // ? 토큰 발급 성공 & 세션에 토큰 저장
      if (tokenResult.data && tokenResult.data.code === 200) {
        res.session.jwt = tokenResult.data.token;
      } else {
        // 토큰 발급 실패
        return res.json(tokenResult.data);
      }
    }
    // 발급받은 토큰 테스트
    const result = await axios.get('http://localhost:8002/v1/test', {
      headers: {
        authorization: req.session.jwt,
      },
    });
    return res.json(result.data);
  } catch (error) {
    console.error(error);
    if (error.response.status === 419) {
      // 토큰 만료 시
      return res.json(error.response.data);
    }
    return next(error);
  }
});

module.exports = router;
