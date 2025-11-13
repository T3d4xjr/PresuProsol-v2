import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import useAuth from '../hooks/useAuth';
import styles from '../styles/Header.module.css';

const Header = () => {
  const { profile, session, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => setOpen(!open);
  const closeMenu = () => setOpen(false);

  const handleLogout = async () => {
    await signOut();
    closeMenu();
    router.push('/'); // volver al inicio
  };

  const goProtected = (href) => {
    if (!session) {
      closeMenu();
      router.push('/login?m=login-required');
      return;
    }
    closeMenu();
    router.push(href);
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo} onClick={closeMenu}>
          PresuProsol
        </Link>

        <button
          className={styles.toggleButton}
          onClick={toggleMenu}
          aria-label="Abrir menú"
        >
          <span className={`${styles.bar} ${open ? styles.barOpen : ''}`} />
          <span className={`${styles.bar} ${open ? styles.barOpen : ''}`} />
          <span className={`${styles.bar} ${open ? styles.barOpen : ''}`} />
        </button>

        <nav className={`${styles.nav} ${open ? styles.showMenu : ''}`}>
          <div className={styles.actions}>
            {profile ? (
              <>
                {/* Chip del usuario con su avatar */}
                <button
                  type="button"
                  className={styles.userChip}
                  onClick={() => goProtected('/perfil')}
                >
                  {/* Si tiene foto_url, mostramos la imagen; si no, inicial */}
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
                      {profile.usuario?.[0]?.toUpperCase() ?? 'U'}
                    </span>
                  )}

                  <span className={styles.userName}>
                    {profile.usuario ?? 'Usuario'}
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
                <Link href="/login" className={styles.login} onClick={closeMenu}>
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
  );
};

export default Header;
