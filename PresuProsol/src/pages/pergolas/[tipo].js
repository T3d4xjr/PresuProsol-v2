// src/pages/pergolas/[tipo].js
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import { useAuth } from "../../context/AuthContext";

import {
  fetchCatalogoPergolas,
  fetchDescuentoClientePergolas,
  fetchPrecioPergola,
  insertarPresupuestoPergola,
} from "../api/pergolas";

const PRESUPUESTO_MINIMO = 2500;

export default function ConfigPergola({
  datosIniciales = null,
  onSubmit = null,
  guardando = false,
  modoEdicion = false,
}) {
  const router = useRouter();
  const { tipo } = router.query;
  const { session, profile, loading } = useAuth();

  const [medidas, setMedidas] = useState([]);
  const [colores, setColores] = useState([]);
  const [accesorios, setAccesorios] = useState([]);

  const [medidaId, setMedidaId] = useState("");
  const [colorId, setColorId] = useState("");
  const [accSel, setAccSel] = useState([]);

  const [precioBase, setPrecioBase] = useState(null);
  const [incrementoColor, setIncrementoColor] = useState(0);
  const [accTotal, setAccTotal] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [total, setTotal] = useState(0);

  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const medidaSel = useMemo(
    () => medidas.find((m) => m.id === medidaId),
    [medidas, medidaId]
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

  /* ================== VALIDAR TIPO ================== */
  useEffect(() => {
    if (tipo && tipo !== "bioclimatica" && !modoEdicion) {
      router.replace("/pergolas");
    }
  }, [tipo, router, modoEdicion]);

  /* ================== CARGA CATÁLOGO ================== */
  useEffect(() => {
    const load = async () => {
      try {
        console.log("🔄 [CARGANDO CATÁLOGO PÉRGOLAS DESDE API]");
        const { medidas, colores, accesorios } = await fetchCatalogoPergolas();
        setMedidas(medidas);
        setColores(colores);
        setAccesorios(accesorios);
      } catch (e) {
        console.error("💥 [load catálogo] exception:", e);
        setMedidas([]);
        setColores([]);
        setAccesorios([]);
      }
    };

    if (tipo === "bioclimatica" || modoEdicion) load();
  }, [tipo, modoEdicion]);

  /* ================== DESCUENTO CLIENTE ================== */
  useEffect(() => {
    const loadDesc = async () => {
      if (!session?.user?.id) return;
      const pct = await fetchDescuentoClientePergolas(session.user.id);
      setDescuento(pct);
    };

    loadDesc();
  }, [session?.user?.id]);

  /* ================== CARGAR DATOS INICIALES EN MODO EDICIÓN ================== */
  useEffect(() => {
    if (!datosIniciales || !modoEdicion) return;

    console.log(
      "📝 [MODO EDICIÓN PÉRGOLA] Cargando datos iniciales:",
      datosIniciales
    );

    if (
      datosIniciales.ancho_mm &&
      datosIniciales.alto_mm &&
      medidas.length > 0
    ) {
      const medidaEncontrada = medidas.find(
        (m) =>
          m.ancho_mm === Number(datosIniciales.ancho_mm) &&
          m.fondo_mm === Number(datosIniciales.alto_mm)
      );
      if (medidaEncontrada) {
        console.log(
          "   → Medida encontrada:",
          medidaEncontrada.ancho_mm,
          "×",
          medidaEncontrada.fondo_mm
        );
        setMedidaId(String(medidaEncontrada.id));
      }
    }

    if (datosIniciales.color && colores.length > 0) {
      const colorEncontrado = colores.find(
        (c) => c.nombre.toLowerCase() === datosIniciales.color.toLowerCase()
      );
      if (colorEncontrado) {
        console.log("   → Color encontrado:", colorEncontrado.nombre);
        setColorId(String(colorEncontrado.id));
      }
    }

    if (
      datosIniciales.accesorios &&
      Array.isArray(datosIniciales.accesorios)
    ) {
      console.log("   → Accesorios:", datosIniciales.accesorios.length);
      const accesoriosNormalizados = datosIniciales.accesorios.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        pvp: Number(a.precio_unit || 0),
        unidades: Number(a.unidades || 0),
      }));
      setAccSel(accesoriosNormalizados);
    }

    if (datosIniciales.medida_precio) {
      console.log("   → Precio base:", datosIniciales.medida_precio);
      setPrecioBase(Number(datosIniciales.medida_precio));
    }

    if (datosIniciales.color_precio) {
      console.log("   → Incremento color:", datosIniciales.color_precio);
      setIncrementoColor(Number(datosIniciales.color_precio));
    }

    if (datosIniciales.descuento_cliente && descuento === 0) {
      console.log("   → Descuento inicial:", datosIniciales.descuento_cliente);
      setDescuento(Number(datosIniciales.descuento_cliente));
    }
  }, [datosIniciales, modoEdicion, medidas, colores, descuento]);

  /* ================== PRECIO BASE ================== */
  useEffect(() => {
    const loadPrecio = async () => {
      setPrecioBase(null);
      setIncrementoColor(0);

      if (!medidaId || !colorId) return;

      const medida = medidas.find((m) => m.id === medidaId);
      const color = colores.find((c) => c.id === colorId);

      if (!medida || !color) return;

      try {
        const { precio, incrementoColor } = await fetchPrecioPergola({
          ancho_mm: medida.ancho_mm,
          fondo_mm: medida.fondo_mm,
          colorId: color.id,
        });

        setPrecioBase(precio);
        setIncrementoColor(incrementoColor);
      } catch (e) {
        console.error("💥 [loadPrecio] exception:", e);
        setPrecioBase(null);
        setIncrementoColor(0);
      }
    };

    loadPrecio();
  }, [medidaId, colorId, medidas, colores]);

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

  /* ================== HANDLERS ================== */
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
          .filter((x) => (x.unidades || 0) > 0);
      }

      return prev;
    });
  };

  /* ================== FUNCIÓN PARA OBTENER IMAGEN ACCESORIO ================== */
  function getImagenAccesorio(nombreAccesorio) {
    if (!nombreAccesorio) return null;

    const nombre = nombreAccesorio.toLowerCase();

    if (nombre.includes("cerramiento")) {
      return "/assets/pergolaBioclimatica/accesorios/cerramiento.png";
    }

    if (nombre.includes("agua") || nombre.includes("riego")) {
      return "/assets/pergolaBioclimatica/accesorios/kitAgua.png";
    }

    if (nombre.includes("kit") && nombre.includes("perimetral")) {
      return "/assets/pergolaBioclimatica/accesorios/kitIluminacion.png";
    }

    if (nombre.includes("mando")) {
      return "/assets/pergolaBioclimatica/accesorios/mando.png";
    }

    if (nombre.includes("sensor")) {
      return "/assets/pergolaBioclimatica/accesorios/sensorRadio.png";
    }

    return null;
  }

  /* ================== GUARDAR ================== */
  async function guardar() {
    // MODO EDICIÓN
    if (modoEdicion && onSubmit) {
      const subtotal = (precioBase || 0) + incrementoColor + accTotal;

      const datosPresupuesto = {
        cliente: profile?.usuario || datosIniciales?.cliente || "",
        email: profile?.email || datosIniciales?.email || "",
        cif: profile?.cif || datosIniciales?.cif || null,
        ancho_mm: medidaSel?.ancho_mm || 0,
        alto_mm: medidaSel?.fondo_mm || 0,
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

      console.log("💾 [MODO EDICIÓN PÉRGOLA] Enviando datos:", datosPresupuesto);
      onSubmit(datosPresupuesto);
      return;
    }

    // MODO NORMAL
    setSaving(true);
    setMsg("");

    try {
      if (!session?.user?.id) {
        router.push("/login?m=login-required");
        return;
      }

      if (!medidaId || !colorId) {
        setMsg("⚠️ Completa todos los campos requeridos.");
        return;
      }

      if (precioBase === null) {
        setMsg(
          "⚠️ No hay precio disponible para esta combinación. Contacta con administración."
        );
        return;
      }

      if (total < PRESUPUESTO_MINIMO) {
        setMsg(
          `⚠️ El presupuesto debe ser superior a ${PRESUPUESTO_MINIMO.toFixed(
            2
          )} €`
        );
        return;
      }

      const subtotal = (precioBase || 0) + incrementoColor + accTotal;

      const payload = {
        user_id: session.user.id,
        cliente: profile?.usuario || "",
        email: profile?.email || "",
        cif: profile?.cif || null,
        tipo: "pergola-bioclimatica",
        ancho_mm: medidaSel?.ancho_mm || 0,
        alto_mm: medidaSel?.fondo_mm || 0,
        medida_precio: precioBase || 0,
        color: colorSel?.nombre || null,
        color_precio: incrementoColor,
        accesorios: accSel.map((a) => ({
          id: a.id,
          nombre: a.nombre,
          unidades: Number(a.unidades || 0),
          precio_unit: Number(a.pvp || 0),
        })),
        subtotal: Number(subtotal),
        descuento_cliente: Number(descuento),
        total: Number(total),
        pagado: false,
      };

      console.log("💾 [GUARDANDO PÉRGOLA]", payload);

      await insertarPresupuestoPergola(payload);

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
        <title>Configurar Pérgola Bioclimática · PresuProsol</title>
      </Head>

      {!modoEdicion && <Header />}

      <main
        className={`container ${!modoEdicion ? "py-4" : ""}`}
        style={{ maxWidth: 980 }}
      >
        {!modoEdicion && (
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h1 className="h4 m-0">Pérgola Bioclimática</h1>
            <button
              className="btn btn-outline-secondary"
              onClick={() => router.push("/pergolas")}
            >
              ← Volver
            </button>
          </div>
        )}

        <div className="card shadow-sm">
          <div className="card-body">
            <div className="row g-3">
              {/* MEDIDAS */}
              <div className="col-12 col-md-6">
                <label className="form-label">Medida (ancho × fondo)</label>
                <select
                  className="form-select"
                  value={medidaId}
                  onChange={(e) => setMedidaId(e.target.value)}
                >
                  <option value="">Selecciona medida…</option>
                  {medidas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.ancho_mm} × {m.fondo_mm} mm
                    </option>
                  ))}
                </select>
                {medidas.length === 0 && (
                  <small className="text-muted d-block mt-1">
                    No hay medidas disponibles
                  </small>
                )}
              </div>

              {/* COLORES */}
              <div className="col-12 col-md-6">
                <label className="form-label">Color / Acabado</label>
                <select
                  className="form-select"
                  value={colorId}
                  onChange={(e) => setColorId(e.target.value)}
                >
                  <option value="">Selecciona color…</option>
                  {colores.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}{" "}
                      {c.incremento_eur_m2 > 0 &&
                        `(+${c.incremento_eur_m2.toFixed(2)} €/m²)`}
                    </option>
                  ))}
                </select>

                {precioBase === null && medidaId && colorId && (
                  <small className="text-danger d-block mt-1">
                    Precio: consultar
                  </small>
                )}

                {precioBase !== null && medidaId && colorId && (
                  <small className="text-muted d-block mt-1">
                    Precio base: {Number(precioBase).toFixed(2)} €
                  </small>
                )}

                {colores.length === 0 && (
                  <small className="text-muted d-block mt-1">
                    No hay colores disponibles
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
                              {a.categoria && (
                                <small className="text-muted d-block">
                                  {a.categoria}
                                </small>
                              )}
                            </div>

                            <div style={{ minWidth: 80 }}>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                className="form-control"
                                value={sel}
                                onChange={(e) =>
                                  onSetAccUnidades(a, e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {accSel.length > 0 && (
                  <small className="text-muted d-block mt-2">
                    💡 Total accesorios:{" "}
                    <strong>{accTotal.toFixed(2)} €</strong>
                  </small>
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
                    <strong
                      style={{
                        color:
                          total >= PRESUPUESTO_MINIMO
                            ? "var(--accent)"
                            : "#dc3545",
                      }}
                    >
                      {total.toFixed(2)} €
                    </strong>
                  </div>
                  {total > 0 && total < PRESUPUESTO_MINIMO && (
                    <small className="text-danger">
                      ⚠️ Presupuesto mínimo: {PRESUPUESTO_MINIMO.toFixed(2)} €
                    </small>
                  )}
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
                    !medidaId ||
                    !colorId ||
                    precioBase === null ||
                    (total < PRESUPUESTO_MINIMO && !modoEdicion)
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
