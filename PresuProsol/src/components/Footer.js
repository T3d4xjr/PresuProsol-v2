import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import LoginAlert from "./LoginAlert";
import styles from "../styles/Footer.module.css";

const Footer = () => {
  const { session, profile } = useAuth();
  const router = useRouter();
  const [showAlert, setShowAlert] = useState(false);

  const canAccess =
    !!session && !!profile && profile.habilitado !== false;

  const handleProtectedClick = (e, href) => {
    if (!canAccess) {
      e.preventDefault();
      setShowAlert(true);
      return;
    }
    router.push(href);
  };

  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.inner}>
          <div className={styles.links}>
            <Link href="/contacto" onClick={(e) => handleProtectedClick(e, "/contacto")}>
              Contacto
            </Link>
            <Link href="/faq" onClick={(e) => handleProtectedClick(e, "/faq")}>
              FAQ
            </Link>
            <Link href="/terminos" onClick={(e) => handleProtectedClick(e, "/terminos")}>
              Términos
            </Link>
            <Link
              href="/privacidad"
              onClick={(e) => handleProtectedClick(e, "/privacidad")}
            >
              Política de Privacidad
            </Link>
          </div>

          <div className={styles.copy}>
            © {new Date().getFullYear()} PresuProsol. Todos los derechos reservados.
          </div>
        </div>
      </footer>

      {showAlert && <LoginAlert onClose={() => setShowAlert(false)} />}
    </>
  );
};

export default Footer;
