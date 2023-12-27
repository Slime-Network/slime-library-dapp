import { Box } from "@mui/material";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import { MainTopBar } from "./components/MainTopBar";
import { MediaGrid } from "./components/MediaGrid";
import { useGostiRpc } from "./gosti-shared/contexts/GostiRpcContext";
import { useJsonRpc } from "./gosti-shared/contexts/JsonRpcContext";
import { useMarketplaceApi } from "./gosti-shared/contexts/MarketplaceApiContext";
import { useWalletConnect } from "./gosti-shared/contexts/WalletConnectContext";
import { GetLocalDataRequest, GetLocalDataResponse, PingRequest, SaveLocalDataRequest } from "./gosti-shared/types/gosti/GostiRpcTypes";
import { GetInstallDataRequest } from "./gosti-shared/types/gosti/MarketplaceApiTypes";
import { Media, parseNftMetadata } from "./gosti-shared/types/gosti/Media";
import { NftInfo } from "./gosti-shared/types/walletconnect/NftInfo";
import { WalletType } from "./gosti-shared/types/walletconnect/WalletType";
import { GetNftsRequest, GetNftsResponse } from "./gosti-shared/types/walletconnect/rpc/GetNfts";
import { GetWalletsRequest } from "./gosti-shared/types/walletconnect/rpc/GetWallets";

export const App = () => {

	const { getInstallData } = useMarketplaceApi();
	const [, setSearchTerm] = useState<string>("");

	useEffect(() => {
		document.title = `Gosti Library`;
	}, []);

	const { client, session, pairings, connect, disconnect } =
		useWalletConnect();

	const {
		getWallets,
		getNfts,
	} = useJsonRpc();

	const onConnect = () => {
		if (!client) throw new Error('WalletConnect is not initialized.');

		if (pairings.length === 1) {
			connect({ topic: pairings[0].topic });
		} else if (pairings.length) {
			console.log('The pairing modal is not implemented.', pairings);
		} else {
			connect();
		}
	};

	const {
		ping,
		getLocalData,
		saveLocalData,
		gostiRpcResult,
	} = useGostiRpc();

	useEffect(() => {
		if (gostiRpcResult?.method === "ping") {
			const pingRpc = async () => {
				try {
					await ping({} as PingRequest);
					console.log("connected!");
					return gostiRpcResult?.valid;
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
		}

		return () => true;

	}, [ping, gostiRpcResult]);

	const loadNfts = useCallback(
		async () => {
			const nfts: NftInfo[] = [];
			const getWalletsResult = await getWallets({ includeData: true } as GetWalletsRequest);
			const walletIds: number[] = [];

			getWalletsResult.forEach((wallet) => {
				if (wallet.type === WalletType.Nft) {
					walletIds.push(wallet.id);
				}
			});

			const getNftsResponse = await getNfts({ walletIds } as GetNftsRequest);

			Object.entries(getNftsResponse as GetNftsResponse).forEach((nftList: [string, NftInfo[]]) => {
				nftList[1].forEach((nft: NftInfo) => {
					nfts.push(nft);
				});
			});

			return nfts;
		}, [getWallets, getNfts]
	);

	const loadMediaData = useCallback(
		async (nfts: NftInfo[]) => {
			console.log("loadNftData");
			const media: Media[] = [];
			nfts.forEach(async (nft: NftInfo) => {
				const resp = await axios({
					method: 'get',
					url: nft.metadataUris[0],
				});
				const meta = parseNftMetadata(resp.data);
				let localData = null;
				let marketplaceData = null;
				try {
					localData = await getLocalData({} as GetLocalDataRequest);
					localData = (localData.result as GetLocalDataResponse).media;
				}
				catch (except) {
					console.log("Local Data not found.");
				}
				try {
					// need signature
					marketplaceData = await getInstallData({ media: { productId: meta.productId }, pubkey: "pubkey", signature: "signature" } as GetInstallDataRequest);
					media.push(marketplaceData.installData);
					console.log("marketplace data", marketplaceData);

					if (marketplaceData.installData !== localData) {
						await saveLocalData({ media: marketplaceData.installData } as SaveLocalDataRequest);
					}
				}
				catch (except) {
					console.log("Marketplace Data not found.");
				}
			});
			return media;
		}, [getInstallData, getLocalData, saveLocalData]
	);

	const [searchResults, setSearchResults] = useState<Media[]>([]);

	useEffect(() => {
		console.log("session", session);
		const fetch = async () => {
			const results = await loadMediaData(await loadNfts());
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
		// eslint-disable-next-line react-hooks/exhaustive-deps -- dd
	}, [session]);

	return (
		<Box>
			{MainTopBar(session, onConnect, disconnect, (event) => { setSearchTerm(event.target.value); })}
			{MediaGrid("Games", searchResults)}
		</Box>
	);
};

