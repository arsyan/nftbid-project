const AuctionHouse = artifacts.require('AuctionHouse');

module.exports = deployer => {
  deployer.deploy(AuctionHouse);
}