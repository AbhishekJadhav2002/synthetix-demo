import { Chain, EthereumClient, w3mConnectors, w3mProvider } from "@web3modal/ethereum";
import { configureChains, createClient } from "wagmi";
import { optimism, optimismGoerli } from "wagmi/chains";

export const chains = (process.env.NODE_ENV === "development" ? [optimismGoerli] : [optimism]) as Chain[];
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID as string;

const { provider } = configureChains(chains, [w3mProvider({ projectId })]);
export const wagmiClient = createClient({
    autoConnect: true,
    connectors: w3mConnectors({ projectId, version: 2, chains }),
    provider
});

export const ethereumClient = new EthereumClient(wagmiClient, chains);