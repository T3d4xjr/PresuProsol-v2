import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function PagoExitoso() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/mis-pedidos");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <>
      <Head>
        <title>Pago Exitoso · PresuProsol</title>
      </Head>
      <Header />

      <main className="container py-5">
        <div className="text-center">
          <div className="card shadow-sm mx-auto" style={{ maxWidth: 600 }}>
            <div className="card-body p-5">
              <div className="mb-4">
                <span style={{ fontSize: 80 }}>✅</span>
              </div>
              <h1 className="h3 mb-3">¡Pago realizado con éxito!</h1>
              <p className="text-muted mb-4">
                Tu pedido ha sido confirmado y será procesado pronto.
              </p>
              <p className="text-muted small">
                Redirigiendo a Mis Pedidos en 3 segundos...
              </p>
              <button
                className="btn btn-primary mt-3"
                onClick={() => router.push("/mis-pedidos")}
              >
                Ver mis pedidos
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}