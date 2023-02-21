import axios from "axios";
import { Nft } from "../chia-walletconnect/types";
import { Media, parseNftMetadata } from "../spriggan-shared/types/Media";


export const loadNftData = async (nfts: Nft[]) => {
	console.log("loadNftData")
	const media:Media[] = []
	for (const nft of nfts) {
		const resp = await axios({
			method: 'get',
			url: nft.metadataUris[0],
		});
		const meta = parseNftMetadata(resp.data);

		// TODO: get more from datalayer 
		// check dids matches
		media.push({
			title: meta.productName,
			capsuleimage: nft.dataUris[0],
			publisherdid: nft.minterDid,
			
		} as Media);
	}
	return media
}