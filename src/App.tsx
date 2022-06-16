import { Connection, PublicKey, clusterApiUrl, ConfirmOptions, Commitment } from "@solana/web3.js";
import { Program, AnchorProvider, web3 } from "@project-serum/anchor";
import twitterLogo from "./assets/twitter-logo.svg";
import React, { useEffect, useState } from "react";
import kp from "./keypair.json";
import { Buffer } from "buffer";
import idl from "./idl.json";
import "./App.css";

window.Buffer = Buffer;
const { SystemProgram, Keypair } = web3;
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);
const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl("devnet");
const opts: { preflightCommitment: Commitment } = {
  preflightCommitment: "processed",
};

// const TEST_GIFS = [
//   "https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif",
//   "https://media.giphy.com/media/v6aOjy0Qo1fIA/giphy.gif",
//   "https://media.giphy.com/media/xTiQygY6HW1GjoYKFq/giphy.gif",
//   "https://media.giphy.com/media/l4KibK3JwaVo0CjDO/giphy.gif",
// ];
const TWITTER_HANDLE = "TSMdaniel";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  const [walletAddress, setWalletAddress] = useState<boolean | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [gifList, setGifList] = useState<{ gifLink: string }[] | null>([]);
  const checkForWallet = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log("true");

          const response = await solana.connect({ onlyIfTrusted: true });
          console.log("connected with public key:", response.publicKey.toString());
          setWalletAddress(response.publicKey.toString());
        } else {
          alert("where is your wallet?");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      const response = await solana.connect();
      console.log("connected with public key:", response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };
  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("no gif link given!");
      return;
    }
    console.log("gif link:", inputValue);
    // setGifList([...gifList, inputValue]);
    setInputValue("");
    try {
      const provider = getProvider();
      //@ts-ignore
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("gif successfully sent to program", inputValue);

      await getGifList();
    } catch (error) {
      console.log("error sending gif:", error);
    }
  };
  const onInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = ev.target;
    setInputValue(value);
  };
  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(connection, window.solana, { preflightCommitment: opts.preflightCommitment });
    return provider;
  };
  const notConnected = () => (
    <button className="cta-button connect-wallet-button" onClick={connectWallet}>
      connect wallet
    </button>
  );
  const connected = () => {
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            do one-time initialization for gif program account
          </button>
        </div>
      );
    } else {
      return (
        <div className="connected-container">
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              sendGif();
            }}
          >
            <input type="text" placeholder="send gif link..." value={inputValue} onChange={onInputChange} />
            <button type="submit" className="cta-button submit-gif-button">
              send
            </button>
          </form>
          <div className="gif-grid">
            {gifList.map((item, index) => (
              <div className="gif=item" key={index}>
                <img src={item.gifLink}></img>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };
  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      //@ts-ignore
      const program = new Program(idl, programID, provider);
      console.log("ping");
      await program.rpc.initialize({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      });
      console.log("created a new base account with address:", baseAccount.publicKey.toString());
      await getGifList();
    } catch (error) {
      console.log("error creating BaseAccount account:", error);
    }
  };
  const getGifList = async () => {
    try {
      const provider = getProvider();
      //@ts-ignore
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("account aquired:", account);
      setGifList(account.gifList);
    } catch (error) {
      console.log("error in getGifList:", error);
      setGifList(null);
    }
  };
  useEffect(() => {
    const onLoad = async () => {
      await checkForWallet();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  useEffect(() => {
    if (walletAddress) {
      console.log("fetching gifs...");
      getGifList();
    }

    // setGifList(TEST_GIFS);
  }, [walletAddress]);
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">o(`•ω•)づ cat gif portal ヾ(•ω•`)o</p>
          <p className="sub-text">view your GIF collection in the metaverse :3 ✨</p>
          {walletAddress ? connected() : notConnected()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a className="footer-text" href={TWITTER_LINK} target="_blank" rel="noreferrer">
            {` ~ built by @${TWITTER_HANDLE}`} ~
          </a>
        </div>
      </div>
    </div>
  );
};

export default App;
