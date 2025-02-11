import { ethers } from "ethers";
import Web3Modal from "web3modal";
import axios from "axios";

import musicICO from "./MusicICO.json";
import musicNFT from "./MusicNFT.json";
import theBlockchainCoders from "./TheBlockchainCoders.json";

//ENVIRONMENT VARIABLES
const MUSIC_NFT = process.env.NEXT_PUBLIC_MUSIC_NFT_ADDRESS;
const MUSIC_ICO = process.env.NEXT_PUBLIC_MUSIC_ICO_ADDRESS;
const CODERS_ADDRESS = process.env.NEXT_PUBLIC_THE_BLOCKCHAIN_CODERS_ADDRESS;
const OWNER = process.env.NEXT_PUBLIC_OWNER;
const VERIFY_AMOUNT_FEE = process.env.NEXT_PUBLIC_VERIFY_AMOUNT_FEE;
const CREDIT_AMOUNT_FEE = process.env.NEXT_PUBLIC_CREDIT_AMOUNT_FEE;
const REWARD_TOKEN_QUENTITY = process.env.NEXT_PUBLIC_REWARD_TOKEN;
const REWARD_LOCK_QUENTITY = process.env.NEXT_PUBLIC_REWARD_LOCK;
const ACTIVE_NETWORK = process.env.NEXT_PUBLIC_ACTIVE_NETWORK;

//OWNER ADDRESS
export const OWNER_ADDRESS = OWNER;
export const VERIFY_AMOUNT = VERIFY_AMOUNT_FEE;
export const CREDIT_AMOUNT = CREDIT_AMOUNT_FEE;
export const REWARD_TOKEN = REWARD_TOKEN_QUENTITY;
export const rewardLock = REWARD_LOCK_QUENTITY;

export const thebBlockchainCoders_Add = CODERS_ADDRESS;
const theBlockchainCoders_ABI = theBlockchainCoders.abi;

const musicICO_Address = MUSIC_ICO;
const musicICO_ABI = musicICO.abi;

export const musicNFT_Address = MUSIC_NFT;
const musicNFT_ABI = musicNFT.abi;

//NETWORK
const networks = {
  holesky: {
    chainId: `0x${Number(17000).toString(16)}`,
    chainName: "Holesky",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://rpc.ankr.com/eth_holesky"],
    blockExplorerUrls: ["https://holesky.etherscan.io/"],
  },
  bsc: {
    chainId: `0x${Number(56).toString(16)}`,
    chainName: "BNB Smart Chain",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    rpcUrls: ["https://rpc.ankr.com/bsc"],
    blockExplorerUrls: ["https://bscscan.com/"],
  },
  bsctestnet: {
    chainId: `0x${Number(97).toString(16)}`,
    chainName: "BNB Smart Chain Testnet",
    nativeCurrency: {
      name: "TBNB",
      symbol: "tBNB",
      decimals: 18,
    },
    rpcUrls: ["https://rpc.ankr.com/bsc_testnet_chapel"],
    blockExplorerUrls: ["https://testnet.bscscan.com/"],
  },
};

const changeNetwork = async ({ networkName }) => {
  try {
    if (!window.ethereum) throw new Error("No crypto wallet found");
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          ...networks[networkName],
        },
      ],
    });
  } catch (err) {
    console.log(err.message);
  }
};

const handleNetworkSwitch = async () => {
  const networkName = ACTIVE_NETWORK;
  await changeNetwork({ networkName });
};

export const connectWallet = async () => {
  try {
    if (!ethereum) return alert("Please install MetaMask.");
    const network = await handleNetworkSwitch();
    const accounts = await ethereum.request({
      method: "eth_requestAccounts",
    });

    return accounts[0];
  } catch (error) {
    console.log(error);

    throw new Error("No ethereum object");
  }
};

//---FETCHING SMART CONTRACT
const fetchContract = (address, abi, signer) =>
  new ethers.Contract(address, abi, signer);

//---MUSIC NFT
export const MUSIC_NFT_CONTARCT = async () => {
  try {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const contract = fetchContract(musicNFT_Address, musicNFT_ABI, signer);
    return contract;
  } catch (error) {
    console.log("Something went wrong while connecting with contract", error);
  }
};

//---MUSIC ICO
export const MUSIC_ICO_CONTARCT = async () => {
  try {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const contract = fetchContract(musicICO_Address, musicICO_ABI, signer);
    return contract;
  } catch (error) {
    console.log("Something went wrong while connecting with contract", error);
  }
};

export const fetchMusicNFT = async (_tokenId) => {
  try {
    connectWallet();
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);

    const signer = provider.getSigner();
    const contract = fetchContract(musicNFT_Address, musicNFT_ABI, signer);

    const musicData = await contract.getMusicNFTDetails(_tokenId);
    const tokenURI = await contract.tokenURI(_tokenId);

    console.log(tokenURI);

    const musicInfo = await axios.get(tokenURI, {});

    const musicNFT = {
      title: musicInfo.data.title,
      fileURL: musicInfo.data.fileURL,
      imageURL: musicInfo.data.imageURL,
      description: musicInfo.data.description,
      owner: musicData.owner,
      seller: musicData.seller,
      tokenId: _tokenId,
    };

    console.log(musicNFT);
    return musicNFT;
  } catch (error) {
    console.log(error);
  }
};
