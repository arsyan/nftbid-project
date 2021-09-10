const AuctionHouse = artifacts.require('AuctionHouse');
const TestNFTToken = artifacts.require('TestNFTToken');
const timeManager = require('./helper/timeManager');

contract('AuctionHouse', accounts => {
  let auctionHouse, testNFTToken;

  before(async () => {
    // Grab the instances of the contracts
    auctionHouse = await AuctionHouse.deployed();
    testNFTToken = await TestNFTToken.deployed();

    // set duration and min bid increment percentage
    await auctionHouse.setDuration('3600'); // i.e. 1 hour = 3600 seconds
    await auctionHouse.setMinBidIncrementPercentage('5');

    // Mint Some test NFTs
    await testNFTToken.safeMint(accounts[0]);
    await testNFTToken.safeMint(accounts[1]);
    await testNFTToken.safeMint(accounts[2]);
    await testNFTToken.safeMint(accounts[3]);
    await testNFTToken.safeMint(accounts[1]);
    await testNFTToken.safeMint(accounts[2]);
    await testNFTToken.safeMint(accounts[3]);
  })

  it('Should not approve user if not the owner who is calling the function', async () => {
    try {
      await auctionHouse.addApprovedAccount(accounts[1], { from: accounts[1] });
    } catch (e) {
      assert(e.message.includes('caller is not the owner'), 'Different Error Occured');
      return;
    }
    assert(false, 'Approved user even when function was not called by the owner');
  })

  it('Should approve user', async () => {
    await auctionHouse.addApprovedAccount(accounts[1]);
    await auctionHouse.addApprovedAccount(accounts[2]);
    assert(await auctionHouse.isApprovedAccount(accounts[1]), 'Account 1 is not approved yet');
    assert(await auctionHouse.isApprovedAccount(accounts[2]), 'Account 2 is not approved yet');
  })

  it('Should not add nft if user is not approved', async () => {
    await testNFTToken.approve(auctionHouse.address, 3, { from: accounts[3] });
    try {
      await auctionHouse.addNFT(testNFTToken.address, 3, web3.utils.toWei('0.1'), { from: accounts[3] });
    } catch (e) {
      assert(e.message.includes('You Are Not Approved'), 'Different Error Was Thrown');
      return;
    }
    assert(false, 'No Error Was Thrown');
  })

  it('Should not add nft if user is not the owner of the nft', async () => {
    try {
      await auctionHouse.addNFT(testNFTToken.address, 3, web3.utils.toWei('0.1'), { from: accounts[2] });
    } catch (e) {
      assert(e.message.includes('You are not the owner of this token'), 'Different Error Was Thrown');
      return;
    }
    assert(false, 'No Error Was Thrown');
  })

  it('Should add nft if user is approved', async () => {
    await testNFTToken.approve(auctionHouse.address, 2, { from: accounts[2] });
    await auctionHouse.addNFT(testNFTToken.address, 2, web3.utils.toWei('0.1'), { from: accounts[2] });
    const _auction = await auctionHouse.auctions(0);
    assert(_auction.endTime.toNumber() - _auction.startTime.toNumber() === 3600, 'The Duration is not 1 hour');
    assert(await testNFTToken.ownerOf(2) === auctionHouse.address, 'The NFT is not transfered');
  })

  it('Should add another nft and check it should not be activated instantly', async () => {
    await testNFTToken.approve(auctionHouse.address, 1, { from: accounts[1] });
    await auctionHouse.addNFT(testNFTToken.address, 1, web3.utils.toWei('0.2'), { from: accounts[1] });
    const _auction = await auctionHouse.auctions(1);
    assert(_auction.startTime.toNumber() === 0, 'The start time is not zero');
    assert(await testNFTToken.ownerOf(1) === auctionHouse.address, 'The NFT is not transfered');
  })

  it('Should not bid if reserve price is higher', async () => {
    try {
      await auctionHouse.createBid(0, { from: accounts[4], value: web3.utils.toWei('0.05') });
    } catch (e) {
      assert(e.message.includes('Must send at least reservePrice'), 'Different Error Was Thrown');
      return;
    }
    assert(false, 'No Error Was Thrown');
  })

  let temp1;

  it('Should bid', async () => {
    await auctionHouse.createBid(0, { from: accounts[4], value: web3.utils.toWei('0.1') });
    temp1 = await web3.eth.getBalance(accounts[4]);
  })

  it('Should not bid if the auction is not up', async () => {
    try {
      await auctionHouse.createBid(1, { from: accounts[5], value: web3.utils.toWei('0.1') })
    } catch (e) {
      assert(e.message.includes('Auction Not Up'), 'Different Error Was Thrown');
      return;
    }
    assert(false, 'No Error Was Thrown');
  })

  it('Should not create another bid if the min bid increment is not met', async () => {
    try {
      await auctionHouse.createBid(0, { from: accounts[5], value: web3.utils.toWei('0.1') })
    } catch (e) {
      assert(e.message.includes('Must send more than last bid by minBidIncrementPercentage amount'), 'Different Error Was Thrown')
      return;
    }
    assert(false, 'No Error Was Thrown');
  })

  it('Should create another bid and refund old amount', async () => {
    await auctionHouse.createBid(0, { from: accounts[5], value: web3.utils.toWei('0.105') }) // 0.1 * (1 + 0.05) as 5% increment
    assert((await web3.eth.getBalance(accounts[4]) - temp1).toString() === web3.utils.toWei('0.1'), 'Not Refunded Corrent Amount');
    const _auction = await auctionHouse.auctions(0);
    assert(_auction.currentBidder === accounts[5], 'Bidder Not Updated');
    assert(_auction.currentBid.toString() === web3.utils.toWei('0.105'), 'Bid Amount Not Updated');
  })

  it('Should not settle the auction if time not over', async () => {
    try {
      await auctionHouse.settleAuction({ from: accounts[8] });
    } catch (e) {
      assert(e.message.includes('Auction not over yet'), 'Different Error Was Thrown');
      return;
    }
    assert(false, 'No Error Was Thrown');
  })

  it('Should settle the auction if the time is over', async () => {
    await timeManager.advanceTimeAndBlock(3600);
    const b1 = await web3.eth.getBalance(accounts[2]);
    await auctionHouse.settleAuction({ from: accounts[8] });
    const b2 = await web3.eth.getBalance(accounts[2]);
    assert(web3.utils.fromWei((b2 - b1).toString()) === '0.105', 'Owner not got the sufficient amount');
    const _auction = await auctionHouse.auctions(0);
    assert(_auction.settled, 'Auction not marked settled yet');
    assert(await testNFTToken.ownerOf(2) === accounts[5], 'NFT not transfered');
    const _nextAuction = await auctionHouse.auctions(1);
    assert(_nextAuction.startTime.toNumber() != 0, 'Next auction not started');
    assert((await auctionHouse.currentAuctionId()).toNumber() === 1, 'Auction Id not updated');
  })

  it('Should add another nft and cancel the auction', async () => {
    await testNFTToken.approve(auctionHouse.address, 4, { from: accounts[1] });
    await auctionHouse.addNFT(testNFTToken.address, 4, web3.utils.toWei('0.2'), { from: accounts[1] });
    await auctionHouse.cancelAuction(2, { from: accounts[1] });
    const ownerOfToken = await testNFTToken.ownerOf(4);
    assert(ownerOfToken === accounts[1], 'Nft not transfered back once the auction is cancelled');
    const _auction = await auctionHouse.auctions(2);
    assert(_auction.cancelled, 'Auction not marked cancelled');
    await testNFTToken.approve(auctionHouse.address, 4, { from: accounts[1] });
    await auctionHouse.addNFT(testNFTToken.address, 4, web3.utils.toWei('0.2'), { from: accounts[1] });
  })

  it('Should settle the auction if the time is over and if no one bidded refund the nft', async () => {
    await timeManager.advanceTimeAndBlock(3600);
    await auctionHouse.settleAuction({ from: accounts[8] });
    const _auction = await auctionHouse.auctions(1);
    assert(_auction.settled, 'Auction not marked settled yet');
    assert(await testNFTToken.ownerOf(1) === accounts[1], 'NFT not transfered');
    const _nextAuction = await auctionHouse.auctions(2);
    assert(_nextAuction.startTime.toNumber() == 0, 'Next Auction is cancelled but still start time updated');
    assert((await auctionHouse.currentAuctionId()).toNumber() === 3, 'Auction Id not updated');
    // should start auction id 3
    const _thirdAuction = await auctionHouse.auctions(3);
    assert(_thirdAuction.startTime.toNumber() != 0, 'Next Auction is not started');
  })
})