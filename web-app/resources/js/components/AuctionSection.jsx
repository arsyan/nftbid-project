import React, { Component } from 'react';
import Web3 from 'web3';

function shortAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 5)}...${address.slice(address.length - 5)}`;
}

class AuctionSection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      auctionOver: false,
      ethValue: Web3.utils.toBN('0'),
      bids: [],
      loading: false
    }
    this.settleAuction = this.settleAuction.bind(this);
    this.bid = this.bid.bind(this);
    this.minBid = this.minBid.bind(this);
  }

  componentDidMount() {
    this.timeCounter = setInterval((() => {
      const { auction } = this.props;
      if (!auction) return;
      const hourCounter = document.getElementById('hourCounter');
      const minuteCounter = document.getElementById('minuteCounter');
      const secondCounter = document.getElementById('secondCounter');
      const endTime = new Date(parseInt(auction.endTime) * 1000)
      const now = new Date()
      if (endTime > now) {
        const timeDiff = parseInt((endTime - now) / 1000);
        hourCounter.innerText = parseInt(timeDiff / 3600);
        minuteCounter.innerText = parseInt((timeDiff / 60) % 60);
        secondCounter.innerText = parseInt(timeDiff % 60);
      } else {
        this.setState({ auctionOver: true });
        clearInterval(this.timeCounter)
      }
    }).bind(this), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.timeCounter);
  }

  shortAddress(address) {
    return `${address.slice(0, 5)}...${address.slice(address.length - 5)}`
  }

  async settleAuction() {
    const { account, auctionContract } = this.props;
    if (!account) {
      alert('Connect First!');
      return;
    }
    this.setState({ loading: true });
    try {
      await auctionContract.methods.settleAuction().send({ from: account });
    } catch (e) {
      console.log(e);
    }
    this.setState({ loading: false });
  }

  async bid() {
    const { account, auctionContract, auction } = this.props;
    const { ethValue } = this.state;
    if (!account) {
      alert('Connect First!');
      return;
    }
    this.setState({ loading: true });
    try {
      await auctionContract.methods.createBid(auction.id).send({ from: account, value: ethValue });
    } catch (e) {
      console.log(e);
    }
    this.setState({ loading: false });
  }

  minBid() {
    const { auction, minBidIncrementPercentage } = this.props;
    if (!auction) return Web3.utils.toBN('0');
    let output;
    if (auction.currentBid != '0') {
      const incrementFactor = 1 + minBidIncrementPercentage / 100;
      output = Web3.utils.toBN(auction.currentBid.toString()) * incrementFactor;
    } else {
      output = auction.reservePrice;
    }
    return Web3.utils.toBN(output);
  }

  render() {
    const { nft, auction, lastBids } = this.props;
    const { auctionOver, ethValue, loading } = this.state;

    return <section className="text-gray-600 body-font overflow-hidden">
      <div className="container px-5 py-24 mx-auto">
        <div className="lg:w-4/5 mx-auto flex flex-wrap">
          <img alt="ecommerce" className="lg:w-1/2 w-full lg:h-auto h-64 object-cover object-center rounded" src={nft ? nft.image_preview_url : "https://dummyimage.com/400x400"} />
          <div className="lg:w-1/2 w-full lg:pl-10 lg:py-6 mt-6 lg:mt-0">
            <h2 className="text-sm title-font text-gray-500 tracking-widest">{nft ? nft.asset_contract.name : 'Contract Name'}</h2>
            <h1 className="text-gray-900 text-3xl title-font font-medium mb-1">{nft ? nft.name : 'NFT Name'} <a href={nft ? nft.permalink : '#'} target="_blank" className="text-2xl"><i className="fas fa-external-link-alt"></i></a></h1>
            {nft && nft.description ? <p className="leading-relaxed mt-3">{nft.description}</p> : <></>}
            <div className="mt-4 text-black items-center pt-4 border-t-2 border-gray-100 mb-5">
              <div className="w-full mx-auto flex">
                <div className="w-1/2 p-2">
                  <div className="text-2xl">{auctionOver ? 'Winning Bid' : 'Current Bid'}</div>
                  <div className="mt-3 text-3xl">
                    <i className="fab fa-ethereum"></i>
                    {Web3.utils.fromWei(auction.currentBid).toString()}
                  </div>
                </div>
                <div className="w-1/2 border-l-2 border-gray-700 p-2">
                  <div className="text-2xl">{auctionOver ? 'Winner' : 'Ends in'}</div>
                  <div className="mt-3">
                    {auctionOver
                      ? <div className="text-3xl">{this.shortAddress(auction.currentBidder)}</div>
                      : <><span className="text-3xl" id="hourCounter">0</span><span className="text-2xl pr-1">h</span> <span className="text-3xl" id="minuteCounter">0</span><span className="text-2xl pr-1">m</span> <span className="text-3xl" id="secondCounter">0</span><span className="text-2xl">s</span></>
                    }
                  </div>
                </div>
              </div>
            </div>
            {!auctionOver
              ? <>
                <div className="text-sm text-gray-600">Minimum Bid: {Web3.utils.fromWei(this.minBid())} ETH</div>
                <div className="flex">
                  <div className="flex w-4/5 border-2 border-gray-500">
                    <input
                      type="number"
                      id="ethAmount"
                      className="text-right focus:outline-none w-full"
                      value={Web3.utils.fromWei(ethValue.toString())}
                      onChange={e => this.setState({ ethValue: Web3.utils.toBN(Web3.utils.toWei(e.target.value ? e.target.value.toString() : '0')) })} />
                    <span className="title-font  font-medium text-2xl text-gray-900">
                      <label className="text-gray-500 px-2" htmlFor="ethAmount">ETH</label>
                    </span>
                  </div>

                  <button
                    onClick={() => ethValue.gte(this.minBid()) ? this.bid() : console.log('Low Bid')}
                    className={"flex w-1/5 ml-3 text-white border-0 py-2 focus:outline-none rounded" + (ethValue.gte(this.minBid()) ? ' bg-red-500 hover:bg-red-600' : ' bg-gray-500')}>
                    <div className="mx-auto">Bid</div>
                  </button>
                </div>
              </>
              : <button
                className="w-full focus:outline-none hover:bg-red-600 bg-red-500 text-white py-2"
                onClick={this.settleAuction}>
                Settle Auction
              </button>
            }
            <div className="mt-4">
              {lastBids.slice(0, 3).map((bid, i) => <div key={i} className="mt-2 flex p-3 bg-gray-200 text-gray-700">
                <div className="">
                  {shortAddress(bid.address)}
                </div>
                <div className="ml-auto">
                  <i className="fab fa-ethereum mr-1"></i>
                  {Web3.utils.fromWei(bid.amount)}
                </div>
              </div>)}
              {lastBids.length > 3 ? 'And More...' : <></>}
            </div>
          </div>
        </div>
      </div>
      {loading && <div className="overflow">
        <div className="spin"></div>
      </div>}
    </section >;
  }
}

export default AuctionSection;