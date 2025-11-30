import React, { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import Header from "../components/Header";
import styles from "../styles/Home.module.css";
import useAuth from "../hooks/useAuth";
import LoginAlert from "../components/LoginAlert"; // modal personalizado

export default function Home() {
  const router = useRouter();
  const { session, profile, loading } = useAuth(); // 👈 también profile y loading
  const [showAlert, setShowAlert] = useState(false);

  // Usuario realmente permitido (logueado y habilitado)
  const canAccess =
    !!session && !!profile && profile.habilitado !== false;

  // Animaciones de aparición
  useEffect(() => {
    const targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealIn);
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 }
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // 👇 manejador genérico para cualquier acción protegida
  const handleProtectedClick = (href) => {
    // mientras carga auth, mejor no hacer nada
    if (loading) return;

    if (!canAccess) {
      setShowAlert(true); // mostrar alerta personalizada
      return;
    }

    if (href) {
      // si es URL externa (maps), abrimos en nueva pestaña
      if (href.startsWith("http")) {
        window.open(href, "_blank", "noopener,noreferrer");
      } else {
        router.push(href);
      }
    }
  };

  return (
    <>
      <Head>
        <title>PresuProsol</title>
        <meta
          name="description"
          content="Presupuesto de persianas al instante"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className={styles.page}>
        {/* HERO */}
        <section className={`${styles.hero} ${styles.reveal}`} data-reveal>
          <div className={`${styles.heroLeft} ${styles.reveal}`} data-reveal>
            <h1 className={styles.h1}>Presupuesto de persianas al instante</h1>
            <p className={styles.lead}>
              Configura, calcula y pide tus persianas en pocos pasos.
            </p>
            <button
              className={`${styles.primaryBtn} ${styles.wiggleOnHover}`}
              onClick={() => handleProtectedClick("/presupuestador")}
            >
              Empieza tu presupuesto
            </button>
          </div>

          <div className={styles.heroRight}>
            <div className={`${styles.illustration} ${styles.floatSlow}`}>
              <Image
                src="/fabrica-pecrisur.png"
                alt="Instalaciones de Pecrisur"
                width={720}
                height={405}
                priority
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "16px",
                  objectFit: "cover",
                }}
              />
            </div>
          </div>
        </section>

        {/* SERVICIOS */}
        <section className={`${styles.services} ${styles.reveal}`} data-reveal>
          <h2 className={styles.h2}>Servicios</h2>

          <div className={styles.cards}>
            {/* 1) Mosquiteras */}
            <div className={`${styles.card} ${styles.reveal}`} data-reveal>
              <div className={styles.cardImg}>
                <Image
                  src="/assets/mosquiteras/mosquitera01.jpg"
                  alt="Mosquiteras"
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  className={`${styles.cardImgMedia} ${styles.posCenter}`}
                />
              </div>
              <h3 className={styles.h3}>Mosquiteras</h3>
              <button
                className={styles.seeMore}
                onClick={() => handleProtectedClick("/mosquiteras")}
              >
                Ver más
              </button>
            </div>

            {/* 2) Paños de persiana */}
            <div className={`${styles.card} ${styles.reveal}`} data-reveal>
              <div className={styles.cardImg}>
                <Image
                  src="/assets/panos/panoaluminio01.png"
                  alt="Paños de persiana"
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  className={`${styles.cardImgMedia} ${styles.posCenter}`}
                />
              </div>
              <h3 className={styles.h3}>Paños de persiana</h3>
              <button
                className={styles.seeMore}
                onClick={() => handleProtectedClick("/panos")}
              >
                Ver más
              </button>
            </div>

            {/* 3) Persianas compacto */}
            <div className={`${styles.card} ${styles.reveal}`} data-reveal>
              <div className={styles.cardImg}>
                <Image
                  src="/assets/persianasCompacto/compacto02.png"
                  alt="Persianas compacto"
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  className={`${styles.cardImgMedia} ${styles.posCenter}`}
                />
              </div>
              <h3 className={styles.h3}>Persianas compacto</h3>
              <button
                className={styles.seeMore}
                onClick={() => handleProtectedClick("/compactos")}
              >
                Ver más
              </button>
            </div>

            {/* 4) Protección solar */}
            <div className={`${styles.card} ${styles.reveal}`} data-reveal>
              <div className={styles.cardImg}>
                <Image
                  src="/assets/proteccionSolar/Stor-vilaluz.png"
                  alt="Protección solar"
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  className={`${styles.cardImgMedia} ${styles.posCenter}`}
                />
              </div>
              <h3 className={styles.h3}>Protección solar</h3>
              <button
                className={styles.seeMore}
                onClick={() => handleProtectedClick("/proteccion-solar")}
              >
                Ver más
              </button>
            </div>

            {/* 5) Puertas de garaje */}
            <div className={`${styles.card} ${styles.reveal}`} data-reveal>
              <div className={styles.cardImg}>
                <Image
                  src="/assets/puertasGaraje/puertaSeccional01.png"
                  alt="Puertas de garaje"
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  className={`${styles.cardImgMedia} ${styles.posCenter}`}
                />
              </div>
              <h3 className={styles.h3}>Puertas de garaje</h3>
              <button
                className={styles.seeMore}
                onClick={() => handleProtectedClick("/puertas-seccionales")}
              >
                Ver más
              </button>
            </div>

            {/* 6) Pérgola bioclimática */}
            <div className={`${styles.card} ${styles.reveal}`} data-reveal>
              <div className={styles.cardImg}>
                <Image
                  src="/assets/pergolaBioclimatica/pergola01.png"
                  alt="Pérgola bioclimática"
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  className={`${styles.cardImgMedia} ${styles.posCenter}`}
                />
              </div>
              <h3 className={styles.h3}>Pérgola bioclimática</h3>
              <button
                className={styles.seeMore}
                onClick={() => handleProtectedClick("/pergolas")}
              >
                Ver más
              </button>
            </div>
          </div>
        </section>

        {/* MAPA */}
        <section className={`${styles.find} ${styles.reveal}`} data-reveal>
          <div className={`${styles.findLeft} ${styles.reveal}`} data-reveal>
            <h2 className={styles.h2}>Encuéntranos</h2>
            <p>Visítanos o revisa nuestra ubicación en Google Maps.</p>

            <button
              className={styles.secondaryBtn}
              onClick={() =>
                handleProtectedClick(
                  "https://www.google.com/maps?q=Pecrisur+Persianas,+Córdoba,+España"
                )
              }
            >
              Ver en Google Maps
            </button>
          </div>

          <div className={`${styles.findRight} ${styles.reveal}`} data-reveal>
            <div className={`${styles.map} ${styles.floatSlow}`}>
              <iframe
                title="Ubicación de Pecrisur"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3088.5717497365224!2d-6.042024723582678!3d36.85610457220747!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd0dd80a5d4a4f63%3A0xd41a7282e7d9c203!2sPecrisur%20Persianas%20y%20Perfiles%20S.L.!5e0!3m2!1ses!2ses!4v1730059857642!5m2!1ses!2ses"
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: "12px" }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </section>
      </main>

    

      {/* Modal personalizado de acceso */}
      {showAlert && <LoginAlert onClose={() => setShowAlert(false)} />}
    </>
  );
}