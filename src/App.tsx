import { Box } from "@mui/material";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import { useWalletConnectClient } from "./chia-walletconnect/contexts/WalletConnectClientContext";
import { useWalletConnectRpc, WalletConnectRpcParams } from "./chia-walletconnect/contexts/WalletConnectRpcContext";
import { GetNftsResult, GetWalletsResult, Nft, WalletType } from "./chia-walletconnect/types";
import { MainTopBar } from "./components/MainTopBar";
import { MediaGrid } from "./components/MediaGrid";
import { useSearch } from "./spriggan-shared/contexts/SearchContext";
import { useSprigganRpc, SprigganRPCParams } from "./spriggan-shared/contexts/SprigganRpcContext";
import { Media, parseNftMetadata } from "./spriggan-shared/types/Media";

export const App = () => {

	const { search } = useSearch();
	const [, setSearchTerm] = useState<string>("");

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
	} = useWalletConnectRpc();

	useEffect(() => {
		const testConnection = async () => {
			console.log("Testing Connection");
			try {
				const connected = await ping();
				if (!connected) {
					disconnect();
				}
				return connected;
			} catch (e) {
				console.log("ping fail", e);
				disconnect();
				return false;
			}
		};

		if (!isInitializing) {
			testConnection();
		}

		const interval = setInterval(async () => {
			console.log("Ping: ", await testConnection());
		}, 1000 * 60 * 1);

		return () => clearInterval(interval);
	}, [disconnect, isInitializing, ping, session]);

	const onConnect = () => {
		if (typeof client === "undefined") {
			throw new Error("WalletConnect is not initialized");
		}
		// Suggest existing pairings (if any).
		if (pairings.length) {
			console.log("connecting to existing pairing");
			connect(pairings[pairings.length - 1]);
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
		const pingRpc = async () => {
			try {
				await sprigganRpc.ping({} as SprigganRPCParams);
				console.log("connected!");
				return sprigganRpcResult?.valid;
			} catch (e) {
				console.log("ping fail", e);
				return false;
			}
		};

		const interval = setInterval(() => {
			// This will run every 10 mins
			console.log("Ping: ", pingRpc());
		}, 1000 * 60 * 1);

		return () => clearInterval(interval);
	}, [sprigganRpc, sprigganRpcResult]);

	const loadNfts = useCallback(
		async () => {
			const nfts: Nft[] = [];
			const fingerprint = session?.namespaces.chia.accounts[0].split(":")[2];
			let result = await walletconnectRpc.getWallets({ fingerprint } as WalletConnectRpcParams);
			const walletIds: number[] = [];
			console.log("WC result", result);

			(result.result.data as GetWalletsResult[]).forEach((wallet) => {
				if (wallet.type === WalletType.NFT) {
					walletIds.push(wallet.id);
				}
			});

			result = await walletconnectRpc.getNFTs({ fingerprint, walletIds } as WalletConnectRpcParams);

			Object.entries(result.result.data as GetNftsResult).forEach((nftList: [string, Nft[]]) => {
				nftList[1].forEach((nft: Nft) => {
					nfts.push(nft);
				});
			});

			return nfts;
		}, [session, walletconnectRpc]
	);

	const loadMediaData = useCallback(
		async (nfts: Nft[]) => {
			console.log("loadNftData");
			const media: Media[] = [];
			nfts.forEach(async (nft: Nft) => {
				const resp = await axios({
					method: 'get',
					url: nft.metadataUris[0],
				});
				const meta = parseNftMetadata(resp.data);
				let localData = null;
				let marketplaceData = null;
				try {
					await sprigganRpc.getLocalData({} as SprigganRPCParams);
					localData = sprigganRpcResult?.result;
					console.log("Local Data", localData);
					localData = JSON.parse(localData as string) as Media;
					console.log("Local Data", localData);
				}
				catch (except) {
					console.log("Local Data not found.");
				}
				try {
					marketplaceData = await search.installData(meta.productId);
					console.log("xxcvzvzvv", marketplaceData);
					media.push(marketplaceData);

					// if (marketplaceData !== localData) {

					// }
				}
				catch (except) {
					console.log("Marketplace Data not found.");
				}
			});
			return media;
		}, [search, sprigganRpc, sprigganRpcResult]
	);

	const [searchResults, setSearchResults] = useState<Media[]>([]);

	useEffect(() => {
		const fetch = async () => {
			const results = await loadMediaData(await loadNfts());
			console.log("setResults", results);
			setSearchResults(results);
		};
		if (session?.acknowledged) {
			console.log("fetching");
			fetch();
		}

		const interval = setInterval(() => {
			// This will run every 10 mins
			console.log("LoadNfts: ", fetch());
		}, 1000 * 60 * 10);

		return () => clearInterval(interval);
	}, [session, loadMediaData, loadNfts]);


	return (
		<Box>
			{MainTopBar(session, onConnect, disconnect, (event) => { setSearchTerm(event.target.value); })}
			{MediaGrid("Games", searchResults)}
		</Box>
	);
};

