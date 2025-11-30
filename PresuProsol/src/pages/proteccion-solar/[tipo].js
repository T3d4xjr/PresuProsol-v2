// src/pages/proteccion-solar/[tipo].js
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import { useAuth } from "../../context/AuthContext";

import {
  fetchCatalogoProteccionSolar,
  fetchDescuentoClienteProteccionSolar,
  fetchPrecioProteccionSolar,
  insertarPresupuestoProteccionSolar,
} from "../api/proteccionSolar";

export default function ConfigProteccionSolar({
  datosIniciales = null,
  onSubmit = null,
  guardando = false,
  modoEdicion = false,
  tipoOverride = null,
}) {
  const router = useRouter();
  const { tipo: tipoQuery } = router.query;

  const tipo = tipoOverride || tipoQuery;

  const { session, profile, loading } = useAuth();

  const [modelos, setModelos] = useState([]);
  const [colores, setColores] = useState([]);
  const [accesorios, setAccesorios] = useState([]);

  const [modeloId, setModeloId] = useState("");
  const [colorId, setColorId] = useState("");
  const [accSel, setAccSel] = useState([]);

  const [precioBase, setPrecioBase] = useState(null);
  const [incrementoColor, setIncrementoColor] = useState(0);
  const [accTotal, setAccTotal] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [total, setTotal] = useState(0);

  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const tituloTipo = tipo || "Protección Solar";

  const modeloSel = useMemo(
    () => modelos.find((m) => m.id === modeloId),
    [modelos, modeloId]
  );

  const colorSel = useMemo(
    () => colores.find((c) => c.id === colorId),
    [colores, colorId]
  );

  /* ================== ACCESO ================== */
  useEffect(() => {
    if (!loading && !session && !modoEdicion) {
      router.replace("/login?m=login-required");
    }
  }, [loading, session, router, modoEdicion]);

  /* ================== CARGA CATÁLOGO ================== */
  useEffect(() => {
    const load = async () => {
      try {
        console.log("🔄 Cargando catálogo protección solar, tipo:", tipo);

        const { modelos, colores, accesorios } =
          await fetchCatalogoProteccionSolar();

        setModelos(modelos);
        setColores(colores);
        setAccesorios(accesorios);
      } catch (e) {
        console.error("💥 Error cargando catálogo:", e);
        setModelos([]);
        setColores([]);
        setAccesorios([]);
      }
    };

    if (tipo || modoEdicion) load();
  }, [tipo, modoEdicion]);

  /* ================== DESCUENTO CLIENTE ================== */
  useEffect(() => {
    const loadDesc = async () => {
      if (!session?.user?.id) return;
      const pct = await fetchDescuentoClienteProteccionSolar(
        session.user.id
      );
      setDescuento(pct);
    };

    loadDesc();
  }, [session?.user?.id]);

  /* ================== CARGAR DATOS INICIALES EN MODO EDICIÓN ================== */
  useEffect(() => {
    if (!datosIniciales || !modoEdicion) return;

    console.log(
      "📝 [MODO EDICIÓN PROTECCIÓN SOLAR] Cargando datos iniciales:",
      datosIniciales
    );

    // Modelo
    if (datosIniciales.tipo && modelos.length > 0) {
      const tipoPresupuesto = datosIniciales.tipo.replace(
        "proteccion-solar-",
        ""
      );
      const modeloEncontrado = modelos.find((m) =>
        m.nombre.toLowerCase().includes(tipoPresupuesto.toLowerCase())
      );

      if (modeloEncontrado) {
        console.log("   → Modelo encontrado:", modeloEncontrado.nombre);
        setModeloId(String(modeloEncontrado.id));
      } else {
        console.log(
          "   → Modelo no encontrado, seleccionando primero disponible"
        );
        setModeloId(String(modelos[0].id));
      }
    }

    // Color
    if (datosIniciales.color && colores.length > 0) {
      const colorEncontrado = colores.find(
        (c) => c.nombre.toLowerCase() === datosIniciales.color.toLowerCase()
      );
      if (colorEncontrado) {
        console.log("   → Color encontrado:", colorEncontrado.nombre);
        setColorId(String(colorEncontrado.id));
      }
    }

    // Accesorios
    if (datosIniciales.accesorios && Array.isArray(datosIniciales.accesorios)) {
      console.log("   → Accesorios:", datosIniciales.accesorios.length);
      const accesoriosNormalizados = datosIniciales.accesorios.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        pvp: Number(a.precio_unit || 0),
        unidades: Number(a.unidades || 0),
      }));
      setAccSel(accesoriosNormalizados);
    }

    // Precio base
    if (datosIniciales.medida_precio) {
      console.log("   → Precio base:", datosIniciales.medida_precio);
      setPrecioBase(Number(datosIniciales.medida_precio));
    }

    // Incremento color
    if (datosIniciales.color_precio) {
      console.log("   → Incremento color:", datosIniciales.color_precio);
      setIncrementoColor(Number(datosIniciales.color_precio));
    }

    // Descuento
    if (datosIniciales.descuento_cliente && descuento === 0) {
      console.log("   → Descuento inicial:", datosIniciales.descuento_cliente);
      setDescuento(Number(datosIniciales.descuento_cliente));
    }
  }, [datosIniciales, modoEdicion, modelos, colores, descuento]);

  /* ================== PRECIO BASE ================== */
  useEffect(() => {
    const loadPrecio = async () => {
      setPrecioBase(null);
      setIncrementoColor(0);

      if (!modeloId || !colorId) return;

      const modelo = modelos.find((m) => m.id === modeloId);
      const color = colores.find((c) => c.id === colorId);

      if (!modelo || !color) return;

      try {
        const { precio, incrementoColor } = await fetchPrecioProteccionSolar({
          modeloId: modelo.id,
          colorId: color.id,
        });

        setPrecioBase(precio);
        setIncrementoColor(incrementoColor);
      } catch (e) {
        console.error("💥 EXCEPTION precio:", e);
        setPrecioBase(null);
        setIncrementoColor(0);
      }
    };

    loadPrecio();
  }, [modeloId, colorId, modelos, colores]);

  /* ================== CÁLCULOS ================== */
  useEffect(() => {
    const acc = accSel.reduce((sum, a) => {
      return sum + Number(a.pvp || 0) * Number(a.unidades || 0);
    }, 0);

    setAccTotal(+acc.toFixed(2));

    const subtotal = (precioBase || 0) + incrementoColor + acc;
    const desc = subtotal * (descuento / 100);
    const tot = subtotal - desc;

    setTotal(+tot.toFixed(2));
  }, [precioBase, incrementoColor, accSel, descuento]);

  /* ================== MANEJAR ACCESORIOS ================== */
  const onSetAccUnidades = (acc, value) => {
    const uds = Math.max(0, parseInt(value || "0", 10));

    setAccSel((prev) => {
      const found = prev.find((x) => x.id === acc.id);

      if (!found && uds > 0) {
        return [
          ...prev,
          {
            id: acc.id,
            nombre: acc.nombre,
            pvp: Number(acc.pvp || 0),
            unidades: uds,
          },
        ];
      }

      if (found) {
        return prev
          .map((x) => (x.id === acc.id ? { ...x, unidades: uds } : x))
          .filter((x) => x.unidades > 0);
      }

      return prev;
    });
  };

  /* ================== FUNCIÓN PARA OBTENER IMAGEN ACCESORIO ================== */
  function getImagenAccesorio(nombreAccesorio) {
    if (!nombreAccesorio) return null;

    const nombre = nombreAccesorio.toLowerCase();

    if (nombre.includes("kit") && nombre.includes("fijación")) {
      return "/assets/proteccionSolar/accesorios/kitFijacion.png";
    }

    if (nombre.includes("motor") && nombre.includes("40")) {
      return "/assets/proteccionSolar/accesorios/motorRadio.png";
    }

    if (nombre.includes("motor") && nombre.includes("50")) {
      return "/assets/proteccionSolar/accesorios/motorRadio.png";
    }

    if (nombre.includes("sensor")) {
      return "/assets/proteccionSolar/accesorios/sensorRadio.png";
    }

    if (nombre.includes("manivela")) {
      return "/assets/proteccionSolar/accesorios/manivelaMonoblock.png";
    }

    return null;
  }

  /* ================== GUARDAR ================== */
  async function guardar() {
    // MODO EDICIÓN: usar callback
    if (modoEdicion && onSubmit) {
      const subtotal = (precioBase || 0) + incrementoColor + accTotal;

      const datosPresupuesto = {
        cliente: profile?.usuario || datosIniciales?.cliente || "",
        email: profile?.email || datosIniciales?.email || "",
        cif: profile?.cif || datosIniciales?.cif || null,
        medida_precio: precioBase || 0,
        color: colorSel?.nombre || null,
        color_precio: incrementoColor,
        accesorios: accSel.map((a) => ({
          id: a.id,
          nombre: a.nombre,
          unidades: a.unidades,
          precio_unit: a.pvp,
        })),
        subtotal: subtotal,
        descuento_cliente: descuento,
        total: total,
      };

      console.log(
        "💾 [MODO EDICIÓN PROTECCIÓN SOLAR] Enviando datos:",
        datosPresupuesto
      );
      onSubmit(datosPresupuesto);
      return;
    }

    // MODO NORMAL: guardar nuevo presupuesto
    setSaving(true);
    setMsg("");

    try {
      if (!session?.user?.id) {
        router.push("/login?m=login-required");
        return;
      }

      if (!modeloId || !colorId || precioBase === null) {
        setMsg("⚠️ Completa todos los campos.");
        return;
      }

      const subtotal = (precioBase || 0) + incrementoColor + accTotal;

      const payload = {
        user_id: session.user.id,
        cliente: profile?.usuario || "",
        email: profile?.email || "",
        cif: profile?.cif || null,
        tipo: `proteccion-solar-${tipo}`,
        alto_mm: 0,
        ancho_mm: 0,
        medida_precio: precioBase || 0,
        color: colorSel?.nombre || null,
        color_precio: incrementoColor,
        accesorios: accSel.map((a) => ({
          id: a.id,
          nombre: a.nombre,
          unidades: a.unidades,
          precio_unit: a.pvp,
        })),
        subtotal: subtotal,
        descuento_cliente: descuento,
        total: total,
        pagado: false,
      };

      console.log("[guardar protección solar] payload:", payload);

      await insertarPresupuestoProteccionSolar(payload);

      setMsg("✅ Presupuesto guardado correctamente.");

      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (e) {
      console.error("[guardar exception]", e);
      setMsg(`❌ Error inesperado: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  }

  /* ================== RENDER ================== */
  return (
    <>
      <Head>
        <title>{`Configurar ${tituloTipo} · PresuProsol`}</title>
      </Head>

      {!modoEdicion && <Header />}

      <main
        className={`container ${!modoEdicion ? "py-4" : ""}`}
        style={{ maxWidth: 980 }}
      >
        {!modoEdicion && (
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h1 className="h4 m-0">{tituloTipo}</h1>
            <button
              className="btn btn-outline-secondary"
              onClick={() => router.push("/proteccion-solar")}
            >
              ← Volver
            </button>
          </div>
        )}

        <div className="card shadow-sm">
          <div className="card-body">
            <div className="row g-3">
              {/* MODELO */}
              <div className="col-12 col-md-6">
                <label className="form-label">Modelo</label>
                <select
                  className="form-select"
                  value={modeloId}
                  onChange={(e) => setModeloId(e.target.value)}
                >
                  <option value="">Selecciona modelo…</option>
                  {modelos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} {m.descripcion && `- ${m.descripcion}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* COLOR / ESTRUCTURA */}
              <div className="col-12 col-md-6">
                <label className="form-label">Color / Estructura</label>
                <select
                  className="form-select"
                  value={colorId}
                  onChange={(e) => setColorId(e.target.value)}
                >
                  <option value="">Selecciona color…</option>
                  {colores.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                      {c.incremento_m2 > 0 && ` (+${c.incremento_m2} €)`}
                    </option>
                  ))}
                </select>

                {precioBase === null && modeloId && colorId && (
                  <small className="text-danger d-block mt-1">
                    Precio: consultar
                  </small>
                )}

                {precioBase !== null && (
                  <small className="text-muted d-block mt-1">
                    Precio base: {precioBase.toFixed(2)} €
                  </small>
                )}
              </div>

              {/* ACCESORIOS */}
              <div className="col-12">
                <label className="form-label d-block">Accesorios</label>

                {accesorios.length === 0 && (
                  <small className="text-muted">
                    No hay accesorios disponibles
                  </small>
                )}

                {accesorios.length > 0 && (
                  <div className="row g-2">
                    {accesorios.map((a) => {
                      const sel =
                        accSel.find((x) => x.id === a.id)?.unidades || 0;
                      const imagenUrl = getImagenAccesorio(a.nombre);

                      return (
                        <div className="col-12 col-md-6" key={a.id}>
                          <div className="border rounded p-2 d-flex align-items-center gap-3">
                            {imagenUrl && (
                              <img
                                src={imagenUrl}
                                alt={a.nombre}
                                style={{
                                  width: 80,
                                  height: 80,
                                  objectFit: "cover",
                                  borderRadius: 8,
                                  flexShrink: 0,
                                }}
                                onError={(e) => {
                                  console.error(
                                    "❌ Error cargando imagen:",
                                    imagenUrl
                                  );
                                  e.target.style.display = "none";
                                }}
                              />
                            )}

                            <div className="flex-grow-1">
                              <div className="fw-semibold">{a.nombre}</div>
                              <small className="text-muted">
                                {Number(a.pvp || 0).toFixed(2)} € / {a.unidad}
                              </small>
                            </div>

                            <input
                              type="number"
                              min={0}
                              className="form-control"
                              style={{ width: 80 }}
                              value={sel}
                              onChange={(e) =>
                                onSetAccUnidades(a, e.target.value)
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RESUMEN */}
              <div className="col-12">
                <hr />
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between">
                    <span>Precio base:</span>
                    <strong>{(precioBase || 0).toFixed(2)} €</strong>
                  </div>

                  {incrementoColor > 0 && (
                    <div className="d-flex justify-content-between">
                      <span>Incremento color:</span>
                      <strong>{incrementoColor.toFixed(2)} €</strong>
                    </div>
                  )}

                  <div className="d-flex justify-content-between">
                    <span>Accesorios:</span>
                    <strong>{accTotal.toFixed(2)} €</strong>
                  </div>

                  <div className="d-flex justify-content-between">
                    <span>Descuento cliente:</span>
                    <strong>{descuento}%</strong>
                  </div>

                  <hr />

                  <div className="d-flex justify-content-between fs-4">
                    <span>TOTAL:</span>
                    <strong style={{ color: "var(--accent)" }}>
                      {total.toFixed(2)} €
                    </strong>
                  </div>
                </div>
              </div>

              {/* MENSAJE */}
              {msg && (
                <div
                  className={`col-12 alert ${
                    msg.startsWith("✅") ? "alert-success" : "alert-warning"
                  } mb-0`}
                >
                  {msg}
                </div>
              )}

              {/* BOTÓN GUARDAR */}
              <div className="col-12">
                <button
                  className="btn w-100"
                  style={{
                    background: "var(--accent)",
                    color: "var(--surface)",
                    fontWeight: 600,
                  }}
                  onClick={guardar}
                  disabled={
                    saving ||
                    guardando ||
                    !modeloId ||
                    !colorId ||
                    precioBase === null
                  }
                >
                  {saving || guardando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {modoEdicion ? "Actualizando…" : "Guardando…"}
                    </>
                  ) : (
                    <>
                      {modoEdicion
                        ? "💾 Guardar Cambios"
                        : "💾 Guardar presupuesto"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
