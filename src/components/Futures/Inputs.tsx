import {
  PriceFeed,
  PriceServiceConnection,
} from "@pythnetwork/price-service-client";
import { useWeb3Modal } from "@web3modal/react";
import { Signer, ethers } from "ethers";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAccount, useSigner } from "wagmi";
import IPerpsV2Market_abi from "../../config/abi/IPerpsV2Market.json";
import IPerpsV2MarketOffchainOrders_abi from "../../config/abi/IPerpsV2MarketOffchainOrders.json";
import PerpsV2MarketData_abi from "../../config/abi/PerpsV2MarketData.json";
import PerpsV2MarketViews_abi from "../../config/abi/PerpsV2MarketViews.json";
import ProxyERC20_abi from "../../config/abi/ProxyERC20.json";
import styles from "../../styles/Futures/Inputs.module.scss";
import {
  IPerpsV2Market,
  IPerpsV2MarketOffchainOrders,
  PerpsV2MarketData,
  PerpsV2MarketViews,
  ProxyERC20,
} from "../../types/contracts";

export default function Inputs(): JSX.Element {
  const [txLoading, setTxLoading] = useState(false);
  const [currentMargin, setCurrentMargin] = useState("...");
  const { address, isConnected, isConnecting } = useAccount();
  const { data: signer } = useSigner();
  const { open } = useWeb3Modal();

  const sUSD = new ethers.Contract(
    "0xeBaEAAD9236615542844adC5c149F86C36aD1136",
    ProxyERC20_abi.abi,
    signer as Signer
  ) as ProxyERC20;

  const perpsV2Market = new ethers.Contract(
    "0x111BAbcdd66b1B60A20152a2D3D06d36F8B5703c", // 0x52636AfbA57448f4A4a17c2BD0D629F64735f0A1
    IPerpsV2Market_abi.abi,
    signer as Signer
  ) as IPerpsV2Market;

  const perpsV2MarketOffchainOrders = new ethers.Contract(
    "0x111BAbcdd66b1B60A20152a2D3D06d36F8B5703c",
    IPerpsV2MarketOffchainOrders_abi.abi,
    signer as Signer
  ) as IPerpsV2MarketOffchainOrders; //actual "0x4Ce0D35AcE88e88599b3ca5DC613029D6240274d"

  const perpsV2MarketViews = new ethers.Contract(
    "0xf2D9a9A2d79fFC36912bE87d504FA476A339E1Bb",
    PerpsV2MarketViews_abi,
    signer as Signer
  ) as PerpsV2MarketViews;

  const perpsV2MarketData = new ethers.Contract(
    "0x0941808db469Ee7F3dF9dbd565C838784181673b",
    PerpsV2MarketData_abi,
    signer as Signer
  ) as PerpsV2MarketData;

  const connection = new PriceServiceConnection("https://hermes.pyth.network");

  function formatPythPrice(priceFeed: PriceFeed) {
    const price = priceFeed.getPriceUnchecked();
    return ethers.utils.formatUnits(price.price, price.expo);
  }

  const handleOpenPosition = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (!signer) {
        toast.error("Connect your wallet");
        await open();
        return;
      }

      setTxLoading(true);

      const formData = new FormData(e.currentTarget);
      const leverage = formData.get("leverage");
      const tradeType = formData.get("type");

      if (!leverage || !tradeType) {
        toast.error("Please fill in all fields");
        return;
      }

      const desiredFillPrice = await perpsV2MarketViews.fillPrice(
        ethers.utils.parseEther(
          (
            parseInt(leverage.toString()) *
            parseInt(currentMargin) *
            (tradeType === "LONG" ? 1 : -1)
          ).toString()
        )
      );

      const priceIds = [
        // "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", // stable ETH/USD price id
        "0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6", // beta ETH/USD price id
      ];

      const pythPrices = await connection.getLatestPriceFeeds(priceIds);
      if (pythPrices && pythPrices.length === 0) {
        throw new Error("No price feeds");
      }
      const offChainPrices = [pythPrices?.map(formatPythPrice)];
      console.log("offChainPrices", offChainPrices);

      const submitOrderTx =
        await perpsV2MarketOffchainOrders.submitOffchainDelayedOrder(
          ethers.utils.parseEther(
            (
              parseInt(leverage.toString()) *
              parseInt(currentMargin) *
              (tradeType === "LONG" ? 1 : -1)
            ).toString()
          ),
          desiredFillPrice.price,
          { from: address }
        );
      await submitOrderTx.wait();

      // setTimeout(async () => {
      //     const connection = new EvmPriceServiceConnection(
      //         "https://hermes-beta.pyth.network",
      //         {
      //             logger: console,
      //         }
      //     );

      //     const priceIds = [
      //         // "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", // stable ETH/USD price id
      //         "0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6", // beta ETH/USD price id
      //     ];

      //     const priceUpdateData =
      //         await connection.getPriceFeedsUpdateData(priceIds);

      //     const pythContract = new ethers.Contract(
      //         "0xff1a0f4744e8582DF1aE09D5611b887B6a12925C",
      //         PythAbi,
      //         signer
      //     );
      //     const updateFee = await pythContract.getUpdateFee(
      //         priceUpdateData
      //     );

      //     const tx =
      //         await perpsV2MarketOffchainOrders.executeOffchainDelayedOrder(
      //             address as string,
      //             priceUpdateData,
      //             { from: address, value: updateFee }
      //         );
      //     await tx.wait();
      // }, 15000);
    } catch (error) {
      console.log(error);
    } finally {
      setTxLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!isConnected) await open();
  };

  const handleTransferMargin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (!signer) {
        toast.error("Connect your wallet");
        await open();
        return;
      }

      setTxLoading(true);

      const formData = new FormData(e.currentTarget);
      const depositMargin = formData.get("depositMargin");

      if (!depositMargin) {
        toast.error("Please fill in all fields");
        return;
      }

      const allowance = await sUSD.allowance(
        address as string,
        perpsV2Market.address
      );
      if (allowance.lt(ethers.utils.parseEther(depositMargin?.toString()))) {
        const approveTx = await sUSD.approve(
          perpsV2Market.address,
          ethers.utils.parseEther(depositMargin?.toString())
        );
        await approveTx.wait();
      }

      const marginTx = await perpsV2Market.transferMargin(
        ethers.utils.parseEther(depositMargin?.toString()),
        { from: address }
      );
      await marginTx.wait();
    } catch (error) {
      console.log(error);
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    if (signer && perpsV2MarketData) {
      const fetchMargin = async () => {
        const position = await perpsV2MarketData.positionDetails(
          "0x111BAbcdd66b1B60A20152a2D3D06d36F8B5703c",
          address as string
        );
        setCurrentMargin(
          ethers.utils.formatEther(position.remainingMargin.toString())
        );
      };

      fetchMargin();
    }
  }, [signer]);

  return (
    <div className={styles.inputs}>
      {!isConnected ? (
        <button onClick={handleConnect} className={styles.full__btn}>
          Connect Wallet
        </button>
      ) : (
        <></>
      )}
      {isConnected ? (
        <>
          <form className={styles.form} onSubmit={handleTransferMargin}>
            <p>Accessible Margin: {currentMargin} sUSD</p>
            <div className={styles.input}>
              <label htmlFor="depositMargin">Deposit Margin</label>
              <input
                type="number"
                id="depositMargin"
                placeholder="enter margin to deposit"
                name="depositMargin"
                required
              />
            </div>
            <button type="submit" className={styles.full__btn}>
              {txLoading ? "Loading..." : "Deposit Margin"}
            </button>
          </form>
          <form className={styles.form} onSubmit={handleOpenPosition}>
            <div className={styles.input}>
              <label htmlFor="leverage">Leverage</label>
              <input
                type="number"
                id="leverage"
                placeholder="enter leverage"
                name="leverage"
                required
              />
            </div>
            <div className={styles.input}>
              <label htmlFor="type">Trade Type</label>
              <div className={styles.row}>
                <div className={styles.radio}>
                  <label htmlFor="short">SHORT: </label>
                  <input
                    type="radio"
                    id="short"
                    name="type"
                    value={"SHORT"}
                    radioGroup="tradeType"
                    required
                  />
                </div>
                <div className={styles.radio}>
                  <label htmlFor="long">LONG: </label>
                  <input
                    type="radio"
                    id="long"
                    name="type"
                    value={"LONG"}
                    radioGroup="tradeType"
                    required
                  />
                </div>
              </div>
            </div>
            <button type="submit" className={styles.full__btn}>
              {txLoading ? "Loading..." : "Open Position"}
            </button>
          </form>
        </>
      ) : isConnecting ? (
        <p>Connecting...</p>
      ) : (
        <p>Not connected</p>
      )}
    </div>
  );
}
