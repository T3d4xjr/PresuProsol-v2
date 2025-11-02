import React, { useState } from 'react';
import Link from 'next/link';
import styles from '../styles/Header.module.css';

const Header = () => {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => setOpen(!open);
  const closeMenu = () => setOpen(false);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logo} onClick={closeMenu}>
          PresuProsol
        </Link>

        {/* Botón Hamburguesa (solo móvil) */}
        <button
          className={styles.toggleButton}
          onClick={toggleMenu}
          aria-label="Abrir menú"
        >
          <span className={`${styles.bar} ${open ? styles.barOpen : ''}`}></span>
          <span className={`${styles.bar} ${open ? styles.barOpen : ''}`}></span>
          <span className={`${styles.bar} ${open ? styles.barOpen : ''}`}></span>
        </button>

        {/* Navegación */}
        <nav className={`${styles.nav} ${open ? styles.showMenu : ''}`}>
         

          <div className={styles.actions}>
            <Link href="/login" className={styles.login} onClick={closeMenu}>
              Iniciar sesión
            </Link>
            <Link href="/registro" className={styles.signup} onClick={closeMenu}>
              Soliccitar acceso
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
