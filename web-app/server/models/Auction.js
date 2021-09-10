const Sequelize = require('sequelize');
const db = require('../database');

const Auction = db.define('auction', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  auction_id: {
    type: Sequelize.STRING,
    unique: true
  },
  start_time: {
    type: Sequelize.INTEGER,
    default: 0
  },
  end_time: {
    type: Sequelize.INTEGER,
    default: 0
  },
  contract_address: Sequelize.STRING,
  token_id: Sequelize.STRING,
  owner: Sequelize.STRING,
  reserve_price: Sequelize.STRING,
  current_bidder: { type: Sequelize.STRING, allowNull: true },
  current_bid: { type: Sequelize.STRING, allowNull: true },
  cancelled: {
    type: Sequelize.BOOLEAN,
    default: false
  },
  done: {
    type: Sequelize.BOOLEAN,
    default: false
  },
  started: {
    type: Sequelize.BOOLEAN,
    default: false
  },
  transfer_transaction: {
    type: Sequelize.STRING,
    allowNull: true
  }
}, {
  underscored: true
});

module.exports = Auction;