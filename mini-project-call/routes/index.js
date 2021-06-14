const express = require('express');
const axios = require('axios');

const router = express.Router();
const URL = `http://localhost:8002/v2`; // API 서버 주소

axios.defaults.headers.origin = 'http://localhost:4000'; //? origin 헤더 추가

/**
 * 토큰이 없을 경우 발급받고 API를 요청하는 함수.
 * 토큰이 만료됐을 때는 재발급 후 API 요청을 한다.
 */
const request = async (req, api) => {
  try {
    //? 세션에 토큰이 없으면 토큰 발급 시도
    if (!req.session.jwt) {
      const tokenResult = await axios.post(`${URL}/token`, {
        clientSecret: process.env.CLIENT_SECRET, // API 서버에 도메인 등록시 받은 Key
      });
      req.session.jwt = tokenResult.data.token; // 세션에 토큰 저장
    }

    //? API 요청 (요청 헤더에 JWT를 포함해서 요청)
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

router.get('/', (req, res) => {
  //! 실제로 키를 프론트로 보내면 안된다. (보안 위험) 프론트에서 사용해도 되는 키를 별도로 발급받아서 사용하자
  res.render('main', {
    key: process.env.CLIENT_SECRET,
  });
});

module.exports = router;
