import './App.css';
import idl from "./idl.json"
import {useEffect, useState} from "react";
import {clusterApiUrl, Connection, PublicKey, SystemProgram} from "@solana/web3.js";
import {AnchorProvider, Program, utils} from "@project-serum/anchor";

import {Buffer} from "buffer";
window.Buffer = Buffer;

const programId = new PublicKey(idl.metadata.address);
const network = clusterApiUrl("devnet");
const opts = {
    preflightCommitment: "processed"
}

const App = () => {
    const [walletAddress, setWalletAddress] = useState(null);
    const solflare = window.solflare;
    const isSolflareInstalled = solflare && solflare.isSolflare;

    const getProvider = () => {
        const connection = new Connection(network, opts.preflightCommitment);
        let provider = null;
        if(isSolflareInstalled) {
            provider = new AnchorProvider(
                connection,
                solflare,
                opts.preflightCommitment
            );
        }
        return provider;
    }

    const checkIfWalletIsConnect = () => {
        try {

            if (isSolflareInstalled) {
                console.log("Solflare Wallet installed");
                solflare.connect({onlyIfTrusted: true});
                solflare.on('connect', () => {
                    console.log('Solflare Wallet Connected with publicKey: ', solflare.publicKey.toString());
                    setWalletAddress(solflare.publicKey.toString());
                });
            } else {
                console.log("Install a Solana Wallet");

            }


        } catch (err) {
            console.error(err);
        }
    };

    const connectWallet = () => {
        if (isSolflareInstalled) {
            solflare.connect();
            solflare.on('connect', () => {
                console.log('Solflare Wallet Connected with publicKey: ', solflare.publicKey.toString());
                setWalletAddress(solflare.publicKey.toString());
            });
        }
    }

    const createCampaign = async() =>{
        try {
            const provider = getProvider();
            const program = new Program(idl, programId, provider);
            const [campaign] = await PublicKey.findProgramAddress(
                [utils.bytes.utf8.encode("CampaignDEMO"),
                    provider.wallet.publicKey.toBuffer()],
                program.programId
            );

            await program.rpc.create('name', 'description',{
                accounts:{
                    campaign: campaign,
                    user: provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId
                }
            });

            console.log("Created a new campaign address: ", campaign.toString());

        }
        catch (error){
            console.log("Error creating campaign account: ", error);
        }
    }

    const renderNotConnectedContainer = () => (
        <button onClick={connectWallet}>Connect to Wallet</button>
    );
    const renderConnectedContainer = () => (
        <button onClick={createCampaign}>Create Campaign</button>
    );

    useEffect(() => {
        const onLoad = async () => {
            await checkIfWalletIsConnect();
        }
        window.addEventListener("load", onLoad);
        return () => window.removeEventListener("load", onLoad);
    },);

    return <div className="App">
        {!walletAddress && renderNotConnectedContainer()}
        {walletAddress && renderConnectedContainer()}
    </div>
}

export default App;
