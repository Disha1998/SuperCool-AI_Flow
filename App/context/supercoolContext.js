import React, { useState, createContext, useEffect } from "react";
import { SUPER_COOL_NFT_CONTRACT, abi } from "../constant/constant";
import { Buffer } from "buffer";
import { create } from "ipfs-http-client";
import { ethers } from "ethers";
import axios from "axios";
import * as fcl from "@onflow/fcl";
import { getNFTs, getNFTsScript } from "../../flow/cadence/scripts/get_nfts";
import * as types from "@onflow/types";
import * as t from "@onflow/types";
import { getSaleNFTsScript } from "../../flow/cadence/scripts/get_sale_nfts";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { getTotalTokenSupply } from "../../flow/cadence/scripts/get_totalSupply";
import { checkIsInitialized } from "../../flow/cadence/scripts/checkIsInitialized_collection";
export const SupercoolAuthContext = createContext(undefined);

export const SupercoolAuthContextProvider = (props) => {
  // let defPrompt = "I want you to act as a prompt engineer. You will help me write prompts for an ai art generator called Midjourney. I will provide you with short content ideas and your job is to elaborate these into full, explicit, coherent prompts. Prompts involve describing the content and style of images in concise accurate language. It is useful to be explicit and use references to popular culture, artists and mediums. Your focus needs to be on nouns and adjectives. I will give you some example prompts for your reference. Please define the exact camera that should be used Here is a formula for you to use(content insert nouns here)(medium: insert artistic medium here)(style: insert references to genres, artists and popular culture here)(lighting, reference the lighting here)(colours reference color styles and palettes here)(composition: reference cameras, specific lenses, shot types and positional elements here) when giving a prompt remove the brackets, speak in natural language and be more specific, use precise, articulate language. Example prompt: Portrait of a Celtic Jedi Sentinel with wet Shamrock Armor, green lightsaber, by Aleksi Briclot, shiny wet dramatic lighting. For now if understand what I asked to you just replay 'write anything'. And write full prompt from next request. "

  const [loading, setLoading] = useState(false);
  const [allNfts, setAllNfts] = useState([]);
  const [currentUserCreatedNFT, setCurrentUserCreatedNFT] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [user, setUser] = useState();
  const [nftsForSell, setNFTsForSell] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    fcl.currentUser().subscribe(setUser);
    getUserNFTs();
      getUserSaleNFTs();

  }, []);
  // console.log(user.addr,'user addr');


    const checkInit = async () => {
    let account = user?.addr
    console.log('address',account);
    const isInit = await fcl.send([
      fcl.script(checkIsInitialized),
      fcl.args([
        fcl.arg(account, t.Address)
      ])
    ]).then(fcl.decode);
    console.log('result==>', isInit);
    setIsInitialized(isInit);
  }

  const auth =
    "Basic " +
    Buffer.from(
      // process.env.infuraProjectKey + ":" + process.env.infuraSecretKey
      "2DQRq820rLbznhFlkIbTkuYAyCS" + ":" + "33d97cf6366f9565421e36ff7e018e60"
    ).toString("base64");

  const client = create({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
    headers: {
      authorization: auth,
    },
  });


  const getTotalSupply = async () => {
    const result = await fcl.send([
      fcl.script(getTotalTokenSupply),
      fcl.args([])
    ]).then(fcl.decode);
    console.log('total supply',result);
    return result;
  }
const firebaseConfig = {
  apiKey: "AIzaSyCGVjsvfInkjCDotvdP6kY_TWdpyvz7uCo",
  authDomain: "superflow-f2e91.firebaseapp.com",
  projectId: "superflow-f2e91",
  storageBucket: "superflow-f2e91.appspot.com",
  messagingSenderId: "367934501039",
  appId: "1:367934501039:web:22c3a59e90c6ba3260e45a",
  measurementId: "G-F945HDRM1P"
};
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  const firestore = getFirestore();
  const NFTcollectionRef = collection(firestore, "CreatedNFTsTokenUri");
  const SellNFTcollectionRef = collection(firestore, "SellNFTData");

  async function storeNftOnFirebase(metadataUrl) {
    
    let tokenid = await getTotalSupply();
    console.log(tokenid);
    const newData = {
      id: tokenid,
      url: metadataUrl
    };
    const docRef = await addDoc(NFTcollectionRef, newData);
    console.log("Data stored successfully! Document ID:", docRef.id);
  }

  async function storeSellNftOnFirebase(_id,_item){
    const newData = {
      id : _id,
      data : _item 
    }
    const docRef = await addDoc(SellNFTcollectionRef, newData);
    console.log("Sell NFT Stored", docRef.id);
  }

  async function getUserNFTs() {
    try {
      const querySnapshot = await getDocs(NFTcollectionRef);
      const data = querySnapshot.docs.map((doc) => doc.data());
      const currentUserNft = [];
      const allNft = [];

      for (let i = 0; i < data.length; i++) {
        let tokenid = data[i].id;
        let tokenURI = data[i].url;
        const response = await fetch(tokenURI);
        const metadata = await response.json();
        console.log(metadata);
        if (metadata.owner == user?.addr) {
          const newMetadata = {...metadata, id:tokenid}
          currentUserNft.push(newMetadata); 
        }

        const allNftData = {...metadata, id:tokenid}
        allNft.push(allNftData);

      }console.log('all nftss--',currentUserNft);
      setCurrentUserCreatedNFT(currentUserNft);
      setAllNfts(allNft);
    } catch (error) {
      console.error("Error fetching data: ", error);
      return [];
    }
  }

  async function getUserSaleNFTs() {
    try {
      const querySnapshot = await getDocs(SellNFTcollectionRef);
      const data = querySnapshot.docs.map((doc) => doc.data());
      console.log('sell nft data',data);
      const metadatas = [];

      for (let i = 0; i < data.length; i++) {
        let dataa = data[i].data;
        metadatas.push(dataa);
      }
      setNFTsForSell(metadatas);
    } catch (error) {
      console.error("Error fetching data: ", error);
      return [];
    }
  }

  useEffect(() => {
    if (user?.addr) {
      checkInit();
    }
  }, [user?.addr])

  // const getUserNFTs = async () => {
  //   let account = user?.addr
  //   const result = await fcl.send([
  //     fcl.script(getNFTsScript),
  //     fcl.args([
  //       fcl.arg(account, t.Address)
  //     ])
  //   ]).then(fcl.decode);

  //   let metadataa = []
  //   for (let i = 0; i < result.length; i++) {
  //     const tokenURI = result[i].ipfsHash;
  //     const tokenid = result[i].id;
  //     const response = await fetch(tokenURI);
  //     const metadata = await response.json();
  //     const newMetadata = {...metadata, id : tokenid}
  //     metadataa.push(newMetadata)
  //   }
  //   setAllNfts(metadataa);
  // }


  // const getUserSaleNFTs = async () => {
  //   let account = user?.addr
  //   const result = await fcl.send([
  //     fcl.script(getSaleNFTsScript),
  //     fcl.args([
  //       fcl.arg(account, t.Address)
  //     ])
  //   ]).then(fcl.decode);

  //   console.log(result);


  //   let metadataa = [];
  //   const values = Object.values(result);
  //   for (let i = 0; i < values.length; i++) {
  //     const sellnfts = values[i];
  //     const tokenURI = sellnfts.nftRef.ipfsHash;
  //     const tokenid = sellnfts.nftRef.id;
  //     const response = await fetch(tokenURI);
  //     const metadata = await response.json();
  //     const newMetadata = { ...metadata, id: tokenid };
  //     metadataa.push(newMetadata);
  //   }
  //   setNFTsForSell(metadataa);
  // }
  const uploadOnIpfs = async (e) => {
    let dataStringify = JSON.stringify(e);
    const ipfsResult = await client.add(dataStringify);
    const contentUri = `https://superfun.infura-ipfs.io/ipfs/${ipfsResult.path}`;
    console.log(contentUri);
    return contentUri;
  };

  const handleImgUpload = async (file) => {
    const added = await client.add(file);
    const hash = added.path;
    const ipfsURL = `https://superfun.infura-ipfs.io/ipfs/${hash}`;
    return ipfsURL;
  };

  // Edit profile

  const uploadDatainIpfs = async (e) => {
    let dataStringify = JSON.stringify(e);
    const ipfsResult = await client.add(dataStringify);
    const contentUri = `https://superfun.infura-ipfs.io/ipfs/${ipfsResult.path}`;
    console.log("contentUri", contentUri);
    return contentUri;
  };

  const generateText = async (detailPrompt) => {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/engines/text-davinci-003/completions",
        {
          prompt: detailPrompt,
          max_tokens: 700,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(response.data.choices[0].text);
      setPrompt(response.data.choices[0].text);
      // return response.data.choices[0].text;
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <SupercoolAuthContext.Provider
      value={{
        nftsForSell,
        uploadOnIpfs,
        allNfts,
        handleImgUpload,
        client,
        loading,
        setLoading,
        prompt,
        setPrompt,
        user,
        uploadDatainIpfs,
        // getAllNfts,
        getUserNFTs,
        generateText,
        getTotalSupply,
        storeNftOnFirebase,
        storeSellNftOnFirebase,
        isInitialized,
        checkInit,
        currentUserCreatedNFT
      }}
      {...props}
    >
      {props.children}
    </SupercoolAuthContext.Provider>
  );
};
