import { useEffect, useState } from "react";
import './App.css';

import { Box, Button } from "@mui/material";
import { MainTopBar } from "./components/MainTopBar";
import { MediaGrid } from "./components/MediaGrid";

import { useWalletConnectClient } from "./chia-walletconnect/WalletConnectClientContext";
import { useWalletConnectRpc, WalletConnectRpcParams } from "./chia-walletconnect/WalletConnectRpcContext";
import { useSprigganRpc, SprigganRPCParams } from "./spriggan-shared/contexts/SprigganRpcContext";
import { GetNftsResult, GetWalletsResult, Nft, WalletType } from "./chia-walletconnect/types";
import { Media, parseNftMetadata } from "./spriggan-shared/types/Media";
import { useSearch } from "./spriggan-shared/contexts/SearchContext";
import axios from "axios";

export const App = () => {
	
	const { search } = useSearch()
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
		const testConnection = async () => {
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
		const ping = async () => {
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

	const loadMediaData = async (nfts: Nft[]) => {
		console.log("loadNftData")
		const media:Media[] = []
		for (const nft of nfts) {
			const resp = await axios({
				method: 'get',
				url: nft.metadataUris[0],
			});
			const meta = parseNftMetadata(resp.data);
			var local = null
			try {
				await sprigganRpc.getLocalData({} as SprigganRPCParams);
				local = sprigganRpcResult?.result;
				console.log("Local Data", local);
				local = JSON.parse(local as string) as Media;
				console.log("Local Data", local);
			}
			catch (except) {
				console.log("Local Data not found.");
			}
			try {
				const marketplaceData = await search.installData(meta.productId);
				console.log("xxcvzvzvv", marketplaceData);
				media.push(marketplaceData);

				if (marketplaceData !== local) {

				}
			}
			catch (except) {
				
				console.log("Marketplace Data not found.");
			}
			

			// media.push(marketplaceData);
		}
		return media
	}

	const [searchResults, setSearchResults] = useState<Media[]>([]);
	
	useEffect(() => {
		const fetch = async() => {
			const nfts = await loadMediaData(await loadNfts());
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
					await sprigganRpc.getLocalData({productId: "asdf"} as SprigganRPCParams)
					console.log("fasdfasdf", sprigganRpcResult)
					
			}}>Execute test</Button>
		</Box>
	);
}

