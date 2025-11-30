// src/pages/pergolas/index.js
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Header from "../../components/Header";
import { useAuth } from "../../context/AuthContext";

export default function PergolaIndex() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login?m=login-required");
    }
  }, [loading, session, router]);

  return (
    <>
      <Head>
        <title>Pérgolas Bioclimáticas · PresuProsol</title>
      </Head>

      <div className="d-flex flex-column min-vh-100">
        <Header />

        <main className="container flex-fill py-4" style={{ maxWidth: 980 }}>
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-2">
            <h1 className="h3 m-0">Pérgolas Bioclimáticas</h1>
            <button
              className="btn btn-outline-secondary ms-md-3"
              onClick={() => router.push("/")}
            >
              ← Volver al inicio
            </button>
          </div>

          <div className="row justify-content-center">
            <div className="col-12 col-lg-10">
              <div
                className="card shadow-sm h-100"
                style={{ cursor: "pointer", transition: "transform 0.2s" }}
                onClick={() => router.push("/pergolas/bioclimatica")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div className="row g-0 flex-column flex-md-row">
                  <div className="col-12 col-md-4">
                    <img
                      src="/assets/pergolaBioclimatica/pergola01.png"
                      alt="Pérgola Bioclimática"
                      className="img-fluid rounded-top rounded-md-start"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        minHeight: "200px",
                      }}
                    />
                  </div>
                  <div className="col-12 col-md-8">
                    <div className="card-body p-3 p-md-4 d-flex flex-column h-100">
                      <h5 className="card-title mb-3">
                        Pérgola Bioclimática
                      </h5>
                      <p className="card-text text-muted mb-3">
                        Configura tu pérgola bioclimática personalizada con
                        lamas orientables de aluminio. Sistema de alto
                        rendimiento que te permite controlar la luz y la
                        ventilación.
                      </p>
                      <div className="mb-3">
                        <small className="text-muted">
                          ✓ Lamas orientables de aluminio
                          <br />
                          ✓ Control de luz y ventilación
                          <br />
                          ✓ Resistente a la intemperie
                        </small>
                      </div>
                      <div className="mt-auto">
                        <button
                          className="btn w-100 w-md-auto"
                          style={{
                            background: "var(--accent)",
                            color: "var(--surface)",
                            fontWeight: 600,
                          }}
                        >
                          Configurar pérgola →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="alert alert-info mt-4">
            <strong>ℹ️ Información:</strong> Las pérgolas bioclimáticas
            requieren un presupuesto mínimo de <strong>2.500 €</strong>.
          </div>
        </main>

      </div>
    </>
  );
}
