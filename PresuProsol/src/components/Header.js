// src/components/Header.js
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import LoginAlert from "./LoginAlert";
import styles from "../styles/Header.module.css";

const Header = () => {
  const { profile, session, signOut, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const router = useRouter();

  const toggleMenu = () => setOpen((prev) => !prev);
  const closeMenu = () => setOpen(false);

  // Usuario realmente permitido (logueado y habilitado)
  const canAccess = !!session && !!profile && profile.habilitado !== false;

  const handleLogout = async () => {
    await signOut();
    closeMenu();
    router.push("/");
  };

  const handleProtectedClick = (href) => {
    // mientras carga auth, mejor no hacer nada
    if (loading) return;

    if (!canAccess) {
      closeMenu();
      setShowAlert(true); // mostrar alerta personalizada
      return;
    }

    closeMenu();
    if (href) {
      router.push(href);
    }
  };

  return (
    <>
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
            <span className={`${styles.bar} ${open ? styles.barOpen : ""}`} />
            <span className={`${styles.bar} ${open ? styles.barOpen : ""}`} />
            <span className={`${styles.bar} ${open ? styles.barOpen : ""}`} />
          </button>

          {/* Overlay oscuro (solo mobile) */}
          <div
            className={`${styles.overlay} ${open ? styles.overlayVisible : ""}`}
            onClick={closeMenu}
          />

          {/* Navegación */}
          <nav className={`${styles.nav} ${open ? styles.showMenu : ""}`}>
            {/* Enlaces de información */}
            <div className={styles.infoLinks}>
              <button
                type="button"
                className={styles.link}
                onClick={() => handleProtectedClick("/faq")}
              >
                FAQ
              </button>
              <button
                type="button"
                className={styles.link}
                onClick={() => handleProtectedClick("/terminos-condiciones")}
              >
                Términos
              </button>
              <button
                type="button"
                className={styles.link}
                onClick={() => handleProtectedClick("/politica-privacidad")}
              >
                Política
              </button>
              <button
                type="button"
                className={styles.link}
                onClick={() => handleProtectedClick("/contacto")}
              >
                Contacto
              </button>
            </div>

            {/* Acciones de usuario */}
            <div className={styles.actions}>
              {profile ? (
                <>
                  {/* Chip del usuario con su avatar */}
                  <button
                    type="button"
                    className={styles.userChip}
                    onClick={() => handleProtectedClick("/perfil")}
                  >
                    {profile.foto_url ? (
                      <div className={styles.avatarImgWrapper}>
                        <Image
                          src={profile.foto_url}
                          alt="Avatar del usuario"
                          width={36}
                          height={36}
                          className={styles.avatarImg}
                        />
                      </div>
                    ) : (
                      <span className={styles.avatar}>
                        {profile.usuario?.[0]?.toUpperCase() ?? "U"}
                      </span>
                    )}

                    <span className={styles.userName}>
                      {profile.usuario ?? "Usuario"}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={styles.logoutBtn}
                    onClick={handleLogout}
                  >
                    Salir
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={styles.login}
                    onClick={closeMenu}
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/registro"
                    className={styles.signup}
                    onClick={closeMenu}
                  >
                    Solicitar acceso
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Modal personalizado de acceso */}
      {showAlert && <LoginAlert onClose={() => setShowAlert(false)} />}
    </>
  );
};

export default Header;
