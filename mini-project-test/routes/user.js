const express = require('express');
const { addFollowing } = require('../controllers/user');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

router.post('/:id/follow', isLoggedIn, addFollowing);

module.exports = router;
