<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Auction;
use App\Models\Bid;

class AuctionController extends Controller
{
    public function lastBids($auctionId) {
        return Bid::where('auction_id', $auctionId)->orderBy('amount', 'DESC')->get();
    }
}
