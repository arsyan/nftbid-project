// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract AuctionHouse is Ownable {
    using ERC165Checker for address;
    using Counters for Counters.Counter;

    bytes4 private InterfaceId_ERC721 = 0x80ac58cd;

    mapping(address => bool) private _approvedAccounts;

    struct Auction {
        address owner;
        address contractAddress;
        uint256 tokenId;
        uint256 startTime;
        uint256 endTime;
        bool settled;
        address currentBidder;
        uint256 currentBid;
        uint256 reservePrice;
    }

    mapping(uint256 => Auction) public auctions;
    uint256 public currentAuctionId;
    uint256 public nextAuction;
    Counters.Counter private _auctionIdCounter;

    // The minimum percentage difference between the last bid amount and the current bid
    uint8 public minBidIncrementPercentage;

    // The duration of a single auction
    uint256 public duration;

    // The minimum amount of time left in an auction after a new bid is created
    uint256 public timeBuffer;

    event AccountApproved(address account);
    event AccountRemoved(address account);
    event AuctionMinBidIncrementPercentageUpdated(
        uint256 _minBidIncrementPercentage
    );
    event AuctionTimeBufferUpdated(uint256 _timeBuffer);
    event AuctionBid(
        uint256 auctionId,
        address bidder,
        uint256 value,
        bool extended
    );
    event AuctionExtended(uint256 auctionId, uint256 endTime);
    event AuctionSettled(uint256 auctionId, address bidder, uint256 value);

    modifier onlyApprovedAccount() {
        require(_approvedAccounts[msg.sender], "You Are Not Approved");
        _;
    }

    function addApprovedAccount(address account) public onlyOwner {
        _approvedAccounts[account] = true;
        emit AccountApproved(account);
    }

    function removeApprovedAccount(address account) public onlyOwner {
        _approvedAccounts[account] = false;
        emit AccountRemoved(account);
    }

    function isApprovedAccount(address account) public view returns (bool) {
        return _approvedAccounts[account];
    }

    function setDuration(uint256 _duration) public onlyOwner {
        duration = _duration;
    }

    function setMinBidIncrementPercentage(uint8 _minBidIncrementPercentage)
        external
        onlyOwner
    {
        minBidIncrementPercentage = _minBidIncrementPercentage;

        emit AuctionMinBidIncrementPercentageUpdated(
            _minBidIncrementPercentage
        );
    }

    function setTimeBuffer(uint256 _timeBuffer) external onlyOwner {
        timeBuffer = _timeBuffer;

        emit AuctionTimeBufferUpdated(_timeBuffer);
    }

    function addNFT(
        address contractAddress,
        uint256 tokenId,
        uint256 reservePrice
    ) public onlyApprovedAccount {
        require(
            contractAddress.supportsInterface(InterfaceId_ERC721),
            "Only ERC721 Token Allowed"
        );
        IERC721 tokenContract = IERC721(contractAddress);
        require(
            tokenContract.ownerOf(tokenId) == msg.sender,
            "You are not the owner of this token"
        );
        require(
            tokenContract.getApproved(tokenId) == address(this) ||
                tokenContract.isApprovedForAll(msg.sender, address(this)),
            "Token is not approved for this contract"
        );
        tokenContract.transferFrom(msg.sender, address(this), tokenId);
        auctions[_auctionIdCounter.current()] = Auction(
            msg.sender, // owner
            contractAddress, // contract address
            tokenId, // token id
            0, // start time
            0, // end time
            false, // settled
            address(0), // current bidder
            0, // current bid
            reservePrice // reserve price
        );
        //TODO Check if no auction is live and then activate this
        if (_auctionIdCounter.current() == currentAuctionId) {
            // activate auction
            _startAuction();
        }
        _auctionIdCounter.increment();
    }

    function createBid(uint256 auctionId) public payable {
        require(auctionId == currentAuctionId, "Auction Not Up");
        Auction memory _auction = auctions[currentAuctionId];
        require(_auction.startTime != 0, "Auction hasn't begun");
        require(block.timestamp < _auction.endTime, "Auction expired");
        require(
            msg.value >= _auction.reservePrice,
            "Must send at least reservePrice"
        );
        require(
            msg.value >=
                _auction.currentBid +
                    ((_auction.currentBid * minBidIncrementPercentage) / 100),
            "Must send more than last bid by minBidIncrementPercentage amount"
        );

        payable(_auction.currentBidder).transfer(_auction.currentBid);

        auctions[currentAuctionId].currentBid = msg.value;
        auctions[currentAuctionId].currentBidder = msg.sender;

        bool extended = _auction.endTime - block.timestamp < timeBuffer;
        if (extended) {
            auctions[currentAuctionId].endTime = _auction.endTime =
                block.timestamp +
                timeBuffer;
        }

        emit AuctionBid(currentAuctionId, msg.sender, msg.value, extended);

        if (extended) {
            emit AuctionExtended(currentAuctionId, _auction.endTime);
        }
    }

    function settleAuction() public {
        Auction memory _auction = auctions[currentAuctionId];
        require(_auction.startTime != 0, "Auction hasn't begun");
        require(!_auction.settled, "Auction has already been settled");
        require(block.timestamp >= _auction.endTime, "Auction not over yet");

        auctions[currentAuctionId].settled = true;

        IERC721 tokenContract = IERC721(_auction.contractAddress);

        if (_auction.currentBidder == address(0)) {
            // Transfer to Original Owner
            tokenContract.transferFrom(
                address(this),
                _auction.owner,
                _auction.tokenId
            );
        } else {
            // Transfer to Current Bidder
            tokenContract.transferFrom(
                address(this),
                _auction.currentBidder,
                _auction.tokenId
            );

            // Transfer Amount to the Owner
            payable(_auction.owner).transfer(_auction.currentBid);
        }

        emit AuctionSettled(
            currentAuctionId,
            _auction.currentBidder,
            _auction.currentBid
        );

        currentAuctionId += 1;

        if (auctions[currentAuctionId].owner != address(0)) {
            _startAuction();
        }
    }

    function _startAuction() internal {
        auctions[currentAuctionId].startTime = block.timestamp;
        auctions[currentAuctionId].endTime = block.timestamp + duration;
    }
}
