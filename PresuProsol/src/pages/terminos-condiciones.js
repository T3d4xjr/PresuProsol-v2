import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { fetchTerminosActivos } from "./api/terminos";
import styles from "../styles/Terminos.module.css";

export default function TerminosCondiciones() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();
  const [secciones, setSecciones] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [cargando, setCargando] = useState(true);

  const canAccess = !!session && !!profile && profile.habilitado !== false;

  useEffect(() => {
    if (loading) return;

    if (!canAccess) {
      router.replace("/login?m=login-required");
    }
  }, [loading, canAccess, router]);

  useEffect(() => {
    const loadTerminos = async () => {
      try {
        setCargando(true);
        const data = await fetchTerminosActivos();
        console.log("✅ Términos cargados:", data?.length);
        setSecciones(data);
      } catch (e) {
        console.error("💥 Exception cargando términos:", e);
        setSecciones([]);
      } finally {
        setCargando(false);
      }
    };

    if (canAccess && !loading) {
      loadTerminos();
    }
  }, [canAccess, loading]);

  const toggleSeccion = (id) => {
    setOpenId(openId === id ? null : id);
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Términos y Condiciones · PresuProsol</title>
        </Head>
        <Header />
        <main className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Cargando...</p>
          </div>
        </main>
      </>
    );
  }

  if (!canAccess) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Términos y Condiciones · PresuProsol</title>
        <meta
          name="description"
          content="Términos y condiciones de uso de PresuProsol"
        />
      </Head>

      <Header />

      <main className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Términos y Condiciones</h1>
          <p className={styles.subtitle}>
            Última actualización:{" "}
            {new Date().toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className={styles.terminosContainer}>
          {cargando ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Cargando términos y condiciones...</p>
            </div>
          ) : secciones.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>📄</span>
              <p>No hay términos y condiciones disponibles en este momento</p>
            </div>
          ) : (
            <div className={styles.seccionesList}>
              {secciones.map((seccion, index) => (
                <div
                  key={seccion.id}
                  className={`${styles.seccionItem} ${
                    openId === seccion.id ? styles.seccionItemOpen : ""
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <button
                    className={styles.seccionTitulo}
                    onClick={() => toggleSeccion(seccion.id)}
                    aria-expanded={openId === seccion.id}
                  >
                    <span className={styles.numero}>{index + 1}.</span>
                    <span className={styles.tituloText}>{seccion.titulo}</span>
                    <span className={styles.icon}>
                      {openId === seccion.id ? "−" : "+"}
                    </span>
                  </button>

                  <div
                    className={`${styles.seccionContenido} ${
                      openId === seccion.id
                        ? styles.seccionContenidoOpen
                        : ""
                    }`}
                  >
                    <div className={styles.contenidoText}>
                      <p style={{ whiteSpace: "pre-line" }}>
                        {seccion.contenido}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!cargando && secciones.length > 0 && (
          <div className={styles.footer}>
            <p className={styles.footerText}>
              Al utilizar PresuProsol, aceptas estos términos y condiciones en
              su totalidad. Si tienes alguna duda, por favor contacta con
              nuestro equipo.
            </p>
            <button
              className={styles.contactBtn}
              onClick={() => router.push("/contacto")}
            >
              Contactar
            </button>
          </div>
        )}
      </main>
    </>
  );
}
