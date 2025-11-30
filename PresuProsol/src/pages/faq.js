// pages/faq.js
import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { supabase } from "./api/supabaseClient";
import styles from "../styles/FAQ.module.css";

export default function FAQ() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();

  const [faqs, setFaqs] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [cargando, setCargando] = useState(true);

  const canAccess = !!session && !!profile && profile.habilitado !== false;

  // 🔒 Redirección si no tiene acceso
  useEffect(() => {
    if (loading) return;

    if (!canAccess) {
      router.replace("/login?m=login-required");
    }
  }, [loading, canAccess, router]);

  // 📚 Cargar FAQs solo cuando auth está OK
  useEffect(() => {
    if (loading || !canAccess) return;

    let cancelled = false;

    const loadFAQs = async () => {
      try {
        console.log("📚 [CARGANDO FAQs]");
        setCargando(true);

        const { data, error } = await supabase
          .from("faqs")
          .select("*")
          .eq("activo", true)
          .order("orden", { ascending: true });

        if (cancelled) return;

        if (error) {
          console.error("❌ Error cargando FAQs:", error);
          setFaqs([]);
          return;
        }

        console.log("✅ FAQs cargadas:", data?.length);
        setFaqs(data || []);
      } catch (e) {
        if (!cancelled) {
          console.error("💥 Exception cargando FAQs:", e);
          setFaqs([]);
        }
      } finally {
        if (!cancelled) {
          setCargando(false);
        }
      }
    };

    loadFAQs();
    console.log("[FAQ] auth state:", { loading, session, profile, canAccess });

    return () => {
      cancelled = true;
    };
  }, [loading, canAccess]);

  const toggleFAQ = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  // Mientras auth está cargando -> spinner general
  if (loading) {
    return (
      <>
        <Head>
          <title>Preguntas Frecuentes · PresuProsol</title>
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

  // Si NO puede acceder (y ya hemos lanzado la redirección), no pintamos nada
  if (!canAccess) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Preguntas Frecuentes · PresuProsol</title>
        <meta
          name="description"
          content="Encuentra respuestas a las preguntas más comunes sobre PresuProsol"
        />
      </Head>

      <Header />

      <main className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Preguntas Frecuentes</h1>
          <p className={styles.subtitle}>
            Encuentra respuestas rápidas a las dudas más comunes sobre nuestra plataforma
          </p>
        </div>

        <div className={styles.faqContainer}>
          {cargando ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Cargando preguntas...</p>
            </div>
          ) : faqs.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>❓</span>
              <p>No hay preguntas frecuentes disponibles en este momento</p>
            </div>
          ) : (
            <div className={styles.faqList}>
              {faqs.map((faq, index) => (
                <div
                  key={faq.id}
                  className={`${styles.faqItem} ${
                    openId === faq.id ? styles.faqItemOpen : ""
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <button
                    className={styles.faqQuestion}
                    onClick={() => toggleFAQ(faq.id)}
                    aria-expanded={openId === faq.id}
                  >
                    <span className={styles.questionText}>{faq.pregunta}</span>
                    <span className={styles.icon}>
                      {openId === faq.id ? "−" : "+"}
                    </span>
                  </button>

                  <div
                    className={`${styles.faqAnswer} ${
                      openId === faq.id ? styles.faqAnswerOpen : ""
                    }`}
                  >
                    <div className={styles.answerContent}>
                      <p>{faq.respuesta}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!cargando && faqs.length > 0 && (
          <div className={styles.contact}>
            <h3>¿No encuentras lo que buscas?</h3>
            <p>Contacta con nuestro equipo para obtener ayuda personalizada</p>
            <button
              className={styles.contactBtn}
              onClick={() => router.push("/contacto")}
            >
              Ir a Contacto
            </button>
          </div>
        )}
      </main>
    </>
  );
}
