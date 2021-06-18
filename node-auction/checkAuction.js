const { Op } = require('sequelize');
const { Good, Auction, User, sequelize } = require('./models');

module.exports = async () => {
  console.log('checkAuction');
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1); // 어제 시간
    // 24시간 이전에 등록했는데 입찰자가 없는 상품들 가져온다.
    const targets = await Good.findAll({
      where: {
        SoldId: null,
        createdAt: {
          [Op.lte]: yesterday,
        },
      },
    });
    targets.forEach(async (target) => {
      const success = await Auction.findOne({
        where: {
          GoodId: target.id,
          order: [['bid', 'DESC']],
        },
      });
      await Good.update({ SoldId: success.UserId }, { where: { id: target.id } });
      await User.update(
        { money: sequelize.literal(`money - ${success.bid}`) },
        {
          where: {
            id: success.UserId,
          },
        }
      );
    });
  } catch (error) {
    console.error(error);
  }
};
