import { useEffect, useState } from "react";
import './App.css';

import { Box, Button } from "@mui/material";
import MainTopBar from "./components/MainTopBar";
import MediaGrid from "./components/MediaGrid";

import { useWalletConnectClient } from "./chia-walletconnect/WalletConnectClientContext";
import { useWalletConnectRpc, WalletConnectRpcParams } from "./chia-walletconnect/WalletConnectRpcContext";
import { useSprigganRpc, SprigganRPCParams } from "./spriggan-shared/rpc/SprigganRpcContext";
import { GetNftsResult, GetWalletsResult, Nft, WalletType } from "./chia-walletconnect/types";
import { loadNftData } from "./util";
import { Media } from "./spriggan-shared/types/Media";

function App() {

	const [searchTerm, setSearchTerm] = useState<string>("");

	useEffect(() => {
		document.title = `Spriggan Library`;
	}, []);

	// Initialize the WalletConnect client.
	const {
		client,
		pairings,
		session,
		connect,
		disconnect,
		isInitializing,
	} = useWalletConnectClient();

	// Use `JsonRpcContext` to provide us with relevant RPC methods and states.
	const {
		ping,
		walletconnectRpc,
		rpcResult,
	} = useWalletConnectRpc();

	useEffect(() => {
		async function testConnection() {
			console.log("Testing Connection")
			try {
				const connected = await ping();
				if (!connected) {
					disconnect();
				}
				return connected
			} catch (e) {
				console.log("ping fail", e);
				disconnect();
			}
		}

		if (!isInitializing) {
			testConnection();
		}

		const interval = setInterval(async () => {
			console.log("Ping: ", await testConnection());
		}, 1000 * 60 * 1);

		return () => clearInterval(interval);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [session]);

	const onConnect = () => {
		if (typeof client === "undefined") {
			throw new Error("WalletConnect is not initialized");
		}
		// Suggest existing pairings (if any).
		if (pairings.length) {
			console.log("connecting to existing pairing");
			connect(pairings[pairings.length-1]);
		} else {
			// If no existing pairings are available, trigger `WalletConnectClient.connect`.
			connect();
		}
	};

	const {
		sprigganRpc,
		sprigganRpcResult,
	} = useSprigganRpc();

	useEffect(() => {
		async function ping() {
			try {
				await sprigganRpc.ping({} as SprigganRPCParams);
				console.log("connected!");
				return sprigganRpcResult?.valid
			} catch (e) {
				console.log("ping fail", e);
				return false;
			}
		}

		const interval = setInterval(() => {
			// This will run every 10 mins
			console.log("Ping: ", ping());
		}, 1000 * 60 * 1);

		return () => clearInterval(interval)
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const loadNfts = async () => {
		const nfts: Nft[] = []
		const fingerprint = session?.namespaces.chia.accounts[0].split(":")[2];
		var result = await walletconnectRpc.getWallets({ fingerprint: fingerprint } as WalletConnectRpcParams);
		const walletIds: number[] = [];
		for (const wallet of result.result.data as GetWalletsResult[]){
			if (wallet.type === WalletType.NFT) {
				walletIds.push(wallet.id);
			}
		}
		result = await walletconnectRpc.getNFTs({ fingerprint: fingerprint, walletIds: walletIds } as WalletConnectRpcParams);
		for (const [walletid, nftList] of Object.entries(result.result.data as GetNftsResult)) {
			for (const nft of nftList) {
				nfts.push(nft);
			}
		}
		return nfts
	}

	const [searchResults, setSearchResults] = useState<Media[]>([]);
	
	useEffect(() => {
		async function fetch() {
			const nfts = await loadNftData(await loadNfts());
			setSearchResults(nfts);
			console.log("setResults", searchResults);
		}
		if (session?.acknowledged) {
			console.log("fetching");
			fetch();
		}

		const interval = setInterval(() => {
			// This will run every 10 mins
			console.log("LoadNfts: ", fetch());
		}, 1000 * 60 * 10);

		return () => clearInterval(interval);
	}, [session])

	
	return (
		<Box>
			{MainTopBar(session, onConnect, disconnect, (event) => {setSearchTerm(event.target.value)})}
			{MediaGrid("Games", searchResults)}
			<Button onClick={async () => {
				if (session) {
					
					// console.log("NFT RESULT", result);
				}
			}}>Execute test</Button>
		</Box>
	);
}

export default App;
