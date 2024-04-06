import { Box } from "@mui/material";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import { MainTopBar } from "./components/MainTopBar";
import { MediaGrid } from "./components/MediaGrid";
import { useGostiApi } from "./gosti-shared/contexts/GostiApiContext";
import { useMarketplaceApi } from "./gosti-shared/contexts/MarketplaceApiContext";
import { useWalletConnect } from "./gosti-shared/contexts/WalletConnectContext";
import { useWalletConnectRpc } from "./gosti-shared/contexts/WalletConnectRpcContext";
import { GetLocalMediaMetadataRequest, SaveLocalMediaMetadataRequest } from "./gosti-shared/types/gosti/GostiRpcTypes";
import { GetInstallDataRequest } from "./gosti-shared/types/gosti/MarketplaceApiTypes";
import { Media, parseNftMetadata } from "./gosti-shared/types/gosti/Media";
import { NftInfo } from "./gosti-shared/types/walletconnect/NftInfo";
import { WalletType } from "./gosti-shared/types/walletconnect/WalletType";
import { GetNftsRequest, GetNftsResponse } from "./gosti-shared/types/walletconnect/rpc/GetNfts";
import { GetWalletsRequest } from "./gosti-shared/types/walletconnect/rpc/GetWallets";
import { RequestPermissionsRequest } from "./gosti-shared/types/walletconnect/rpc/RequestPermissions";

export const App = () => {

	const { getInstallData } = useMarketplaceApi();
	const [, setSearchTerm] = useState<string>("");

	useEffect(() => {
		document.title = `Gosti Library`;
	}, []);

	const { client, session, pairings, connect, disconnect } = useWalletConnect();

	const {
		requestPermissions,
		getWallets,
		getNfts,
	} = useWalletConnectRpc();

	const { saveLocalMediaMetadata, getLocalMediaMetadata } = useGostiApi();

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
					localData = await getLocalMediaMetadata({ productId: meta.productId } as GetLocalMediaMetadataRequest);
				}
				catch (except) {
					console.log("Local Data not found.");
				}
				try {
					// need signature
					marketplaceData = await getInstallData({ media: { productId: meta.productId }, pubkey: "pubkey", signature: "signature" } as GetInstallDataRequest);
				}
				catch (except) {
					console.log("Marketplace Data not found.");
				}
				if (localData) {
					if (marketplaceData) {
						// if (semver.gt(marketplaceData?.installData?.version || "0.0.1", localData?.media?.version || "0.0.1")) {
						saveLocalMediaMetadata({ media: marketplaceData.installData } as SaveLocalMediaMetadataRequest);
						// }
						media.push(marketplaceData.installData);
					} else {
						media.push(localData.media);
					}
				}
				else if (marketplaceData) {
					media.push(marketplaceData.installData);
					const saveResp = await saveLocalMediaMetadata({ media: marketplaceData.installData } as SaveLocalMediaMetadataRequest);
					console.log("saveLocalMediaMetadata", saveResp);
				}
			});
			return media;
		}, [getInstallData, getLocalMediaMetadata, saveLocalMediaMetadata]
	);

	const [searchResults, setSearchResults] = useState<Media[]>([]);

	useEffect(() => {
		const fetch = async () => {
			const permsResp = await requestPermissions({ commands: ["getWallets", "getNFTs", "getDIDInfo"] } as RequestPermissionsRequest);
			console.log("permsResp", permsResp);
			const results = await loadMediaData(await loadNfts());
			setSearchResults(results);
		};
		if (session?.acknowledged) {
			console.log("fetching");
			fetch();
		}
	}, [loadMediaData, loadNfts, requestPermissions, session]);

	return (
		<Box>
			{MainTopBar(session, onConnect, disconnect, (event) => { setSearchTerm(event.target.value); })}
			{MediaGrid("Games", searchResults)}
		</Box>
	);
};

