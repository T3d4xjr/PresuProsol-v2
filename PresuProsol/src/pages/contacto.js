import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import styles from "../styles/Contacto.module.css";

export default function Contacto() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    asunto: "",
    mensaje: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Protección de acceso
  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login?m=login-required");
    }
  }, [loading, session, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje("");

    try {
      // Validación básica
      if (!formData.mensaje) {
        setMensaje("❌ Por favor escribe un mensaje");
        setEnviando(false);
        return;
      }

      const emailData = {
        to: "presuprosol@gmail.com",
        subject: formData.asunto || "Mensaje de contacto desde PresuProsol",
        usuario: profile?.usuario || "Usuario sin nombre",
        email: profile?.email || session?.user?.email,
        mensaje: formData.mensaje,
      };

      console.log("📧 [CONTACTO] Enviando email:", emailData);

      // Llamar a la API route para enviar email
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Error del servidor:", errorData);
        throw new Error(errorData.error || "Error al enviar el email");
      }

      setMensaje("✅ Mensaje enviado correctamente. Te contactaremos pronto.");
      
      // Limpiar formulario
      setFormData({
        asunto: "",
        mensaje: "",
      });

      setTimeout(() => {
        setMensaje("");
      }, 5000);
    } catch (error) {
      console.error("❌ Error enviando mensaje:", error);
      setMensaje("❌ Error al enviar el mensaje. Por favor, intenta contactarnos directamente por email.");
    } finally {
      setEnviando(false);
    }
  };

  if (loading || !session) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Contacto · PresuProsol</title>
        <meta name="description" content="Contacta con el equipo de PresuProsol" />
      </Head>

      <Header />

      <main className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Contáctanos</h1>
          <p className={styles.subtitle}>
            Estamos aquí para ayudarte. Envíanos tu consulta y te responderemos lo antes posible.
          </p>
        </div>

        <div className={styles.content}>
          <div className={styles.infoSection}>
            <div className={styles.infoCard}>
              <div className={styles.iconWrapper}>
                <span className={styles.icon}>📧</span>
              </div>
              <h3>Email</h3>
              <a href="mailto:presuprosol@gmail.com" className={styles.link}>
                presuprosol@gmail.com
              </a>
              <p className={styles.infoText}>Respuesta en menos de 24 horas</p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.iconWrapper}>
                <span className={styles.icon}>📍</span>
              </div>
              <h3>Ubicación</h3>
              <p className={styles.link}>Sevilla, España</p>
              <p className={styles.infoText}>Servicio a nivel nacional</p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.iconWrapper}>
                <span className={styles.icon}>⏰</span>
              </div>
              <h3>Horario</h3>
              <p className={styles.link}>Lunes a Viernes</p>
              <p className={styles.infoText}>7:00 - 15:00 </p>
            </div>
          </div>

          <div className={styles.formSection}>
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>Envíanos un mensaje</h2>
              
              <div className={styles.userInfo}>
                <div className={styles.userInfoRow}>
                  <span className={styles.userIcon}>👤</span>
                  <div className={styles.userInfoContent}>
                    <p className={styles.userInfoLabel}>Usuario</p>
                    <p className={styles.userInfoValue}>{profile?.usuario || "Sin nombre"}</p>
                  </div>
                </div>
                <div className={styles.userInfoRow}>
                  <span className={styles.userIcon}>📧</span>
                  <div className={styles.userInfoContent}>
                    <p className={styles.userInfoLabel}>Email de contacto</p>
                    <p className={styles.userInfoValue}>{profile?.email || session?.user?.email}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="asunto" className={styles.label}>
                    Asunto
                  </label>
                  <input
                    type="text"
                    id="asunto"
                    name="asunto"
                    value={formData.asunto}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="¿En qué podemos ayudarte?"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="mensaje" className={styles.label}>
                    Mensaje <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleChange}
                    className={styles.textarea}
                    placeholder="Escribe tu consulta aquí..."
                    rows={8}
                    required
                  />
                </div>

                {mensaje && (
                  <div
                    className={`${styles.mensaje} ${
                      mensaje.startsWith("✅") ? styles.mensajeExito : styles.mensajeError
                    }`}
                  >
                    {mensaje}
                  </div>
                )}

                <button type="submit" className={styles.submitBtn} disabled={enviando}>
                  {enviando ? (
                    <>
                      <span className={styles.spinner}></span>
                      Enviando mensaje...
                    </>
                  ) : (
                    <>
                      <span>📤</span> Enviar mensaje
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className={styles.faqPrompt}>
          <h3>¿Tienes dudas frecuentes?</h3>
          <p>Consulta nuestra sección de preguntas frecuentes antes de contactarnos</p>
          <button className={styles.faqBtn} onClick={() => router.push("/faq")}>
            Ir a FAQ
          </button>
        </div>
      </main>
    </>
  );
}