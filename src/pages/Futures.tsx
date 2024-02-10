import { HeadStats, Inputs, Position, PriceChart } from "../components";
import styles from "../styles/Futures/Futures.module.scss";

export default function Futures(): JSX.Element {
    return (
        <main className={styles.futures}>
            <section className={styles.inputs}>
                <Inputs />
            </section>
            <section className={styles.stats}>
                <div className={styles.row}>
                    <HeadStats />
                </div>
                <div className={styles.row}>
                    <PriceChart symbol="BTCUSD" />
                </div>
                <div className={styles.positions}>
                    <Position />
                </div>
            </section>
        </main>
    );
}
