import './App.css';
import {useEffect, useState} from "react";

const App = () => {
    const [walletAddress, setWalletAddress] = useState(null);
    const solflare = window.solflare;
    const isSolflareInstalled = solflare && solflare.isSolflare;
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

    const renderNotConnectedContainer = () => (
        <button onClick={connectWallet}>Connect to Wallet</button>
    )

    useEffect(() => {
        const onLoad = async () => {
            await checkIfWalletIsConnect();
        }
        window.addEventListener("load", onLoad);
        return () => window.removeEventListener("load", onLoad);
    },);

    return <div className="App">{!walletAddress && renderNotConnectedContainer()}</div>
}

export default App;
