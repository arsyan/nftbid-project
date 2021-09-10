import React from 'react';

function shortAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 5)}...${address.slice(address.length - 5)}`;
}

function Navbar({ connectWithMetamask, account }) {
  return <header className="text-gray-600 body-font">
    <div className="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center">
      <a className="flex title-font font-medium items-center text-gray-900 mb-4 md:mb-0">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-10 h-10 text-white p-2 bg-yellow-500 rounded-full" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg>
        <span className="ml-3 text-xl">Auction House</span>
      </a>
      <nav className="md:mr-auto md:ml-4 md:py-1 md:pl-4  md:border-gray-400	flex flex-wrap items-center text-base justify-center">
        {/* add this class first --- md:border-l
        <a className="mr-5 hover:text-gray-900">First Link</a>
        <a className="mr-5 hover:text-gray-900">Second Link</a>
        <a className="mr-5 hover:text-gray-900">Third Link</a>
        <a className="mr-5 hover:text-gray-900">Fourth Link</a> */}
      </nav>
      {account
        ? <div className="text-xl text-gray-700">{shortAddress(account)}</div>
        : <button onClick={connectWithMetamask} className="inline-flex items-center bg-red-500 border-0 py-1 px-4 focus:outline-none hover:bg-red-600 rounded text-white mt-4 md:mt-0">Connect
          <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-4 h-4 ml-1" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7"></path>
          </svg>
        </button>
      }
    </div>
  </header>;
}

export default Navbar;