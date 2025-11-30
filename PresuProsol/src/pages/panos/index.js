// src/pages/panos/index.js
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import { useAuth } from "../../context/AuthContext";

function TypeCard({ title, imgSrc, onClick }) {
  return (
    <div className="card h-100 shadow-sm">
      <div className="ratio ratio-16x9">
        <Image
          src={imgSrc}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 480px"
          style={{ objectFit: "cover", borderTopLeftRadius: 8, borderTopRightRadius: 8 }}
        />
      </div>
      <div className="card-body d-flex flex-column">
        <h3 className="h6 mb-3">{title}</h3>
        <button className="btn btn-accent mt-auto" onClick={onClick}>
          Configurar
        </button>
      </div>
    </div>
  );
}

export default function PanosIndex() {
  const router = useRouter();
  const { session } = useAuth();

  const go = (slug) => {
    if (!session) return router.push("/login?m=login-required");
    router.push(`/panos/${slug}`);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Head><title>Paños · PresuProsol</title></Head>
      
      <Header />

      <main className="container py-5 flex-grow-1" style={{ maxWidth: 1200 }}>
        <div className="text-center mb-5">
          <h1 className="mb-3" style={{ color: "var(--primary)", fontSize: "clamp(28px,3vw,36px)" }}>
            Elige el tipo de paño
          </h1>
          <p className="text-muted" style={{ maxWidth: 640, margin: "0 auto" }}>
            Selecciona si quieres un paño completo o comprar lamas sueltas.
          </p>
        </div>

        <div className="row g-4">
          <div className="col-12 col-md-6">
            <TypeCard
              title="Paño completo"
              imgSrc="/assets/panos/panoaluminio01.png"
              onClick={() => go("pano")}
            />
          </div>
          <div className="col-12 col-md-6">
            <TypeCard
              title="Lamas sueltas"
              imgSrc="/assets/panos/lamas-sueltas.png"
              onClick={() => go("lamas")}
            />
          </div>
        </div>
      </main>

    </div>
  );
}
