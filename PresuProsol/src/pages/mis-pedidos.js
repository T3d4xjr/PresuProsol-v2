import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import Header from "../components/Header";

export default function MisPedidos() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login?m=login-required");
    }
  }, [loading, session, router]);

  useEffect(() => {
    if (session?.user?.id) {
      loadPedidos();
    }
  }, [session]);

  async function loadPedidos() {
    setLoadingData(true);
    const { data, error } = await supabase
      .from("pedidos")
      .select("*, presupuestos(*)")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando pedidos:", error);
    } else {
      setPedidos(data || []);
    }
    setLoadingData(false);
  }

  if (loading || loadingData) {
    return (
      <>
        <Header />
        <main className="container py-4">
          <p>Cargando...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Mis Pedidos · PresuProsol</title>
      </Head>
      <Header />

      <main className="container py-4" style={{ maxWidth: 1200 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>📦 Mis Pedidos</h1>
          <button onClick={() => router.push("/perfil")} className="btn btn-outline-secondary">
            ← Volver
          </button>
        </div>

        {pedidos.length === 0 && (
          <div className="alert alert-info">No tienes pedidos aún</div>
        )}

        {pedidos.length > 0 && (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.id}>
                    <td>{new Date(p.created_at).toLocaleDateString()}</td>
                    <td>{p.presupuestos?.tipo || "N/A"}</td>
                    <td>
                      <span className={`badge bg-${p.estado === "En proceso" ? "warning" : "success"}`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="fw-bold">{p.total?.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

    </>
  );
}