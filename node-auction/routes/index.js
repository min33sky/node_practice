const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const schedule = require('node-schedule');

const Good = require('../models/good');
const User = require('../models/user');
const Auction = require('../models/auction');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { sequelize } = require('../models');

const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

router.get('/', async (req, res, next) => {
  try {
    // 입찰되지 않은 상품들을 불러온다.
    const goods = await Good.findAll({
      where: {
        SoldId: null,
      },
    });

    res.render('main', {
      title: 'NodeAuction',
      goods,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/join', isNotLoggedIn, (req, res) => {
  res.render('join', {
    title: '회원가입 - NodeAuction',
  });
});

router.get('/good', isLoggedIn, (req, res) => {
  res.render('good', { titld: '상품 등록 - NodeAuction' });
});

try {
  fs.readdirSync('uploads');
} catch (error) {
  console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
  fs.mkdirSync('uploads');
}

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now().valueOf() + ext);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// 상품 등록
router.post('/good', isLoggedIn, upload.single('img'), async (req, res, next) => {
  try {
    const { name, price } = req.body;
    const good = await Good.create({
      OwnerId: req.user.id,
      name,
      img: req.file.filename,
      price,
    });

    const end = new Date();

    end.setDate(end.getDate() + 1); // 하루 뒤
    schedule.scheduleJob(end, async () => {
      //? 트랜잭션 적용
      const t = await sequelize.transaction();
      try {
        const success = await Auction.findOne({
          where: {
            GoodId: good.id,
          },
          order: [['bid', 'DESC']],
          transaction: t,
        });

        await Good.update({ SoldId: success.UserId }, { where: { id: good.id }, transaction: t });
        await User.update(
          {
            money: sequelize.literal(`money - ${success.bid}`),
          },
          {
            where: {
              id: success.UserId,
            },
            transaction: t,
          }
        );
        await t.commit();
      } catch (error) {
        console.error(error);
        await t.rollback();
      }
    });

    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 입찰 하려는 상품 정보를 가져오기
router.get('/good/:id', isLoggedIn, async (req, res, next) => {
  try {
    // 상품 정보와 상품에 대한 입찰 정보를 가져온다
    const [good, auction] = await Promise.all([
      Good.findOne({
        where: {
          id: req.params.id,
        },
        include: {
          model: User,
          as: 'Owner', // 상품을 등록한 사람
        },
      }),
      Auction.findAll({
        where: {
          GoodId: req.params.id,
        },
        include: {
          model: Good,
        },
        order: [['bid', 'DESC']],
      }),
    ]);

    res.render('auction', {
      title: `${good.name} - NodeAuction`,
      good,
      auction,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 삼품 입찰하기
router.post('/good/:id/bid', isLoggedIn, async (req, res, next) => {
  try {
    const { bid, msg } = req.body;
    const good = await Good.findOne({
      where: {
        id: req.params.id,
      },
      include: {
        model: Auction,
      },
      order: [[{ model: Auction }, 'bid', 'DESC']],
    });
    if (good.price >= bid) {
      return res.status(403).send('시작 가격보다 높게 입찰해야 합니다.');
    }
    if (new Date(good.createAt).valueOf() + 24 * 60 * 60 * 1000 < new Date()) {
      return res.status(403).send('경매가 이미 종료되었습니다.');
    }
    if (good.Auctions[0] && good.Auctions[0].bid >= bid) {
      return res.status(403).send('이전 입찰가보다 높아야 합니다.');
    }
    const result = await Auction.create({
      bid,
      msg,
      UserId: req.user.id,
      GoodId: req.params.id,
    });

    // 실시간으로 입찰 내역 전송
    req.app.get('io').to(req.params.id).emit('bid', {
      bid: result.bid,
      msg: result.msg,
      nick: req.user.nick,
    });
    return res.send('ok');
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.get('/list', isLoggedIn, async (req, res, next) => {
  try {
    const goods = await Good.findAll({
      where: {
        SoldId: req.user.id,
      },
      include: {
        model: Auction,
      },
      order: [[{ model: Auction }, 'bid', 'DESC']],
    });

    res.render('list', {
      title: '낙찰 목록 - NodeAuction',
      goods,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
