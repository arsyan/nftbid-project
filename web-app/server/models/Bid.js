const Sequelize = require('sequelize');
const db = require('../database');

const Bid = db.define('bid', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  auction_id: Sequelize.STRING,
  address: Sequelize.STRING,
  amount: Sequelize.STRING,
  winner: {
    type: Sequelize.BOOLEAN,
    default: false
  },
  last_bid: {
    type: Sequelize.BOOLEAN,
    default: true
  }
}, {
  underscored: true
});

module.exports = Bid;