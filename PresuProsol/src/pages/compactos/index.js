// src/pages/compactos/index.js
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import CompactTypeCard from "../../components/CompactTypeCard";
import useAuth from "../../hooks/useAuth";

export default function Compactos() {
  const router = useRouter();
  const { session } = useAuth();

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
        <title>Persianas compacto · PresuProsol</title>
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
                  fontSize: "clamp(28px,3vw,36px)",
                }}
              >
                Elige el tipo de persiana compacto
              </h1>
              <p
                className="text-muted"
                style={{ fontSize: 16, maxWidth: 620, margin: "0 auto" }}
              >
                Selecciona un tipo de sistema compacto para configurarlo
                y obtener tu precio personalizado.
              </p>
            </div>

            <div className="row g-4 justify-content-center">
              {/* Compacto PVC */}
              <div className="col-12 col-sm-6 col-lg-4">
                <CompactTypeCard
                  title="Compacto cajón PVC"
                  subtitle="Recto, Aislamax y Deco"
                  imgSrc="/assets/persianasCompacto/compacto01.jpg"
                  onClick={() => goConfig("pvc")}
                />
              </div>

              {/* Compacto aluminio */}
              <div className="col-12 col-sm-6 col-lg-4">
                <CompactTypeCard
                  title="Compacto cajón aluminio"
                  subtitle="Perfilado, Aislabox y Extrusión"
                  imgSrc="/assets/persianasCompacto/compacto02.png"
                  onClick={() => goConfig("aluminio")}
                />
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
