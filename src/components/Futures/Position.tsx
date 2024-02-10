import { useWeb3Modal } from "@web3modal/react";
import { Signer, ethers } from "ethers";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAccount, useSigner } from "wagmi";
import IPerpsV2MarketOffchainOrders_abi from "../../config/abi/IPerpsV2MarketOffchainOrders.json";
import PerpsV2MarketData_abi from "../../config/abi/PerpsV2MarketData.json";
import PerpsV2MarketViews_abi from "../../config/abi/PerpsV2MarketViews.json";
import styles from "../../styles/Futures/Position.module.scss";
import {
    IPerpsV2MarketOffchainOrders,
    PerpsV2MarketData,
    PerpsV2MarketViews,
} from "../../types/contracts";

export default function Position(): JSX.Element {
    const [txLoading, setTxLoading] = useState(false);
    const { address, isConnected } = useAccount();
    const { data: signer } = useSigner();
    const [position, setPosition] =
        useState<PerpsV2MarketData.PositionDataStruct | null>(null);
    const { open } = useWeb3Modal();

    const perpsV2MarketData = new ethers.Contract(
        "0x0941808db469Ee7F3dF9dbd565C838784181673b",
        PerpsV2MarketData_abi,
        signer as Signer
    ) as PerpsV2MarketData;

    const perpsV2MarketViews = new ethers.Contract(
        "0xf2D9a9A2d79fFC36912bE87d504FA476A339E1Bb",
        PerpsV2MarketViews_abi,
        signer as Signer
    ) as PerpsV2MarketViews;

    const formatEther = ethers.utils.formatEther;

    const perpsV2MarketOffchainOrders = new ethers.Contract(
        "0x111BAbcdd66b1B60A20152a2D3D06d36F8B5703c",
        IPerpsV2MarketOffchainOrders_abi.abi,
        signer as Signer
    ) as IPerpsV2MarketOffchainOrders; //actual "0x4Ce0D35AcE88e88599b3ca5DC613029D6240274d"

    const handleClosePosition = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            if (!signer) {
                toast.error("Connect your wallet");
                await open();
                return;
            }

            if (!position) {
                toast.error("No position found");
                return;
            }

            setTxLoading(true);

            const fillPrice = await perpsV2MarketViews.fillPrice(
                BigInt(position?.position.size.toString()) * BigInt(-1)
            );

            const submitCloseOrderTx =
                await perpsV2MarketOffchainOrders.submitOffchainDelayedOrder(
                    BigInt(position?.position.size.toString()) * BigInt(-1),
                    fillPrice.price,
                    { from: address }
                );
            await submitCloseOrderTx.wait();
        } catch (error) {
            console.log(error);
        } finally {
            setTxLoading(false);
        }
    };

    useEffect(() => {
        if (isConnected && signer) {
            const fetchPosition = async () => {
                const position = await perpsV2MarketData.positionDetails(
                    "0x111BAbcdd66b1B60A20152a2D3D06d36F8B5703c",
                    address as string
                );
                setPosition(position);
            };

            fetchPosition();
        }
    }, [isConnected, signer, address]);

    return (
        <div className={styles.position}>
            {isConnected && position ? (
                <>
                    <p>ID: {formatEther(position?.position.id)}</p>
                    <p>Size: {formatEther(position?.position.size)}</p>
                    <p>PL: {formatEther(position.profitLoss)}</p>
                    <p>
                        Last Price: {formatEther(position.position.lastPrice)}
                    </p>
                    <p>
                        Liquidation Price:{" "}
                        {formatEther(position?.liquidationPrice)}
                    </p>
                    <button onClick={handleClosePosition}>
                        {txLoading ? "..." : "Close"}
                    </button>
                </>
            ) : (
                <></>
            )}
        </div>
    );
}
