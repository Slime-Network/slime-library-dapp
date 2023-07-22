import { Box } from "@mui/material";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import { MainTopBar } from "./components/MainTopBar";
import { MediaGrid } from "./components/MediaGrid";
import { useJsonRpc } from "./spriggan-shared/contexts/JsonRpcContext";
import { useMarketplaceApi } from "./spriggan-shared/contexts/MarketplaceApiContext";
import { GetLocalDataRequest, PingRequest, SaveLocalDataRequest, useSprigganRpc } from "./spriggan-shared/contexts/SprigganRpcContext";
import { useWalletConnect } from "./spriggan-shared/contexts/WalletConnectContext";
import { GetInstallDataRequest } from "./spriggan-shared/types/spriggan/MarketplaceApiTypes";
import { Media, parseNftMetadata } from "./spriggan-shared/types/spriggan/Media";
import { NftInfo } from "./spriggan-shared/types/walletconnect/NftInfo";
import { WalletType } from "./spriggan-shared/types/walletconnect/WalletType";
import { GetNftsRequest, GetNftsResponse } from "./spriggan-shared/types/walletconnect/rpc/GetNfts";
import { GetWalletsRequest } from "./spriggan-shared/types/walletconnect/rpc/GetWallets";

export const App = () => {

	const { getInstallData } = useMarketplaceApi();
	const [, setSearchTerm] = useState<string>("");

	useEffect(() => {
		document.title = `Spriggan Library`;
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
		sprigganRpcResult,
	} = useSprigganRpc();

	useEffect(() => {
		if (sprigganRpcResult?.method === "ping") {
			const pingRpc = async () => {
				try {
					await ping({} as PingRequest);
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
		}

		return () => true;

	}, [ping, sprigganRpcResult]);

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
					await getLocalData({} as GetLocalDataRequest);
					localData = sprigganRpcResult?.result;
					localData = JSON.parse(localData as string) as Media;
				}
				catch (except) {
					console.log("Local Data not found.");
				}
				try {
					marketplaceData = await getInstallData({ productId: meta.productId } as GetInstallDataRequest);
					media.push(marketplaceData.installData);
					console.log("marketplace data", marketplaceData);

					if (marketplaceData !== localData) {
						await saveLocalData({ media: marketplaceData } as SaveLocalDataRequest);
					}
				}
				catch (except) {
					console.log("Marketplace Data not found.");
				}
			});
			return media;
		}, [getInstallData, getLocalData, saveLocalData, sprigganRpcResult?.result]
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

