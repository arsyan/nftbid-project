// Load Dependencies
const Web3 = require('web3');
const dotenv = require('dotenv');
const db = require('./database');
const auctionContractABI = require('./abis/AuctionContract.json');
const Auction = require('./models/Auction');
const Bid = require('./models/Bid');

// Load env variables
dotenv.config();
const WEB3_URI = process.env.WEB3_URI;
const AUCTION_CONTRACT_ADDRESS = process.env.AUCTION_CONTRACT_ADDRESS;

// connect to DB
db.authenticate()
  .then(() => console.log('Connected To DB Successfully'))
  .catch(err => console.log(`Error: ${err}`));

// Initialize Web3
const web3 = new Web3(WEB3_URI);
const auctionContract = new web3.eth.Contract(auctionContractABI, AUCTION_CONTRACT_ADDRESS);

async function findAuctionById(auction_id) {
  return (await Auction.findAll({ where: { auction_id } }))[0];
}

auctionContract.events.AuctionAdded({}).on('data', async ({ returnValues }) => {
  await Auction.create({
    auction_id: returnValues.auctionId,
    contract_address: returnValues.contractAddress,
    token_id: returnValues.tokenId,
    owner: returnValues.owner,
    reserve_price: returnValues.reservePrice
  })
});

auctionContract.events.AuctionStarted({}).on('data', async ({ returnValues }) => {
  setTimeout(async () => {
    let auction = await findAuctionById(returnValues.auctionId);
    if (!auction) retun;
    auction.start_time = returnValues.startTime;
    auction.end_time = returnValues.endTime;
    auction.started = true;
    auction.save();
  }, 200);
});

auctionContract.events.AuctionSettled({}).on('data', async ({ returnValues, transactionHash }) => {
  const auction = await findAuctionById(returnValues.auctionId);
  if (!auction) return;
  auction.transfer_transaction = transactionHash;
  auction.done = true;
  auction.save();
});

auctionContract.events.AuctionExtended({}).on('data', async ({ returnValues }) => {
  const auction = await findAuctionById(returnValues.auctionId);
  if (!auction) return;
  auction.end_time = returnValues.endTime;
  auction.save();
});

auctionContract.events.AuctionBid({}).on('data', async ({ returnValues }) => {
  const auction = await findAuctionById(returnValues.auctionId);
  if (!auction) return;
  await Bid.create({
    auction_id: returnValues.auctionId,
    address: returnValues.bidder,
    amount: returnValues.value
  });
  auction.current_bidder = returnValues.bidder;
  auction.current_bid = returnValues.value;
  auction.save();
});

auctionContract.events.AuctionCancelled({}).on('data', async ({ returnValues }) => {
  const auction = await findAuctionById(returnValues.auctionId);
  if (!auction) return;
  auction.cancelled = true;
  auction.save();
});