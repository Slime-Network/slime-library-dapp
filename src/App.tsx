import { useEffect, useState } from "react";
import './App.css';

import { Box, Button } from "@mui/material";
import MainTopBar from "./components/MainTopBar";
import Media from "./spriggan-shared/types/Media";

import GameGrid from "./components/GameGrid";
import { useSprigganRpc } from "./spriggan-shared/rpc/SprigganRpcContext";

function App() {

	useEffect(() => {
		document.title = `Spriggan Library`;
	}, []);

	const {
		sprigganRpc,
	} = useSprigganRpc();


	useEffect(() => {
		async function testConnection() {
			try {
				const connected = await ping();
				if (!connected) {
					disconnect()
				}
				return connected
			} catch (e) {
				console.log("ping fail", e)
				disconnect();
			}
		}

		if (!isInitializing) {
			testConnection()
		}

		const interval = setInterval(() => {
			// This will run every 10 mins
			console.log("Ping: ", testConnection());
		}, 1000 * 60 * 1);

		return () => clearInterval(interval)
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [session]);

	const onConnect = () => {
		if (typeof client === "undefined") {
			throw new Error("WalletConnect is not initialized");
		}
		// Suggest existing pairings (if any).
		if (pairings.length) {
			connect(pairings[0]);
		} else {
			// If no existing pairings are available, trigger `WalletConnectClient.connect`.
			connect();
		}
	};


	const executeOffer = async () => {
		if (session && activeOffer) {
			var x = session.namespaces.chia.accounts[0].split(":");
			console.log(x[0] + ':' + x[1], x[2]);
			await walletconnectRpc.takeOffer({ fingerprint: x[2], offer: activeOffer, fee: 1 } as WalletConnectRpcParams);
		}
	};

	
	return (
			<Box>
				<Button onClick={async () => {
					if (session) {
						var x = session.namespaces.chia.accounts[0].split(":");
						await walletconnectRpc.getNFTs({ fingerprint: x[2] } as WalletConnectRpcParams);
					}
				}}>Execute test</Button>
				{MainTopBar(session, onConnect, disconnect, (event) => {setSearchTerm(event.target.value)})}
				{GameGrid("Search Results", searchResults, executeOffer, setActiveOffer)}
				{GameGrid("Recently Updated", mostRecentResults, executeOffer, setActiveOffer)}
			</Box>
	);
}

export default App;
