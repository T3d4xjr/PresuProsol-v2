// src/pages/proteccion-solar/index.js
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import useAuth from "../../hooks/useAuth";

function TypeCard({ title, imgSrc, onClick, objectFit = "cover" }) {
  return (
    <div className="card h-100 shadow-sm">
      <div className="ratio ratio-16x9" style={{ background: "#f8f9fa" }}>
        <Image
          src={imgSrc}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 480px"
          style={{ 
            objectFit: objectFit,
            borderTopLeftRadius: 8, 
            borderTopRightRadius: 8 
          }}
        />
      </div>
      <div className="card-body d-flex flex-column">
        <h3 className="h6 mb-3">{title}</h3>
        <button
          className="btn mt-auto"
          onClick={onClick}
          style={{
            background: "var(--accent)",
            color: "var(--surface)",
            fontWeight: 600,
            border: "none",
          }}
        >
          Configurar
        </button>
      </div>
    </div>
  );
}

export default function ProteccionSolarIndex() {
  const router = useRouter();
  const { session } = useAuth();

  const go = (tipo) => {
    if (!session) return router.push("/login?m=login-required");
    router.push(`/proteccion-solar/${tipo}`);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Head><title>Protección Solar · PresuProsol</title></Head>
      
      <Header />

      <main className="container py-5 flex-grow-1" style={{ maxWidth: 1200 }}>
        <div className="text-center mb-5">
          <h1 className="mb-3" style={{ color: "var(--primary)", fontSize: "clamp(28px,3vw,36px)" }}>
            Elige el tipo de protección solar
          </h1>
          <p className="text-muted" style={{ maxWidth: 640, margin: "0 auto" }}>
            Selecciona el tipo de toldo o screen que necesitas configurar.
          </p>
        </div>

        <div className="row g-4">
          <div className="col-12 col-md-6 col-lg-4">
            <TypeCard
              title="Stor-disaluz"
              imgSrc="/assets/proteccionSolar/Stor-disaluz.jpg"
              onClick={() => go("Stor-disaluz")}
              objectFit="contain"
            />
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <TypeCard
              title="Stor-vilaluz"
              imgSrc="/assets/proteccionSolar/Stor-vilaluz.png"
              onClick={() => go("Stor-vilaluz")}
              objectFit="contain"
            />
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <TypeCard
              title="Ventuszip01"
              imgSrc="/assets/proteccionSolar/ventuszip01.jpg"
              onClick={() => go("ventuszip01")}
              objectFit="cover"
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}