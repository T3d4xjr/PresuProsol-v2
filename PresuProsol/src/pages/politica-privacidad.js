import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { supabase } from "./api/supabaseClient";
import styles from "../styles/Politica.module.css";

export default function PoliticaPrivacidad() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();
  const [secciones, setSecciones] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Usuario realmente permitido (logueado y habilitado)
  const canAccess = !!session && !!profile && profile.habilitado !== false;

  /* 🔒 Protección */
  useEffect(() => {
    if (loading) return;

    if (!canAccess) {
      router.replace("/login?m=login-required");
    }
  }, [loading, canAccess, router]);

  /* 🔐 Cargar Política de Privacidad */
  useEffect(() => {
    const loadPolitica = async () => {
      try {
        console.log("🔐 [CARGANDO POLÍTICA DE PRIVACIDAD]");
        setCargando(true);
        
        const { data, error } = await supabase
          .from("politica_privacidad")
          .select("*")
          .eq("activo", true)
          .order("orden", { ascending: true });

        if (error) {
          console.error("❌ Error cargando política:", error);
          setSecciones([]);
          return;
        }

        console.log("✅ Política cargada:", data?.length);
        setSecciones(data || []);
      } catch (e) {
        console.error("💥 Exception cargando política:", e);
        setSecciones([]);
      } finally {
        setCargando(false);
      }
    };

    if (canAccess && !loading) {
      loadPolitica();
    }
  }, [canAccess, loading]);

  const toggleSeccion = (id) => {
    setOpenId(openId === id ? null : id);
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Política de Privacidad · PresuProsol</title>
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
        <title>Política de Privacidad · PresuProsol</title>
        <meta name="description" content="Política de privacidad y protección de datos de PresuProsol" />
      </Head>

      <Header />

      <main className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Política de Privacidad</h1>
          <p className={styles.subtitle}>
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className={styles.intro}>
            En PresuProsol nos tomamos muy en serio la protección de tus datos personales.
            Esta política explica cómo recopilamos, usamos y protegemos tu información.
          </p>
        </div>

        <div className={styles.politicaContainer}>
          {cargando ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Cargando política de privacidad...</p>
            </div>
          ) : secciones.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🔐</span>
              <p>No hay información de política de privacidad disponible</p>
            </div>
          ) : (
            <div className={styles.seccionesList}>
              {secciones.map((seccion, index) => (
                <div
                  key={seccion.id}
                  className={`${styles.seccionItem} ${openId === seccion.id ? styles.seccionItemOpen : ""}`}
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

                  <div className={`${styles.seccionContenido} ${openId === seccion.id ? styles.seccionContenidoOpen : ""}`}>
                    <div className={styles.contenidoText}>
                      <p style={{ whiteSpace: 'pre-line' }}>{seccion.contenido}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!cargando && secciones.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.footerHighlight}>
              <h3>Tus derechos están protegidos</h3>
              <p>
                Tienes derecho a acceder, rectificar, suprimir, limitar el tratamiento,
                oponerte al tratamiento y a la portabilidad de tus datos personales.
              </p>
            </div>
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