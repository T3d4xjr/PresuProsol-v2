// src/pages/compactos/index.js
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Header from "../../components/Header";
import useAuth from "../../hooks/useAuth";

export default function Compactos() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login?m=login-required");
    }
  }, [loading, session, router]);

  const goConfig = (tipo) => {
    if (!session) {
      router.push("/login?m=login-required");
      return;
    }
    router.push(`/compactos/${tipo}`);
  };

  return (
    <>
      <Head>
        <title>Persianas Compacto · PresuProsol</title>
      </Head>

      <div className="d-flex flex-column min-vh-100">
        <Header />

        <main className="flex-grow-1">
          <section className="container py-5" style={{ maxWidth: 1200 }}>
            <div className="text-center mb-5">
              <h1
                className="mb-3"
                style={{
                  color: "var(--primary)",
                  fontSize: "clamp(28px, 3vw, 36px)",
                  fontWeight: 600,
                }}
              >
                Elige el tipo de persiana compacto
              </h1>
              <p
                className="text-muted"
                style={{ fontSize: 16, maxWidth: 620, margin: "0 auto" }}
              >
                Selecciona un tipo de sistema compacto para configurarlo y
                obtener tu precio personalizado.
              </p>
            </div>

            <div className="row g-4 justify-content-center">
              {/* Compacto PVC */}
              <div className="col-12 col-sm-6 col-lg-5">
                <div
                  className="card h-100 shadow-sm border-0"
                  style={{
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onClick={() => goConfig("pvc")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 20px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0,0,0,0.08)";
                  }}
                >
                  <div
                    style={{
                      height: 240,
                      overflow: "hidden",
                      borderRadius: "0.375rem 0.375rem 0 0",
                    }}
                  >
                    <img
                      src="/assets/persianasCompacto/compacto01.jpg"
                      alt="Compacto cajón PVC"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div className="card-body text-center">
                    <h5
                      className="card-title mb-2"
                      style={{ color: "var(--primary)", fontWeight: 600 }}
                    >
                      Compacto cajón PVC
                    </h5>
                    <p className="text-muted mb-3" style={{ fontSize: 14 }}>
                      Recto, Aislamax y Deco
                    </p>
                    <button
                      className="btn w-100"
                      style={{
                        background: "var(--accent)",
                        color: "var(--surface)",
                        border: "none",
                        fontWeight: 600,
                        padding: "0.625rem 1.25rem",
                      }}
                    >
                      Configurar →
                    </button>
                  </div>
                </div>
              </div>

              {/* Compacto Aluminio */}
              <div className="col-12 col-sm-6 col-lg-5">
                <div
                  className="card h-100 shadow-sm border-0"
                  style={{
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onClick={() => goConfig("aluminio")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 20px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0,0,0,0.08)";
                  }}
                >
                  <div
                    style={{
                      height: 240,
                      overflow: "hidden",
                      borderRadius: "0.375rem 0.375rem 0 0",
                    }}
                  >
                    <img
                      src="/assets/persianasCompacto/compacto02.png"
                      alt="Compacto cajón Aluminio"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div className="card-body text-center">
                    <h5
                      className="card-title mb-2"
                      style={{ color: "var(--primary)", fontWeight: 600 }}
                    >
                      Compacto cajón Aluminio
                    </h5>
                    <p className="text-muted mb-3" style={{ fontSize: 14 }}>
                      Perfilado, Aislabox y Extrusión
                    </p>
                    <button
                      className="btn w-100"
                      style={{
                        background: "var(--accent)",
                        color: "var(--surface)",
                        border: "none",
                        fontWeight: 600,
                        padding: "0.625rem 1.25rem",
                      }}
                    >
                      Configurar →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

      </div>
    </>
  );
}
