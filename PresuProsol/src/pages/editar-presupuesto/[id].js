// src/pages/editar-presupuesto/[id].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import useAuth from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

// Importar componentes de productos
import CompactosForm from "../../components/productos/compactos";
import MosquiterasForm from "../../components/productos/mosquiteras";
import PanosForm from "../../components/productos/panos";
import ProteccionSolarForm from "../../components/productos/proteccion-solar";
import PuertasForm from "../../components/productos/puertas";
import PergolasForm from "../../components/productos/pergolas";

const TIPOS_PRODUCTOS = [
  { 
    id: "compacto", 
    nombre: "Compactos", 
    componente: CompactosForm, 
    match: ["compacto"] 
  },
  { 
    id: "mosquitera", 
    nombre: "Mosquiteras", 
    componente: MosquiterasForm, 
    match: ["mosquitera", "enrollable", "plisada", "corredera", "fija", "abatible", "lateral"] 
  },
  { 
    id: "pano", 
    nombre: "Paños", 
    componente: PanosForm, 
    match: ["paño", "pano", "completo", "lamas"]
  },
  { 
    id: "proteccion-solar", 
    nombre: "Protección Solar", 
    componente: ProteccionSolarForm, 
    match: ["proteccion-solar", "proteccion", "solar", "ventuszip01", "stor-disaluz", "stor-vilaluz"] 
  },
  { 
    id: "puerta-seccional", 
    nombre: "Puertas Seccionales", 
    componente: PuertasForm, 
    match: ["puerta-seccional", "puerta", "seccional", "residencial", "industrial"] 
  },
  { 
    id: "pergola-bioclimatica", 
    nombre: "Pérgola Bioclimática", 
    componente: PergolasForm, 
    match: ["pergola-bioclimatica", "pergola", "bioclimatica"] 
  },
];

export default function EditarPresupuesto() {
  const router = useRouter();
  const { id } = router.query;
  const { session, loading: authLoading } = useAuth();

  const [presupuesto, setPresupuesto] = useState(null);
  const [tipoProducto, setTipoProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    if (!authLoading && !session) {
      router.replace("/login?m=login-required");
      return;
    }

    if (id && session?.user?.id) {
      cargarPresupuesto();
    }
  }, [id, session, authLoading]);

  async function cargarPresupuesto() {
    setLoading(true);
    try {
      console.log("🔍 Cargando presupuesto ID:", id);

      const { data, error } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("id", id)
        .eq("user_id", session.user.id)
        .single();

      if (error) {
        console.error("❌ Error cargando presupuesto:", error);
        setMensajeError("No se pudo cargar el presupuesto. Por favor, inténtalo de nuevo.");
        setMostrarModalError(true);
        setTimeout(() => router.push("/mis-presupuestos"), 3000);
        return;
      }

      if (!data) {
        setMensajeError("El presupuesto que buscas no existe o no tienes permiso para editarlo.");
        setMostrarModalError(true);
        setTimeout(() => router.push("/mis-presupuestos"), 3000);
        return;
      }

      if (data.pagado) {
        setMensajeError("No puedes editar un presupuesto que ya ha sido marcado como pagado.");
        setMostrarModalError(true);
        setTimeout(() => router.push("/mis-presupuestos"), 3000);
        return;
      }

      console.log("✅ Presupuesto cargado:", data);
      setPresupuesto(data);

      const tipoPresupuesto = (data.tipo || "").toLowerCase();
      console.log("   Tipo detectado:", tipoPresupuesto);

      const tipoEncontrado = TIPOS_PRODUCTOS.find((t) =>
        t.match.some((m) => tipoPresupuesto.includes(m))
      );

      if (tipoEncontrado) {
        console.log("✅ Tipo de producto:", tipoEncontrado.nombre);
        setTipoProducto(tipoEncontrado);
      } else {
        console.warn("⚠️ Tipo de producto no reconocido:", tipoPresupuesto);
        setMensajeError(`El tipo de presupuesto "${data.tipo}" aún no está disponible para edición. Pronto estará disponible.`);
        setMostrarModalError(true);
        setTimeout(() => router.push("/mis-presupuestos"), 3000);
      }
    } catch (error) {
      console.error("💥 Error inesperado:", error);
      setMensajeError("Ocurrió un error inesperado al cargar el presupuesto. Por favor, contacta con soporte.");
      setMostrarModalError(true);
      setTimeout(() => router.push("/mis-presupuestos"), 3000);
    } finally {
      setLoading(false);
    }
  }

  async function handleGuardarPresupuesto(datosPresupuesto) {
    setGuardando(true);
    try {
      console.log("💾 Guardando cambios:", datosPresupuesto);

      const updateData = {
        cliente: datosPresupuesto.cliente,
        email: datosPresupuesto.email,
        cif: datosPresupuesto.cif,
        alto_mm: datosPresupuesto.alto_mm,
        ancho_mm: datosPresupuesto.ancho_mm,
        color: datosPresupuesto.color,
        medida_precio: datosPresupuesto.medida_precio || 0,
        accesorios: datosPresupuesto.accesorios || [],
        subtotal: datosPresupuesto.subtotal || 0,
        descuento_cliente: datosPresupuesto.descuento_cliente || 0,
        total: datosPresupuesto.total || 0,
        updated_at: new Date().toISOString(),
      };

      // Agregar color_precio solo si existe (mosquiteras)
      if (datosPresupuesto.color_precio !== undefined) {
        updateData.color_precio = datosPresupuesto.color_precio || 0;
      }

      const { error } = await supabase
        .from("presupuestos")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", session.user.id);

      if (error) {
        console.error("❌ Error guardando:", error);
        setMensajeError("No se pudieron guardar los cambios. Por favor, verifica los datos e inténtalo de nuevo.");
        setMostrarModalError(true);
        return;
      }

      console.log("✅ Presupuesto actualizado");
      setMostrarModalExito(true);
      
      setTimeout(() => {
        router.push("/mis-presupuestos");
      }, 2000);
    } catch (error) {
      console.error("💥 Error inesperado guardando:", error);
      setMensajeError("Ocurrió un error inesperado al guardar. Por favor, contacta con soporte si el problema persiste.");
      setMostrarModalError(true);
    } finally {
      setGuardando(false);
    }
  }

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <main className="container py-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3">Cargando presupuesto...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!presupuesto || !tipoProducto) {
    return null;
  }

  const FormularioProducto = tipoProducto.componente;

  return (
    <>
      <Head>
        <title>Editar Presupuesto · PresuProsol</title>
      </Head>
      <Header />

      <main className="container py-4" style={{ maxWidth: 1000 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>✏️ Editar Presupuesto</h1>
          <button
            onClick={() => router.push("/mis-presupuestos")}
            className="btn btn-outline-secondary"
            disabled={guardando}
          >
            ← Cancelar
          </button>
        </div>

        <div className="alert alert-info mb-4">
          <h6 className="mb-2">📋 Información del presupuesto</h6>
          <p className="mb-1">
            <strong>ID:</strong> {presupuesto.id.substring(0, 8)}...
          </p>
          <p className="mb-1">
            <strong>Creado:</strong>{" "}
            {new Date(presupuesto.created_at).toLocaleDateString("es-ES")}
          </p>
          <p className="mb-1">
            <strong>Tipo:</strong>{" "}
            <span className="badge bg-primary">{tipoProducto.nombre}</span>
          </p>
          <p className="mb-0">
            <strong>Cliente:</strong> {presupuesto.cliente || "Sin nombre"}
          </p>
        </div>

        <div className="card">
          <div className="card-body">
            <h5 className="card-title mb-4">
              Modificar datos de {tipoProducto.nombre}
            </h5>
            <FormularioProducto
              datosIniciales={presupuesto}
              onSubmit={handleGuardarPresupuesto}
              guardando={guardando}
              modoEdicion={true}
            />
          </div>
        </div>
      </main>

      {/* Modal de éxito */}
      {mostrarModalExito && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center py-5">
                <div
                  className="mb-4"
                  style={{
                    width: 100,
                    height: 100,
                    margin: "0 auto",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: "scaleIn 0.5s ease-out",
                  }}
                >
                  <svg
                    width="60"
                    height="60"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ animation: "checkDraw 0.5s ease-out 0.3s forwards", strokeDasharray: 50, strokeDashoffset: 50 }}
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>

                <h3 className="mb-3" style={{ color: "#2c3e50", fontWeight: 700 }}>
                  ¡Presupuesto Actualizado!
                </h3>
                
                <p className="text-muted mb-4" style={{ fontSize: 16 }}>
                  Los cambios se han guardado correctamente
                </p>

                <div className="alert alert-light border mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted">Cliente:</span>
                    <strong>{presupuesto.cliente || "Sin nombre"}</strong>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted">Tipo:</span>
                    <strong className="text-capitalize">{tipoProducto.nombre}</strong>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="text-muted">Total:</span>
                    <strong className="text-success" style={{ fontSize: 18 }}>
                      {presupuesto.total?.toFixed(2)} €
                    </strong>
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-center gap-2 text-muted">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Redirigiendo...</span>
                  </div>
                  <small>Redirigiendo a tus presupuestos...</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de error */}
      {mostrarModalError && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center py-5">
                <div
                  className="mb-4"
                  style={{
                    width: 100,
                    height: 100,
                    margin: "0 auto",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: "scaleIn 0.5s ease-out",
                  }}
                >
                  <svg
                    width="60"
                    height="60"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>

                <h3 className="mb-3" style={{ color: "#2c3e50", fontWeight: 700 }}>
                  Oops, algo salió mal
                </h3>
                
                <p className="text-muted mb-4" style={{ fontSize: 16 }}>
                  {mensajeError}
                </p>

                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setMostrarModalError(false);
                    router.push("/mis-presupuestos");
                  }}
                >
                  Volver a mis presupuestos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes checkDraw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>

      <Footer />
    </>
  );
}
