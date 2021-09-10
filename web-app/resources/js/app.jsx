import React, { Component } from 'react';
import AuctionSection from './components/AuctionSection';
import Navbar from './components/Navbar';
import Web3 from 'web3';
import AuctionHouse from './artifacts/AuctionHouse.json';

class App extends Component {
  constructor() {
    super();
    this.state = {
      networkId: '0',
      error: '',
      account: undefined,
      loading: false,
      auctionContract: null,
      currentAuctionId: null,
      auction: null,
      nft: null,
      minBidIncrementPercentage: 0,
      lastBids: [],
      events: []
    }
    this.loadContracts = this.loadContracts.bind(this);
    this.loadCurrentAuction = this.loadCurrentAuction.bind(this);
    this.debug = true;
    this.connectWithMetamask = this.connectWithMetamask.bind(this);
    this.loadUser = this.loadUser.bind(this);
  }

  async componentDidMount() {
    if (!window.ethereum) {
      this.setState({ error: 'Metamask Not Installed/Updated' });
      return;
    }

    this.web3 = new Web3(window.ethereum);
    window.ethereum.on('networkChanged', (networkId) => {
      if (!this.state.networkId) {
        this.loadContracts(networkId);
      } else if (this.state.networkId !== networkId) {
        window.location.reload();
      }
    });
    window.ethereum.autoRefreshOnNetworkChange = false;
    const networkId = window.ethereum.networkVersion;
    await this.loadContracts(networkId);
    await this.connectWithMetamask();
  }

  async loadContracts(networkId) {
    this.setState({ networkId });
    console.log(networkId)
    const deployedNetwork = AuctionHouse.networks[networkId];
    if (deployedNetwork) {
      const auctionContract = new this.web3.eth.Contract(AuctionHouse.abi, deployedNetwork.address);
      this.setState({ auctionContract });
      if (this.state.error === 'The current network is not supported') {
        this.setState({ error: '' });
      }
      setTimeout(async () => {
        await this.loadCurrentAuction();
      }, 200);
      auctionContract.events.AuctionSettled({}).on('data', async (event) => {
        this.setState({ auction: null, nft: null });
      });
      auctionContract.events.AuctionStarted({}).on('data', async (event) => {
        await this.loadCurrentAuction();
      });
      auctionContract.events.AuctionExtended({}).on('data', async ({ returnValues: { auctionId, endTime } }) => {
        const { auction } = this.state;
        auction.endTime = endTime;
        this.setState({ auction });
      });
      auctionContract.events.AuctionBid({}).on('data', async ({ returnValues: { auctionId, bidder, value }, transactionHash }) => {
        const { auction, lastBids, events } = this.state;
        console.log(events)
        console.log(transactionHash);
        if (events.includes(transactionHash)) return;
        console.log("Hello");
        let updatedEvents = [transactionHash].concat(events);
        let newLastBids = [{ address: bidder, amount: value }].concat(lastBids);
        auction.currentBidder = bidder;
        auction.currentBid = value;
        console.log(newLastBids)
        this.setState({ auction, lastBids: newLastBids, events: updatedEvents });
      });
      const minBidIncrementPercentage = parseInt(await auctionContract.methods.minBidIncrementPercentage().call());
      this.setState({ minBidIncrementPercentage });
      auctionContract.events.AuctionMinBidIncrementPercentageUpdated({}).on('data', async ({ returnValues: { _minBidIncrementPercentage } }) => {
        this.setState({ minBidIncrementPercentage: parseInt(_minBidIncrementPercentage) });
      });
    } else {
      this.setState({ error: 'The current network is not supported' })
    }
  }

  async getTokenData(contractAddress, tokenId) {
    const { networkId } = this.state;
    let nft;
    if (networkId == '1') {
      const { data } = await axios.get(`https://api.opensea.io/api/v1/asset/${contractAddress}/${tokenId}`)
      nft = data;
    } else if (networkId == '4') {
      const { data } = await axios.get(`https://rinkeby-api.opensea.io/api/v1/asset/${contractAddress}/${tokenId}`)
      nft = data;
    } else {
      // This is just debug mode
      const { data } = await axios.get(`https://api.opensea.io/api/v1/asset/0x495f947276749ce646f68ac8c248420045cb7b5e/46039222514168214662704738423809123365189852438575200110002396778281450864641`)
      nft = data;
    }
    return nft;
  }

  async loadCurrentAuction() {
    const { auctionContract } = this.state;
    console.log(this.state)
    const currentAuctionId = await auctionContract.methods.currentAuctionId().call();
    const auction = await auctionContract.methods.auctions(currentAuctionId).call();
    auction.id = currentAuctionId;
    console.log(auction);
    const nft = await this.getTokenData(auction.contractAddress, auction.tokenId);
    console.log(nft);
    const { data: lastBids } = await axios.get(`/api/bids/${currentAuctionId}`);
    this.setState({ currentAuctionId, auction, nft, lastBids });
  }

  async loadUser(account) {
    this.setState({ account });
    // if (!this.state.usdtContract) return;
    // console.log(this.state.swapContract._address)
    // this.loadAllowance(account);
  }

  async connectWithMetamask() {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    this.loadUser(accounts[0]);
    console.log('accounts')
    console.log(accounts)
    // this.setState({account: accounts[0]});
  }

  render() {
    const { error, nft, auction, auctionContract, account, minBidIncrementPercentage, lastBids } = this.state;

    return <div>
      <Navbar connectWithMetamask={this.connectWithMetamask} account={account} />
      {error
        ? <div className="text-center mt-10 text-lg font-medium">
          <div className="text-red-500 underline">Error</div>
          {error}
        </div>
        : <>
          {auction && auction.owner !== '0x0000000000000000000000000000000000000000'
            ? <AuctionSection
              minBidIncrementPercentage={minBidIncrementPercentage}
              nft={nft}
              auction={auction}
              account={account}
              lastBids={lastBids}
              auctionContract={auctionContract}
              connectWithMetamask={this.connectWithMetamask} />
            : <div className="text-center mt-10 text-3xl font-medium">No Active Auction Available</div>}
        </>}
    </div>;
  }
}
export default App;