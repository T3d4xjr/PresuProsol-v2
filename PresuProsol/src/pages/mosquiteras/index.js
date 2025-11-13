// src/pages/mosquiteras/index.js
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MosqTypeCard from "../../components/MosqTypeCard";
import useAuth from "../../hooks/useAuth";

export default function Mosquiteras() {
  const router = useRouter();
  const { session } = useAuth();

  const goConfig = (tipo) => {
    if (!session) {
      router.push("/login?m=login-required");
      return;
    }
    // 👇 ESTA ES LA RUTA CORRECTA
    router.push(`/mosquiteras/${tipo}`);
  };

  return (
    <>
      <Head>
        <title>Mosquiteras · PresuProsol</title>
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
                Elige el tipo de mosquitera
              </h1>
              <p
                className="text-muted"
                style={{ fontSize: 16, maxWidth: 620, margin: "0 auto" }}
              >
                Selecciona un tipo para configurarlo y obtener tu precio
                personalizado.
              </p>
            </div>

            <div className="row g-4 justify-content-center">
              <div className="col-12 col-sm-6 col-lg-4">
                <MosqTypeCard
                  title="Mosquitera Corredera"
                  imgSrc="/assets/mosquiteras/mosquitera01.jpg"
                  onClick={() => goConfig("corredera")}
                />
              </div>

              <div className="col-12 col-sm-6 col-lg-4">
                <MosqTypeCard
                  title="Mosquitera Fija"
                  imgSrc="/assets/mosquiteras/mosquitera02.jpg"
                  onClick={() => goConfig("fija")}
                />
              </div>

              <div className="col-12 col-sm-6 col-lg-4">
                <MosqTypeCard
                  title="Mosquitera Enrollable"
                  imgSrc="/assets/mosquiteras/mosquitera03.png"
                  onClick={() => goConfig("enrollable")}
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
