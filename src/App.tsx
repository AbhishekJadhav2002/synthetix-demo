import { Web3Modal } from "@web3modal/react";
import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { Navbar } from "./components";
import { ethereumClient } from "./config/web3.config";
import { Futures, Home } from "./pages";
import "./styles/global.scss";

function App() {
    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/futures" element={<Futures />} />
            </Routes>

            <Web3Modal
                projectId={process.env.REACT_APP_WALLETCONNECT_PROJECT_ID as string}
                ethereumClient={ethereumClient}
            />
            <ToastContainer theme="dark" position="bottom-right" />
        </>
    );
}

export default App;
