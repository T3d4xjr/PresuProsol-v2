import React from 'react';
import Link from 'next/link';
import styles from '../styles/Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.links}>
          <Link href="/contacto">Contacto</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/terminos">Términos</Link>
          <Link href="/privacidad">Política de Privacidad</Link>
        </div>

        <div className={styles.copy}>
          © {new Date().getFullYear()} PresuProsol. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
