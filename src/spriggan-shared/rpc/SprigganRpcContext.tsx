import { createContext, ReactNode, useContext, useState } from "react";

import Media from "../types/Media";

import axios from 'axios';

/**
 * Types
 */
interface IFormattedRpcResponse {
	method?: string;
	valid: boolean;
	result: string;
}

type TRpcRequestCallback = (params: {media: Media}) => Promise<void>;

interface IContext {
	SprigganRpc: {
		ping: TRpcRequestCallback,
		downloadMedia: TRpcRequestCallback,
	},
	rpcResult?: IFormattedRpcResponse | null;
	isRpcRequestPending: boolean;
}

/**
 * Context
 */
export const SprigganRpcContext = createContext<IContext>({} as IContext);

/**
 * Provider
 */
export function SprigganRpcContextProvider({children}: {
	children: ReactNode | ReactNode[];
}) {
	const [pending, setPending] = useState(false);
	const [result, setResult] = useState<IFormattedRpcResponse | null>();

	const _createSprigganRpcRequestHandler =
		(
			rpcRequest: (
				params: {media: Media}
			) => Promise<IFormattedRpcResponse>
		) =>
		async (params: {media: Media}) => {
			try {
				setPending(true);
				const result = await rpcRequest(params);
				setResult(result);
			} catch (err: any) {
				console.error("RPC request failed: ", err);
				setResult({
					valid: false,
					result: err?.message ?? err,
				});
			} finally {
				setPending(false);
			}
		};

	const SprigganRpc = {
		ping: _createSprigganRpcRequestHandler(
			async (
			): Promise<IFormattedRpcResponse> => {
				const method = 'downloadMedia'
				const result = await axios.post(`http://127.0.0.1:5235/`, {
					jsonrpc: "2.0",
					method: method,
					id: "ping",
				});
				return {
					method,
					valid: true,
					result: JSON.stringify(result),
				};
			}
		),
		downloadMedia: _createSprigganRpcRequestHandler(
			async (
				params: {media: Media}
			): Promise<IFormattedRpcResponse> => {
				const method = 'downloadMedia'
				const result = await axios.post(`http://127.0.0.1:5235/`, {
					jsonrpc: "2.0",
					method: method,
					id: "downloadMedia: " + params.media.title,
					params: params,
				});
				return {
					method,
					valid: true,
					result: JSON.stringify(result),
				};
			}
		),
	};

	return (
		<SprigganRpcContext.Provider
		value={{
			SprigganRpc,
			rpcResult: result,
			isRpcRequestPending: pending,
		}}
		>
			{children}
		</SprigganRpcContext.Provider>
	);
}

export function useSprigganRpc() {
	const context = useContext(SprigganRpcContext);
	if (context === undefined) {
		throw new Error("useSprigganRpc must be used within a SprigganRpcContextProvider");
	}
	return context;
}
