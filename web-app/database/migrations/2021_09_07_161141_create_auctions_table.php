<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAuctionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('auctions', function (Blueprint $table) {
            $table->id();
            $table->string('auction_id')->unique();
            $table->string('owner');
            $table->string('contract_address');
            $table->string('token_id');
            $table->bigInteger('start_time')->default(0);
            $table->bigInteger('end_time')->default(0);
            $table->string('reserve_price');
            $table->string('current_bidder')->nullable();
            $table->string('current_bid')->nullable();
            $table->string('transfer_transaction')->nullable();
            $table->boolean('started')->default(false);
            $table->boolean('done')->default(false);
            $table->boolean('cancelled')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('auctions');
    }
}
