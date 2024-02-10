import { wei } from "@synthetixio/wei";
import { Signer, ethers } from "ethers";
import { parseBytes32String } from "ethers/lib/utils.js";
import { useEffect, useState } from "react";
import { useAccount, useSigner } from "wagmi";
import PerpsV2MarketData_abi from "../../config/abi/PerpsV2MarketData.json";
import PerpsV2MarketSettings_abi from "../../config/abi/PerpsV2MarketSettings.json";
import styles from "../../styles/Futures/HeadStats.module.scss";
import {
    PerpsV2MarketData,
    PerpsV2MarketSettings,
} from "../../types/contracts";

export default function HeadStats(): JSX.Element {
    const { isConnected } = useAccount();
    const { data: signer } = useSigner();
    const [skew, setSkew] = useState({ short: "0", long: "0" });
    const [marketPrice, setMarketPrice] = useState<string>("0.00");
    const [openInterest, setOpenInterest] = useState({ long: "0", short: "0" });
    const [oiCap, setOiCap] = useState("0");

    const perpsV2MarketData = new ethers.Contract(
        "0x0941808db469Ee7F3dF9dbd565C838784181673b", // mainnet 0x340B5d664834113735730Ad4aFb3760219Ad9112
        PerpsV2MarketData_abi,
        signer as Signer
    ) as PerpsV2MarketData;

    const perpsV2MarketSettings = new ethers.Contract(
        "0xedf10514EF611e3808622f24e236b83cB9E51dCe", // mainnet 0x649F44CAC3276557D03223Dbf6395Af65b11c11c
        PerpsV2MarketSettings_abi,
        signer as Signer
    ) as PerpsV2MarketSettings;

    useEffect(() => {
        const fetchSkew = async () => {
            const proxiedMarkets =
                await perpsV2MarketData.allProxiedMarketSummaries();
            const marketDetails = proxiedMarkets.filter((market) => {
                const marketKey = parseBytes32String(market.key);
                return marketKey === "sETHPERP";
            })[0];
            const skewScale = await perpsV2MarketSettings.skewScale(
                marketDetails.key
            );
            const maxMarketValue = await perpsV2MarketSettings.maxMarketValue(
                marketDetails.key
            );

            const marketsInfo = {
                key: marketDetails.key,
                marketKey: parseBytes32String(marketDetails.key),
                asset: parseBytes32String(marketDetails.asset),
                feeRates: {
                    makerFee: ethers.utils.parseEther(
                        marketDetails.feeRates.makerFee.toString()
                    ),
                    takerFee: ethers.utils.parseEther(
                        marketDetails.feeRates.takerFee.toString()
                    ),
                    makerFeeDelayedOrder: ethers.utils.parseEther(
                        marketDetails.feeRates.makerFeeDelayedOrder.toString()
                    ),
                    takerFeeDelayedOrder: ethers.utils.parseEther(
                        marketDetails.feeRates.takerFeeDelayedOrder.toString()
                    ),
                    makerFeeOffchainDelayedOrder: ethers.utils.parseEther(
                        marketDetails.feeRates.makerFeeOffchainDelayedOrder.toString()
                    ),
                    takerFeeOffchainDelayedOrder: ethers.utils.parseEther(
                        marketDetails.feeRates.takerFeeOffchainDelayedOrder.toString()
                    ),
                },
                openInterest: {
                    shortPct: wei(marketDetails.marketSize).eq(0)
                        ? 0
                        : wei(marketDetails.marketSize)
                              .sub(marketDetails.marketSkew)
                              .div("2")
                              .div(marketDetails.marketSize)
                              .toNumber(),
                    longPct: wei(marketDetails.marketSize).eq(0)
                        ? 0
                        : wei(marketDetails.marketSize)
                              .add(marketDetails.marketSkew)
                              .div("2")
                              .div(marketDetails.marketSize)
                              .toNumber(),
                    shortUSD: wei(marketDetails.marketSize).eq(0)
                        ? ethers.utils.parseEther("0")
                        : wei(marketDetails.marketSize)
                              .sub(marketDetails.marketSkew)
                              .div("2")
                              .mul(marketDetails.price),
                    longUSD: wei(marketDetails.marketSize).eq(0)
                        ? ethers.utils.parseEther("0")
                        : wei(marketDetails.marketSize)
                              .add(marketDetails.marketSkew)
                              .div("2")
                              .mul(marketDetails.price),
                },
                marketDebt: wei(marketDetails.marketDebt),
                marketSkew: wei(marketDetails.marketSkew),
                marketSize: wei(marketDetails.marketSize),
                settings: {
                    skewScale: wei(skewScale),
                },
            };

            setSkew({
                long: (marketsInfo.openInterest.longPct * 100).toFixed(2),
                short: (marketsInfo.openInterest.shortPct * 100).toFixed(2),
            });
            setMarketPrice(
                `$${marketsInfo.marketSkew
                    .div(marketsInfo.settings.skewScale)
                    .add(1)
                    .toString(2)}`
            ); // mul by off chain price
            setOpenInterest({
                long: marketsInfo.openInterest.longUSD
                    .div(1e6)
                    .toNumber()
                    .toFixed(2),
                short: marketsInfo.openInterest.shortUSD
                    .div(1e6)
                    .toNumber()
                    .toFixed(2),
            });
            setOiCap(
                wei(maxMarketValue)
                    .mul(wei(marketDetails.price))
                    .toNumber()
                    .toFixed(2)
            );
        };

        fetchSkew();
    }, [isConnected, signer]);

    return (
        <div className={styles.headStats}>
            {isConnected ? (
                <div className={styles.headStats__row}>
                    <div className={styles.headStats__col}>
                        <h3 className={styles.title}>Market Price</h3>
                        <p className={styles.value}>{marketPrice}</p>
                    </div>
                    <div className={styles.headStats__col}>
                        <h3 className={styles.title}>Skew</h3>
                        <p className={styles.value}>
                            {skew.long}%/{skew.short}%
                        </p>
                    </div>
                    <div className={styles.headStats__col}>
                        <h3 className={styles.title}>Open Interest (L)</h3>
                        <p className={styles.value}>
                            ${openInterest.long}M / ${oiCap}
                        </p>
                    </div>
                    <div className={styles.headStats__col}>
                        <h3 className={styles.title}>Open Interest (S)</h3>
                        <p className={styles.value}>
                            ${openInterest.short}M / ${oiCap}
                        </p>
                    </div>
                    <div className={styles.headStats__col}>
                        <h3 className={styles.title}>24H Change</h3>
                        <p className={styles.value}>0.00</p>
                    </div>
                </div>
            ) : (
                <></>
            )}
        </div>
    );
}
