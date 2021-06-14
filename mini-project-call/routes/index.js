const express = require('express');
const axios = require('axios');

const router = express.Router();
const URL = `http://localhost:8002/v1`; // API 서버 주소

axios.defaults.headers.origin = 'http://localhost:4000'; // origin 헤더 추가

const request = async (req, api) => {
  try {
    if (!req.session.jwt) {
      //? 세션에 토큰이 없으면 토큰 발급 시도
      const tokenResult = await axios.post(`${URL}/token`, {
        clientSecret: process.env.CLIENT_SECRET,
      });
      req.session.jwt = tokenResult.data.token; // 세션에 토큰 저장
    }

    //? API 요청
    return await axios.get(`${URL}${api}`, {
      headers: { authorization: req.session.jwt },
    });
  } catch (error) {
    console.error(error);
    if (error.response.status === 419) {
      // 토큰 만료 시 토큰 재발급 받기
      delete req.session.jwt;
      return request(req, api);
    }
    // 419 이외의 에러일 경우
    return error.response;
  }
};

/**
 * 내가 작성한 게시물을 가져오기
 */
router.get('/mypost', async (req, res, next) => {
  try {
    const result = await request(req, '/posts/my');
    res.json(result.data);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

/**
 * 해시태그로 게시물 가져오기
 */
router.get('/search/:hashtag', async (req, res, next) => {
  try {
    const result = await request(req, `/posts/hashtag/${encodeURIComponent(req.params.hashtag)}`);
    res.json(result.data);
  } catch (error) {
    if (error.code) {
      console.error(error);
      next(error);
    }
  }
});

module.exports = router;
