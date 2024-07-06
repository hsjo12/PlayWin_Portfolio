"use client";
import { createWeb3Modal, defaultConfig } from "@web3modal/ethers/react";
require("dotenv").config();

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

// 2. Set chains
const sepolia = {
  chainId: 11_155_111,
  name: "Sepolia",
  currency: "SepoliaETH",
  explorerURL: "https://sepolia.etherscan.io",
  rpcURL:
    "https://lb.drpc.org/ogrpc?network=sepolia&dkey=AkQd8imyrUJbhDf8MDxkyE2P-KywOFwR76bFhkHL9tz4",
};

// 3. Create a metadata object
const metadata = {
  name: "My Website",
  description: "My Website description",
  url: "", // origin must match your domain & subdomain
  icons: [""],
};
// 4. Create Ethers config
const ethersConfig = defaultConfig({
  /*Required*/
  metadata,

  /*Optional*/
  enableEIP6963: true, // true by default
  enableInjected: false, // true by default
  enableCoinbase: false, // true by default
  rpcUrl: "...",
  defaultChainId: 11155111, // used for the Coinbase SDK
});

// 5. Create a Web3Modal instance
createWeb3Modal({
  ethersConfig,
  chains: [sepolia],
  projectId,
  enableAnalytics: false, // Optional - defaults to your Cloud configuration
  enableOnramp: false, // Optional - false as default
  includeWalletIds: [
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
    "a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393",
    "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0",
  ],
  allWallets: "HIDE",
});

export default function Web3Modal({ children }) {
  return children;
}
