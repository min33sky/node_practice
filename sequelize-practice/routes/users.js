const express = require('express');
const { User, Comment } = require('../models');
const router = express.Router();

router
  .route('/')
  .get(async (req, res, next) => {
    try {
      const users = await User.findAll();
      res.json(users);
    } catch (error) {
      console.error(error);
      next(error);
    }
  })
  .post(async (req, res, next) => {
    try {
      const users = await User.create({
        name: req.body.name,
        age: req.body.age,
        married: req.body.married,
      });
      console.log('users: ', users);
      res.status(201).json(users);
    } catch (error) {
      console.error(error);
      next(error);
    }
  });

router.get('/:id/comments', async (req, res, next) => {
  try {
    const comments = await Comment.findAll({
      include: {
        model: User,
        where: {
          id: req.params.id,
        },
      },
    });

    console.log('comments : ', comments);
    res.status(201).json(comments);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
