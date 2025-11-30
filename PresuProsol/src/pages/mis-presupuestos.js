// src/pages/mis-presupuestos.js
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useAuth from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ModalPago from "../components/ModalPago";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function MisPresupuestos() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [presupuestos, setPresupuestos] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState(null);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [presupuestoAEliminar, setPresupuestoAEliminar] = useState(null);

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login?m=login-required");
    }
  }, [loading, session, router]);

  useEffect(() => {
    if (session?.user?.id) {
      loadPresupuestos();
    }
  }, [session]);

  async function loadPresupuestos() {
    setLoadingData(true);
    const { data, error } = await supabase
      .from("presupuestos")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando presupuestos:", error);
    } else {
      setPresupuestos(data || []);
    }
    setLoadingData(false);
  }

  function abrirModalEliminar(presupuesto) {
    setPresupuestoAEliminar(presupuesto);
    setMostrarModalEliminar(true);
  }

  function cerrarModalEliminar() {
    setPresupuestoAEliminar(null);
    setMostrarModalEliminar(false);
  }

  async function confirmarEliminar() {
    if (!presupuestoAEliminar) return;

    const { error } = await supabase
      .from("presupuestos")
      .delete()
      .eq("id", presupuestoAEliminar.id);

    if (error) {
      alert("Error eliminando: " + error.message);
    } else {
      cerrarModalEliminar();
      loadPresupuestos();
    }
  }

  function handleEditar(presupuesto) {
    console.log("📝 Editando presupuesto:", presupuesto);

    if (presupuesto.pagado) {
      alert("⚠️ No puedes editar un presupuesto ya pagado");
      return;
    }

    router.push(`/editar-presupuesto/${presupuesto.id}`);
  }

  function abrirModalPago(presupuesto) {
    setPresupuestoSeleccionado(presupuesto);
    setMostrarModalPago(true);
  }

  function cerrarModalPago() {
    setPresupuestoSeleccionado(null);
    setMostrarModalPago(false);
  }

  async function onPagoExitoso() {
    cerrarModalPago();
    await loadPresupuestos();
    router.push("/pago-exitoso");
  }

  async function generarPDF(presupuesto) {
    try {
      const contenedor = document.createElement("div");
      contenedor.style.position = "absolute";
      contenedor.style.left = "-9999px";
      contenedor.style.width = "210mm";
      contenedor.style.padding = "20mm";
      contenedor.style.backgroundColor = "white";
      contenedor.style.fontFamily = "Arial, sans-serif";

      contenedor.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin-bottom: 10px; font-weight: bold; font-size: 32px;">PRESUPUESTO</h1>
            <p style="color: #7f8c8d; font-size: 14px;">PresuProsol - Soluciones Profesionales</p>
          </div>

          <div style="border: 2px solid #3498db; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #2c3e50; font-size: 18px; margin-bottom: 15px;">Información del Cliente</h2>
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 5px 0; color: #7f8c8d; width: 150px;">Cliente:</td>
                <td style="padding: 5px 0; font-weight: bold;">${presupuesto.cliente || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #7f8c8d;">Email:</td>
                <td style="padding: 5px 0; font-weight: bold;">${presupuesto.email || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #7f8c8d;">CIF:</td>
                <td style="padding: 5px 0; font-weight: bold;">${presupuesto.cif || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #7f8c8d;">Fecha:</td>
                <td style="padding: 5px 0; font-weight: bold;">${new Date(presupuesto.created_at).toLocaleDateString("es-ES")}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #7f8c8d;">Tipo:</td>
                <td style="padding: 5px 0; font-weight: bold; text-transform: capitalize;">${presupuesto.tipo || "N/A"}</td>
              </tr>
            </table>
          </div>

          <div style="border: 2px solid #2ecc71; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #2c3e50; font-size: 18px; margin-bottom: 15px;">Detalles del Producto</h2>
            <table style="width: 100%; font-size: 14px;">
              ${presupuesto.alto_mm ? `
              <tr>
                <td style="padding: 5px 0; color: #7f8c8d; width: 150px;">Alto:</td>
                <td style="padding: 5px 0; font-weight: bold;">${presupuesto.alto_mm} mm</td>
              </tr>
              ` : ''}
              ${presupuesto.ancho_mm ? `
              <tr>
                <td style="padding: 5px 0; color: #7f8c8d;">Ancho:</td>
                <td style="padding: 5px 0; font-weight: bold;">${presupuesto.ancho_mm} mm</td>
              </tr>
              ` : ''}
              ${presupuesto.color ? `
              <tr>
                <td style="padding: 5px 0; color: #7f8c8d;">Color:</td>
                <td style="padding: 5px 0; font-weight: bold;">${presupuesto.color}</td>
              </tr>
              ` : ''}
              ${presupuesto.medida_precio ? `
              <tr>
                <td style="padding: 5px 0; color: #7f8c8d;">Precio medida:</td>
                <td style="padding: 5px 0; font-weight: bold;">${presupuesto.medida_precio.toFixed(2)} €</td>
              </tr>
              ` : ''}
            </table>
          </div>

          ${presupuesto.accesorios && presupuesto.accesorios.length > 0 ? `
          <div style="border: 2px solid #e74c3c; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #2c3e50; font-size: 18px; margin-bottom: 15px;">Accesorios</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background-color: #ecf0f1;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #bdc3c7;">Descripción</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #bdc3c7;">Unidades</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #bdc3c7;">Precio Unit.</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #bdc3c7;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${presupuesto.accesorios.map((acc) => `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ecf0f1;">${acc.nombre || "Accesorio"}</td>
                  <td style="padding: 8px; text-align: center; border-bottom: 1px solid #ecf0f1;">${acc.unidades || 0}</td>
                  <td style="padding: 8px; text-align: right; border-bottom: 1px solid #ecf0f1;">${(acc.precio_unit || 0).toFixed(2)} €</td>
                  <td style="padding: 8px; text-align: right; border-bottom: 1px solid #ecf0f1; font-weight: bold;">${((acc.unidades || 0) * (acc.precio_unit || 0)).toFixed(2)} €</td>
                </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 20px; color: white;">
            <h2 style="font-size: 18px; margin-bottom: 15px;">Resumen Financiero</h2>
            <table style="width: 100%; font-size: 16px;">
              <tr>
                <td style="padding: 8px 0;">Subtotal:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${(presupuesto.subtotal || 0).toFixed(2)} €</td>
              </tr>
              ${presupuesto.descuento_cliente > 0 ? `
              <tr>
                <td style="padding: 8px 0;">Descuento (${presupuesto.descuento_cliente}%):</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #ffeaa7;">-${((presupuesto.subtotal || 0) * (presupuesto.descuento_cliente / 100)).toFixed(2)} €</td>
              </tr>
              ` : ''}
              <tr style="border-top: 2px solid rgba(255,255,255,0.3);">
                <td style="padding: 12px 0; font-size: 20px; font-weight: bold;">TOTAL:</td>
                <td style="padding: 12px 0; text-align: right; font-size: 24px; font-weight: bold;">${(presupuesto.total || 0).toFixed(2)} €</td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top: 10px; font-size: 14px; opacity: 0.8;">
                  Estado: ${presupuesto.pagado ? "✅ PAGADO" : "⏳ Pendiente de pago"}
                </td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ecf0f1; text-align: center; color: #7f8c8d; font-size: 12px;">
            <p>PresuProsol</p>
          </div>
        </div>
      `;

      document.body.appendChild(contenedor);

      const canvas = await html2canvas(contenedor, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: contenedor.scrollWidth,
        windowHeight: contenedor.scrollHeight,
      });

      document.body.removeChild(contenedor);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;

      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;
      let page = 1;

      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        page++;
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      const fileName = `presupuesto-${
        presupuesto.cliente?.replace(/\s+/g, "-") ||
        presupuesto.id.substring(0, 8)
      }.pdf`;
      pdf.save(fileName);

      console.log(`✅ PDF generado: ${page} página(s)`);
    } catch (error) {
      console.error("❌ Error generando PDF:", error);
      alert("Error al generar el PDF. Por favor, inténtalo de nuevo.");
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
            <p className="mt-3">Cargando presupuestos...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const grouped = presupuestos.reduce((acc, p) => {
    const tipo = p.tipo || "Otros";
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(p);
    return acc;
  }, {});

  return (
    <>
      <Head>
        <title>Mis Presupuestos · PresuProsol</title>
      </Head>
      <Header />

      <main className="container py-4" style={{ maxWidth: 1200 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>📋 Mis Presupuestos</h1>
          <button
            onClick={() => router.push("/perfil")}
            className="btn btn-outline-secondary"
          >
            ← Volver
          </button>
        </div>

        {presupuestos.length === 0 && (
          <div className="alert alert-info">
            <p className="mb-0">
              No tienes presupuestos aún. ¡Crea tu primer presupuesto!
            </p>
          </div>
        )}

        {Object.keys(grouped).map((categoria) => (
          <div key={categoria} className="mb-4">
            <h3 className="h5 mb-3 text-capitalize">{categoria}</h3>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Detalles</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped[categoria].map((p) => (
                    <tr key={p.id}>
                      <td>
                        {new Date(p.created_at).toLocaleDateString("es-ES")}
                      </td>
                      <td>
                        <div className="fw-semibold">
                          {p.cliente || "Sin nombre"}
                        </div>
                        <small className="text-muted">
                          {p.email || ""}
                        </small>
                      </td>
                      <td>
                        {p.alto_mm && p.ancho_mm && (
                          <div>
                            <small className="text-muted">
                              {p.alto_mm} × {p.ancho_mm} mm
                            </small>
                          </div>
                        )}
                        {p.color && (
                          <div>
                            <small className="text-muted">
                              Color: {p.color}
                            </small>
                          </div>
                        )}
                        {p.accesorios && p.accesorios.length > 0 && (
                          <div>
                            <small className="text-muted">
                              {p.accesorios.length} accesorio
                              {p.accesorios.length !== 1 ? "s" : ""}
                            </small>
                          </div>
                        )}
                      </td>
                      <td className="fw-bold text-success">
                        {p.total?.toFixed(2)} €
                      </td>
                      <td>
                        {p.pagado ? (
                          <span className="badge bg-success">✅ Pagado</span>
                        ) : (
                          <span className="badge bg-warning text-dark">
                            ⏳ Pendiente
                          </span>
                        )}
                      </td>
                      <td>
                        {p.pagado ? (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => generarPDF(p)}
                          >
                            📄 Descargar PDF
                          </button>
                        ) : (
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEditar(p)}
                              title="Editar presupuesto"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => abrirModalPago(p)}
                              title="Proceder al pago"
                            >
                              💳 Pagar
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => abrirModalEliminar(p)}
                              title="Eliminar presupuesto"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </main>

      {/* Modal eliminar */}
      {mostrarModalEliminar && presupuestoAEliminar && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={cerrarModalEliminar}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">🗑️ Eliminar Presupuesto</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={cerrarModalEliminar}
                ></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-3">
                  <div
                    style={{
                      fontSize: 64,
                      color: "#dc3545",
                      marginBottom: 16,
                    }}
                  >
                    ⚠️
                  </div>
                  <h6 className="mb-3">
                    ¿Estás seguro de que quieres eliminar este presupuesto?
                  </h6>
                  <div className="alert alert-light border">
                    <p className="mb-1">
                      <strong>Cliente:</strong>{" "}
                      {presupuestoAEliminar.cliente || "Sin nombre"}
                    </p>
                    <p className="mb-1">
                      <strong>Tipo:</strong>{" "}
                      <span className="text-capitalize">
                        {presupuestoAEliminar.tipo}
                      </span>
                    </p>
                    <p className="mb-0">
                      <strong>Total:</strong>{" "}
                      <span className="text-success">
                        {presupuestoAEliminar.total?.toFixed(2)} €
                      </span>
                    </p>
                  </div>
                  <p className="text-danger small mb-0">
                    <strong>Esta acción no se puede deshacer</strong>
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cerrarModalEliminar}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmarEliminar}
                >
                  Sí, eliminar presupuesto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de pago */}
      {mostrarModalPago && presupuestoSeleccionado && (
        <ModalPago
          presupuesto={presupuestoSeleccionado}
          userId={session.user.id}
          onClose={cerrarModalPago}
          onSuccess={onPagoExitoso}
        />
      )}

      <Footer />
    </>
  );
}
