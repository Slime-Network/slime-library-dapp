import { CssBaseline } from "@mui/material";
import { green } from '@mui/material/colors';
import { Experimental_CssVarsProvider as CssVarsProvider, experimental_extendTheme as extendTheme } from '@mui/material/styles';
import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './App';
import { CHAIN_ID, PROJECT_ID, RELAY_URL } from './gosti-shared/constants/env';
import { GostiRpcContextProvider } from './gosti-shared/contexts/GostiRpcContext';
import { JsonRpcProvider } from './gosti-shared/contexts/JsonRpcContext';
import { MarketplaceApiContextProvider } from './gosti-shared/contexts/MarketplaceApiContext';
import { WalletConnectProvider } from './gosti-shared/contexts/WalletConnectContext';

const theme = extendTheme({
	colorSchemes: {
		dark: { // palette for dark mode
			palette: {
				primary: {
					main: green[500]
				},
				secondary: {
					main: green[500]
				}
			}
		}
	}
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
	<React.StrictMode>
		<CssVarsProvider theme={theme}>
			<WalletConnectProvider
				projectId={PROJECT_ID}
				relayUrl={RELAY_URL}
				chainId={CHAIN_ID}>
				<JsonRpcProvider>
					<GostiRpcContextProvider>
						<MarketplaceApiContextProvider>
							<CssBaseline />
							<App />
						</MarketplaceApiContextProvider>
					</GostiRpcContextProvider>
				</JsonRpcProvider>
			</WalletConnectProvider>
		</CssVarsProvider>
	</React.StrictMode >
);

