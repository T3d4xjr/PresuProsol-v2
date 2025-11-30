// src/pages/admin/pedidos.js
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import Header from "../../components/Header";

// 👉 Email de pedido enviado
import { enviarAvisoPedidoEnviado } from "../../lib/emailNotifications";

export default function AdminPedidos() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && (!session || profile?.rol !== "admin")) {
      router.replace("/perfil");
    }
  }, [loading, session, profile, router]);

  useEffect(() => {
    if (profile?.rol === "admin") {
      loadPedidos();
    }
  }, [profile]);

  async function loadPedidos() {
    setLoadingData(true);

    try {
      console.log("🔍 Cargando pedidos...");

      const { data: pedidosData, error: pedidosError } = await supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false });

      if (pedidosError) {
        console.error("❌ Error cargando pedidos:", pedidosError);
        setPedidos([]);
        setLoadingData(false);
        return;
      }

      if (!pedidosData || pedidosData.length === 0) {
        setPedidos([]);
        setLoadingData(false);
        return;
      }

      const pedidosConDatos = await Promise.all(
        pedidosData.map(async (pedido) => {
          const { data: usuarioData } = await supabase
            .from("usuarios")
            .select("usuario, email")
            .eq("id", pedido.user_id)
            .single();

          const { data: presupuestoData } = await supabase
            .from("presupuestos")
            .select("tipo, total, color")
            .eq("id", pedido.presupuesto_id)
            .single();

          return {
            ...pedido,
            usuario_nombre: usuarioData?.usuario || "Usuario desconocido",
            usuario_email: usuarioData?.email || "N/A",
            presupuesto_tipo: presupuestoData?.tipo || "N/A",
          };
        })
      );

      console.log("✅ Pedidos con datos completos:", pedidosConDatos);
      setPedidos(pedidosConDatos);
    } catch (error) {
      console.error("❌ Error inesperado:", error);
      setPedidos([]);
    }

    setLoadingData(false);
  }

  // 🔄 Cambiar estado y, si pasa a "Enviando", enviar email al cliente
  async function cambiarEstado(id, nuevoEstado) {
    console.log(`🔄 Cambiando estado del pedido ${id} a: ${nuevoEstado}`);

    // Buscar pedido en memoria para obtener email y nombre
    const pedido = pedidos.find((p) => p.id === id);

    const { error } = await supabase
      .from("pedidos")
      .update({ estado: nuevoEstado })
      .eq("id", id);

    if (error) {
      console.error("❌ Error actualizando estado:", error);
      alert("Error actualizando estado: " + error.message);
    } else {
      console.log("✅ Estado actualizado correctamente");

      // 📧 Solo cuando pasa a "Enviando"
      if (nuevoEstado === "Enviando" && pedido) {
        enviarAvisoPedidoEnviado({
          email: pedido.usuario_email,
          nombre: pedido.usuario_nombre,
        });
      }

      loadPedidos(); // Recargar la lista
    }
  }

  if (loading || loadingData) {
    return (
      <>
        <Header />
        <main className="container py-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3 text-muted">Cargando pedidos...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Gestión de Pedidos · PresuProsol</title>
      </Head>
      <Header />

      <main className="container py-4" style={{ maxWidth: 1400 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>🚚 Gestión de Pedidos</h1>
          <button
            onClick={() => router.push("/perfil")}
            className="btn btn-outline-secondary"
          >
            ← Volver al Perfil
          </button>
        </div>

        {pedidos.length === 0 && (
          <div className="alert alert-info">
            <strong>ℹ️ No hay pedidos registrados</strong>
            <p className="mb-0 mt-2 small">
              Los pedidos aparecerán aquí cuando los clientes paguen sus
              presupuestos.
            </p>
          </div>
        )}

        {pedidos.length > 0 && (
          <>
            <div className="alert alert-success mb-3">
              <strong>📊 Total de pedidos:</strong> {pedidos.length}
            </div>

            <div className="table-responsive">
              <table className="table table-hover table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {new Date(p.created_at).toLocaleDateString("es-ES")}
                      </td>
                      <td>
                        <div className="fw-semibold">{p.usuario_nombre}</div>
                        <small className="text-muted">{p.usuario_email}</small>
                      </td>
                      <td>
                        <span className="badge bg-info text-dark">
                          {p.presupuesto_tipo}
                        </span>
                      </td>
                      <td className="fw-bold text-success">
                        {p.total?.toFixed(2)} €
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            p.estado === "En proceso"
                              ? "bg-warning text-dark"
                              : p.estado === "Enviando"
                              ? "bg-primary"
                              : "bg-success"
                          }`}
                        >
                          {p.estado}
                        </span>
                      </td>
                      <td>
                        {p.estado === "En proceso" && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => cambiarEstado(p.id, "Enviando")}
                          >
                            📤 Marcar como Enviando
                          </button>
                        )}
                        {p.estado === "Enviando" && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => cambiarEstado(p.id, "Entregado")}
                          >
                            ✅ Marcar como Entregado
                          </button>
                        )}
                        {p.estado === "Entregado" && (
                          <span className="text-success fw-semibold">
                            ✅ Completado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

    </>
  );
}
