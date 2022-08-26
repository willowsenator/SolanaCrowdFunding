import './App.css';
import idl from "./idl.json"
import {useEffect, useState} from "react";
import {clusterApiUrl, Connection, PublicKey, SystemProgram} from "@solana/web3.js";
import {AnchorProvider, Program, utils, web3, BN} from "@project-serum/anchor";
import {Buffer} from "buffer";

window.Buffer = Buffer;

const programId = new PublicKey(idl.metadata.address);
const network = clusterApiUrl("devnet");
const opts = {
    preflightCommitment: "processed"
}

const App = () => {
    const [walletAddress, setWalletAddress] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
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

    const getCampaigns = async()=>{
        const connection = new Connection(network, opts.preflightCommitment);
        const provider = getProvider();
        const program = new Program(idl, programId, provider);

      Promise.all((await connection.getProgramAccounts(programId)).map(async (campaign) =>({
          ...(await program.account.campaign.fetch(campaign.pubkey)),
          pubkey: campaign.pubkey,
      }))).then(campaigns => setCampaigns(campaigns))
    }

    const createCampaign = async() =>{
        try {
            const provider = getProvider();
            const program = new Program(idl, programId, provider);
            const [campaign] = await PublicKey.findProgramAddress(
                [
                    utils.bytes.utf8.encode("CampaignDEMO"),
                    provider.wallet.publicKey.toBuffer()
                ],
                program.programId
            );

            await program.rpc.create('campaign1', 'campaign description',{
                accounts:{
                    campaign,
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

    const donate = async (publicKey) =>{
        try {
            const provider = getProvider();
            const program = new Program(idl, programId, provider);

            await program.rpc.donate(new BN(0.2 * web3.LAMPORTS_PER_SOL),
                {
                    accounts: {
                        campaign: publicKey,
                        user: provider.wallet.publicKey,
                        systemProgram: SystemProgram.programId,
                    }
                });
            console.log("Donated some money to: ", publicKey.toString());
            await getCampaigns();
        }
        catch (err){
            console.error("Error donating: ", err);
        }
    }

    const withdraw = async(publicKey) =>{
        try {
            const provider = getProvider();
            const program = new Program(idl, programId, provider);

            await program.rpc.withdraw(new BN(0.2 * web3.LAMPORTS_PER_SOL),
                {
                    accounts: {
                        campaign: publicKey,
                        user: provider.wallet.publicKey,
                    }
                });
            console.log('Witdrew some money from: ', publicKey.toString());
        }
        catch (err){
            console.error("Error withdrawing: ", err);
        }


    }

    const renderNotConnectedContainer = () => (
        <button onClick={connectWallet}>Connect to Wallet</button>
    );
    const renderConnectedContainer = () => (
        <>
            <button onClick={createCampaign}>Create Campaign</button>
            <button onClick={getCampaigns}>Get Campaigns...</button>
            <br/>
            {campaigns.map(campaign => (
                <>
                    <p>Campaign ID: {campaign.pubkey.toString()}</p>
                    <p>Balance: {" "}
                        {(
                            campaign.amountDonated/web3.LAMPORTS_PER_SOL
                        ).toString()}</p>
                    <p>{campaign.name}</p>
                    <p>{campaign.description}</p>
                    <button onClick={()=>donate(campaign.pubkey)}>Click to donate!</button>
                    <button onClick={()=>withdraw(campaign.pubkey)}>Click to withdraw!</button>
                    <br/>
                </>
            ))}
        </>
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
