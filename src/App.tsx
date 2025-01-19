import { Box, Button } from '@mui/material';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

import { MainTopBar } from './components/MainTopBar';
import { MediaGrid } from './components/MediaGrid';
import { useMarketplaceApi } from './slime-shared/contexts/MarketplaceApiContext';
import { useSlimeApi } from './slime-shared/contexts/SlimeApiContext';
import { useWalletConnect } from './slime-shared/contexts/WalletConnectContext';
import { useWalletConnectRpc } from './slime-shared/contexts/WalletConnectRpcContext';
import { GetInstallDataRequest } from './slime-shared/types/slime/MarketplaceApiTypes';
import { Media, parseNftMetadata } from './slime-shared/types/slime/Media';
import { GetLocalMediaMetadataRequest, SaveLocalMediaMetadataRequest } from './slime-shared/types/slime/SlimeRpcTypes';
import { NftInfo } from './slime-shared/types/walletconnect/NftInfo';
import { WalletType } from './slime-shared/types/walletconnect/WalletType';
import { GetNftsRequest, GetNftsResponse } from './slime-shared/types/walletconnect/rpc/GetNfts';
import { GetWalletsRequest } from './slime-shared/types/walletconnect/rpc/GetWallets';
import { RequestPermissionsRequest } from './slime-shared/types/walletconnect/rpc/RequestPermissions';

export const App = () => {
	const { getInstallData } = useMarketplaceApi();
	const [, setSearchTerm] = useState<string>('');

	useEffect(() => {
		document.title = `Slime Library`;
	}, []);

	const { client, session, pairings, connect, disconnect } = useWalletConnect();

	const { requestPermissions, getWallets, getNfts } = useWalletConnectRpc();

	const { saveLocalMediaMetadata, getLocalMediaMetadata } = useSlimeApi();

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

	const loadNfts = useCallback(async () => {
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
	}, [getWallets, getNfts]);

	const loadMediaData = useCallback(
		async (nfts: NftInfo[]) => {
			console.log('loadNftData');
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
				} catch (except) {
					console.log('Local Data not found.');
				}
				try {
					// need signature
					marketplaceData = await getInstallData({
						media: { productId: meta.productId },
						pubkey: 'pubkey',
						signature: 'signature',
					} as GetInstallDataRequest);
				} catch (except) {
					console.log('Marketplace Data not found.');
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
				} else if (marketplaceData) {
					media.push(marketplaceData.installData);
					const saveResp = await saveLocalMediaMetadata({
						media: marketplaceData.installData,
					} as SaveLocalMediaMetadataRequest);
					console.log('saveLocalMediaMetadata', saveResp);
				}
			});
			return media;
		},
		[getInstallData, getLocalMediaMetadata, saveLocalMediaMetadata]
	);

	const [searchResults, setSearchResults] = useState<Media[]>([]);

	useEffect(() => {
		const fetch = async () => {
			const permsResp = await requestPermissions({ commands: ['getWallets', 'getNFTs'] } as RequestPermissionsRequest);
			console.log('permsResp', permsResp);
			const results = await loadMediaData(await loadNfts());
			setSearchResults(results);
		};
		if (session?.acknowledged) {
			console.log('fetching');
			fetch();
		}
	}, [loadMediaData, loadNfts, requestPermissions, session]);

	return (
		<Box>
			{MainTopBar(session, onConnect, disconnect, (event) => {
				setSearchTerm(event.target.value);
			})}
			{MediaGrid('Games', searchResults)}
			<Button
				onClick={async () => {
					console.log('getInstallStatus');
				}}
			>
				Connect
			</Button>
		</Box>
	);
};
