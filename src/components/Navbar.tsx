import { useState } from "react";
import dragoswap_logo from "../assets/images/dragoswap_logo.png";
import styles from "../styles/Navbar.module.scss";

export default function Navbar(): JSX.Element {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className={styles.nav}>
            <div className={`${styles.nav__part} ${styles.nav__logo}`}>
                <a href="/" className={styles.logo__link}>
                </a>
            </div>
            <div className={styles.nav__part}>
                <div className={styles.nav__links}>
                    <a href="/" className={styles.nav__link}>
                        Personal
                    </a>
                    <a href="/" className={styles.nav__link}>
                        Business
                    </a>
                    <a href="/" className={styles.nav__link}>
                        Blog
                    </a>
                    <a href="/" className={styles.nav__link}>
                        How it works
                    </a>
                    <a href="/" className={styles.nav__link}>
                        FAQ
                    </a>
                    <a href="/" className={styles.nav__link}>
                        Support
                    </a>
                </div>
            </div>
            <button className={styles.nav__mobile__button} onClick={toggleMenu}>
                {!isMenuOpen ? (
                    "O"
                ) : (
                    "X"
                )}
            </button>
            <div
                className={`${styles.nav__mobile__menu} ${
                    isMenuOpen ? styles.nav__mobile__menu__open : ""
                }`}
            >
                <div className={styles.nav__mobile__menu__links}>
                    <a href="/" className={styles.nav__mobile__menu__link}>
                        Personal
                    </a>
                    <a href="/" className={styles.nav__mobile__menu__link}>
                        Business
                    </a>
                    <a href="/" className={styles.nav__mobile__menu__link}>
                        Blog
                    </a>
                    <a href="/" className={styles.nav__mobile__menu__link}>
                        How it works
                    </a>
                    <a href="/" className={styles.nav__mobile__menu__link}>
                        FAQ
                    </a>
                    <a href="/" className={styles.nav__mobile__menu__link}>
                        Support
                    </a>
                </div>
            </div>
        </nav>
    );
}
