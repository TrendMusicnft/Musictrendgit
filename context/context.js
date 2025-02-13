import React, { useState, useEffect } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import axios from "axios";
import toast from "react-hot-toast";

//INTERNAL  IMPORT
import {
  MUSIC_NFT_CONTARCT,
  MUSIC_ICO_CONTARCT,
  connectWallet,
  fetchMusicNFT,
  musicNFT_Address,
  OWNER_ADDRESS,
  VERIFY_AMOUNT,
  CREDIT_AMOUNT,
  REWARD_TOKEN,
  rewardLock,
} from "./constants";

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRECT_KEY = process.env.NEXT_PUBLIC_PINATA_SECRECT_KEY;
const PINATA_POST_URL = process.env.NEXT_PUBLIC_PINATA_POST_URL;
const PINATA_HASH_URL = process.env.NEXT_PUBLIC_PINATA_HASH_URL;

export const MusicNFTContext = React.createContext();

export const MusicNFTProvider = ({ children }) => {
  const MUSIC_DAPP = "Music Dapp";
  const currency = "BNB";
  const network = "Smart Chain";

  const [loader, setLoader] = useState(false);

  const notifySuccess = (msg) => toast.success(msg, { duration: 2000 });
  const notifyError = (msg) => toast.error(msg, { duration: 2000 });

  //---CREATENFT FUNCTION
  const createMusicNFT = async (title, fileURL, imageURL, description) => {
    if (!title || !fileURL || !imageURL || !description)
      return console.log("Data Is Missing");

    const data = JSON.stringify({ title, fileURL, imageURL, description });
    //
    try {
      const response = await axios({
        method: "POST",
        url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        data: data,
        headers: {
          pinata_api_key: `${PINATA_API_KEY}`,
          pinata_secret_api_key: `${PINATA_SECRECT_KEY}`,
          "Content-Type": "application/json",
        },
      });

      const url = `${PINATA_HASH_URL}${response.data.IpfsHash}`;
      console.log(url);

      const returnData = await createSale(url);
      return returnData;
    } catch (error) {
      console.log(error);
    }
  };

  //--- createSale FUNCTION
  const createSale = async (url) => {
    try {
      const address = await connectWallet();
      const contract = await MUSIC_NFT_CONTARCT();

      const currentTokenId = await contract._tokenIds();

      const transaction = await contract.createToken(url);

      await transaction.wait();

      const details = {
        transaction,
        currentTokenId: currentTokenId.toNumber() + 1,
      };
      return details;
    } catch (error) {
      console.log(error);
    }
  };

  // Utility functions for common operations
  const parseAmount = (amount) =>
    ethers.utils.parseUnits(amount.toString(), "ether");
  const formatAmount = (amount) => ethers.utils.formatEther(amount.toString());

  // Contract interaction functions
  const musicICO = async () => {
    try {
      const address = await connectWallet();
      const contract = await MUSIC_ICO_CONTARCT();
      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);

      const signer = provider.getSigner();

      const [tokenDetails, maticBal] = await Promise.all([
        contract.getTokenDetails(),
        signer.getBalance(),
      ]);

      return {
        toeknBal: formatAmount(tokenDetails.balance),
        name: tokenDetails.name,
        symbol: tokenDetails.symbol,
        supply: formatAmount(tokenDetails.supply),
        tokenPrice: formatAmount(tokenDetails.tokenPrice),
        tokenAddr: tokenDetails.tokenAddr,
        maticBal: formatAmount(maticBal),
        address: address.toLowerCase(),
      };
    } catch (error) {
      console.error("Error in musicICO:", error);
      throw error;
    }
  };

  const buyToken = async (amount) => {
    try {
      setLoader(true);
      const contract = await MUSIC_ICO_CONTARCT();
      const tokenDetails = await contract.getTokenDetails();
      const availableToken = formatAmount(tokenDetails.balance);

      if (availableToken <= 1) {
        throw new Error("Insufficient tokens available");
      }

      const price = formatAmount(tokenDetails.tokenPrice) * Number(amount);
      const payAmount = parseAmount(price);

      // Gas estimation with safety margin
      const estimatedGas = await contract.estimateGas.buyToken(amount, {
        value: payAmount,
      });
      const safeGasLimit = estimatedGas.mul(120).div(100); // 20% buffer

      const transaction = await contract.buyToken(Number(amount), {
        value: payAmount,
        gasLimit: safeGasLimit,
      });

      await transaction.wait();
      notifySuccess("Transaction successful");
      return transaction;
    } catch (error) {
      console.error("Error in buyToken:", error);
      notifyError(error.message || "Error trying to buy tokens");
      throw error;
    } finally {
      setLoader(false);
    }
  };

  const transferEther = async (amount, receiver) => {
    try {
      setLoader(true);
      const contract = await MUSIC_ICO_CONTARCT();
      const payAmount = parseAmount(amount);

      // Estimate gas dynamically instead of using fixed limit
      const estimatedGas = await contract.estimateGas.transferEther(
        receiver,
        payAmount,
        {
          value: payAmount,
        }
      );
      const safeGasLimit = estimatedGas.mul(120).div(100);

      const transaction = await contract.transferEther(receiver, payAmount, {
        value: payAmount,
        gasLimit: safeGasLimit,
      });

      await transaction.wait();
      notifySuccess("Transfer successful");
      return transaction;
    } catch (error) {
      console.error("Error in transferEther:", error);
      notifyError(error.message || "Error in transfer");
      throw error;
    } finally {
      setLoader(false);
    }
  };

  const transferToOwnerAcc = async (verifyAmount) => {
    try {
      setLoader(true);
      const contract = await MUSIC_ICO_CONTARCT();
      const payAmount = parseAmount(verifyAmount);

      // Estimate gas dynamically
      const estimatedGas = await contract.estimateGas.transferToOwner(
        payAmount,
        {
          value: payAmount,
        }
      );
      const safeGasLimit = estimatedGas.mul(120).div(100);

      const transaction = await contract.transferToOwner(payAmount, {
        value: payAmount,
        gasLimit: safeGasLimit,
      });

      await transaction.wait();
      return transaction;
    } catch (error) {
      console.error("Error in transferToOwnerAcc:", error);
      notifyError(error.message || "Transfer to owner failed");
      throw error;
    } finally {
      setLoader(false);
    }
  };

  const rewardToken = async (amount) => {
    try {
      setLoader(true);
      const contract = await MUSIC_ICO_CONTARCT();
      const tokenDetails = await contract.getTokenDetails();
      const availableToken = formatAmount(tokenDetails.balance);

      if (availableToken <= 1) {
        throw new Error("Insufficient tokens available for reward");
      }

      // Estimate gas dynamically
      const estimatedGas = await contract.estimateGas.tokenReward(
        Number(amount)
      );
      const safeGasLimit = estimatedGas.mul(120).div(100);

      const transaction = await contract.tokenReward(Number(amount), {
        gasLimit: safeGasLimit,
      });

      await transaction.wait();
      notifySuccess("Reward successful");
      return transaction;
    } catch (error) {
      console.error("Error in rewardToken:", error);
      notifyError(error.message || "Error in reward token");
      throw error;
    } finally {
      setLoader(false);
    }
  };

  return (
    <MusicNFTContext.Provider
      value={{
        createMusicNFT,
        fetchMusicNFT,
        musicICO,
        buyToken,
        transferEther,
        transferToOwnerAcc,
        rewardToken,
        rewardLock,
        REWARD_TOKEN,
        musicNFT_Address,
        currency,
        network,
        OWNER_ADDRESS,
        VERIFY_AMOUNT,
        CREDIT_AMOUNT,
        loader,
        setLoader,
      }}
    >
      {children}
    </MusicNFTContext.Provider>
  );
};
