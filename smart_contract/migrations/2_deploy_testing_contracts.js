const TestNFTToken = artifacts.require('TestNFTToken');
const WETH = artifacts.require('WETH');

module.exports = deployer => {
  if (deployer.network !== 'mainnet') {
    deployer.deploy(TestNFTToken);
  }
}