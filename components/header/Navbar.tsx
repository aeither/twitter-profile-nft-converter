import { ConnectWallet } from "@thirdweb-dev/react";
import React from "react";

type ButtonProps = {
  callback: () => Promise<void | any>;
  icon: string;
  children?: React.ReactNode;
  isSignOut?: boolean;
  isDisabled?: boolean;
};

const Navbar = () => {
  return (
    <nav className="fixed top-0 w-screen bg-neutral-dark">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex flex-1 items-center justify-between sm:items-stretch ">
            <div className="flex flex-shrink-0 items-center">
              <div>
                <a
                  href="https://thirdweb.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src={`/logo.png`} alt="Thirdweb Logo" width={135} />
                </a>
              </div>
            </div>
            <div>
              <ConnectWallet />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
