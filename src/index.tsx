import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { WagmiConfig } from "wagmi";
import App from "./App";
import { wagmiClient } from "./config/web3.config";

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
);
root.render(
    <React.StrictMode>
        <WagmiConfig client={wagmiClient}>
            <BrowserRouter>
                <QueryClientProvider client={queryClient}>
                    <App />
                </QueryClientProvider>
            </BrowserRouter>
        </WagmiConfig>
    </React.StrictMode>
);
