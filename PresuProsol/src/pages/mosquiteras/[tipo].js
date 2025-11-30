// src/pages/mosquiteras/[tipo].js
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import useAuth from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";

/* ============ Helpers de pricing (con logs) ============ */

const getMosqBasePrice = async (alto, ancho) => {
  console.log("[getMosqBasePrice] buscar precio para:", { alto, ancho });
  const { data, error, status } = await supabase
    .from("mosq_medidas")
    .select("precio")
    .eq("alto_mm", alto)
    .eq("ancho_mm", ancho)
    .maybeSingle();

  console.log("[getMosqBasePrice] status:", status, "data:", data, "error:", error);
  if (error) return null;
  return data?.precio ?? null;
};

const calcColorIncrement = (alto, ancho, precioMl) => {
  const perimetro = 2 * (Number(alto) + Number(ancho)); // mm
  const inc = (perimetro / 1000) * Number(precioMl || 0);
  console.log("[calcColorIncrement]", { alto, ancho, precioMl, perimetro, inc });
  return inc;
};

const calcAccesoriosTotal = (accSel) => {
  const total = accSel.reduce(
    (sum, a) => sum + Number(a.precio_unit || 0) * Number(a.unidades || 0),
    0
  );
  console.table(accSel);
  console.log("[calcAccesoriosTotal] total:", total);
  return total;
};

const applyDiscount = (subtotal, descuento) => {
  const tot = Number(subtotal) * (1 - Number(descuento || 0) / 100);
  console.log("[applyDiscount]", { subtotal, descuento, tot });
  return tot;
};

/* ============ Alias imágenes ============ */

const ACC_IMG_ALIAS = {
  "Juego escuadras con rodamientos": "EscuadrasRodamiento",
  "Juego escuadras sin rodamientos": "JuegoEscuadras",
  "Goma mosquitera": "GomaMosquitera",
  "Tela mosquitera": "TelaMosquitera",
  "Escuadra central": "EscuadraCentral",
  "Felpudo": "Felpudo",
};

const slugImg = (txt = "") =>
  txt
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^\w\-]/g, "");

/* ============ Colores (UI) ============ */

function guessHexFromName(nombre = "") {
  const n = (nombre || "").toLowerCase();
  if (/blanco/.test(n)) return "#FFFFFF";
  if (/plata/.test(n) || /anodiz/.test(n)) return "#C0C0C0";
  if (/bronce/.test(n)) return "#8C6239";
  if (/ral\s*est[aá]ndar/.test(n)) return "#4F4F4F";
  if (/ral\s*especial/.test(n)) return "#7C3AED";
  return "#2D2A6E";
}

function normalizeHex(v) {
  if (!v) return null;
  let s = String(v).trim();
  if (!s) return null;
  if (!s.startsWith("#")) s = "#" + s;
  const ok = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s);
  return ok ? s.toUpperCase() : null;
}

/* ============ Componente Principal ============ */

export default function ConfigMosquitera({
  datosIniciales = null,
  onSubmit = null,
  guardando = false,
  modoEdicion = false,
  tipoOverride = null,
}) {
  const router = useRouter();
  const { tipo: tipoQuery } = router.query;

  // Usar tipoOverride si existe (modo edición), sino usar query
  const tipo = tipoOverride || tipoQuery;

  const { session, profile, loading } = useAuth();

  // Datos
  const [anchos, setAnchos] = useState([]);
  const [altos, setAltos] = useState([]);
  const [colores, setColores] = useState([]);
  const [accesorios, setAccesorios] = useState([]);

  // Selección
  const [ancho, setAncho] = useState("");
  const [alto, setAlto] = useState("");
  const [colorId, setColorId] = useState("");
  const [accSel, setAccSel] = useState([]);

  // Precios
  const [precioBase, setPrecioBase] = useState(0);
  const [incColor, setIncColor] = useState(0);
  const [accTotal, setAccTotal] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [total, setTotal] = useState(0);

  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  /* 🔒 Protección */
  useEffect(() => {
    if (!loading && !session && !modoEdicion) {
      router.replace("/login?m=login-required");
    }
  }, [loading, session, router, modoEdicion]);

  /* 📏 Cargar medidas */
  useEffect(() => {
    const loadMedidas = async () => {
      const { data, error, status } = await supabase
        .from("mosq_medidas")
        .select("alto_mm, ancho_mm");
      console.log("[loadMedidas] status:", status, "error:", error, "rows:", data?.length);
      if (error) return;

      const uniqueAltos = [...new Set((data || []).map((d) => d.alto_mm))].sort((a, b) => a - b);
      const uniqueAnchos = [...new Set((data || []).map((d) => d.ancho_mm))].sort((a, b) => a - b);
      console.log("[loadMedidas] altos:", uniqueAltos, "anchos:", uniqueAnchos);
      setAltos(uniqueAltos);
      setAnchos(uniqueAnchos);
    };

    if (tipo || modoEdicion) {
      loadMedidas();
    }
  }, [tipo, modoEdicion]);

  /* 🎨 + 🧰 Cargar colores y accesorios */
  useEffect(() => {
    const loadOptions = async () => {
      try {
        console.log("📦 [CARGANDO CATÁLOGO] tipo:", tipo);
        console.log("   modoEdicion:", modoEdicion);

        const { data: col, error: colErr, status: colStatus } = await supabase
          .from("mosq_colores")
          .select("id, color, precio, activo, hex");
        console.log("[mosq_colores] status:", colStatus, "count:", col?.length, "error:", colErr);

        const coloresNorm = (col || [])
          .filter((c) => c.activo === true)
          .map((c) => {
            const hexNorm = normalizeHex(c.hex) || guessHexFromName(c.color);
            return {
              id: String(c.id),
              nombre: c.color,
              incremento_eur_ml: Number(c.precio_ml ?? c.incremento_ml ?? c.precio ?? 0),
              hex: hexNorm,
            };
          });
        console.log("✅ [COLORES CARGADOS]:", coloresNorm.length);
        console.table(coloresNorm);
        setColores(coloresNorm);

        const { data: acc, error: accErr, status: accStatus } = await supabase
          .from("mosq_accesorios")
          .select("*");
        console.log("[mosq_accesorios] status:", accStatus, "count:", acc?.length, "error:", accErr);

        const accesoriosNorm = (acc || [])
          .filter((a) => a.activo === true)
          .map((a) => ({
            id: a.id,
            nombre: a.nombre,
            unidad: a.unidad || "ud",
            perimetral: Boolean(a.perimetral),
            precio_unit: Number(a.precio_unit ?? a.precio ?? a.precio_ud ?? 0),
          }));
        console.log("✅ [ACCESORIOS CARGADOS]:", accesoriosNorm.length);
        console.table(accesoriosNorm);
        setAccesorios(accesoriosNorm);
      } catch (e) {
        console.error("💥 loadOptions exception:", e);
      }
    };

    if (tipo || modoEdicion) {
      loadOptions();
    }
  }, [tipo, modoEdicion]);

  /* 🎟️ Descuento cliente */
  useEffect(() => {
    const loadDesc = async () => {
      const uid = session?.user?.id;
      if (!uid) return;

      try {
        console.log("[descuento] buscando descuento para auth_user_id:", uid);

        const { data, error, status } = await supabase
          .from("administracion_usuarios")
          .select("id, auth_user_id, descuento, descuento_cliente")
          .or(`auth_user_id.eq.${uid},id.eq.${uid}`)
          .maybeSingle();

        console.log("[descuento] status:", status, "data:", data, "error:", error);

        if (error) {
          console.warn("[descuento] error:", error);
          setDescuento(0);
          return;
        }

        const pct = Number(data?.descuento ?? data?.descuento_cliente ?? 0);
        console.log("[descuento] aplicado =", pct, "%");
        setDescuento(Number.isFinite(pct) ? pct : 0);
      } catch (e) {
        console.error("[descuento] exception:", e);
        setDescuento(0);
      }
    };

    loadDesc();
  }, [session?.user?.id]);

  /* ================== CARGAR DATOS INICIALES EN MODO EDICIÓN ================== */
  useEffect(() => {
    if (!datosIniciales || !modoEdicion) return;

    console.log("📝 [MODO EDICIÓN MOSQUITERA] Cargando datos iniciales:", datosIniciales);

    // Cargar medidas
    if (datosIniciales.alto_mm) {
      console.log("   → Alto:", datosIniciales.alto_mm);
      setAlto(datosIniciales.alto_mm.toString());
    }
    if (datosIniciales.ancho_mm) {
      console.log("   → Ancho:", datosIniciales.ancho_mm);
      setAncho(datosIniciales.ancho_mm.toString());
    }

    // Cargar accesorios
    if (datosIniciales.accesorios && Array.isArray(datosIniciales.accesorios)) {
      console.log("   → Accesorios:", datosIniciales.accesorios.length);
      setAccSel(datosIniciales.accesorios);
    }

    // Cargar precio base
    if (datosIniciales.medida_precio) {
      console.log("   → Precio base:", datosIniciales.medida_precio);
      setPrecioBase(Number(datosIniciales.medida_precio));
    }

    // Cargar incremento color
    if (datosIniciales.color_precio) {
      console.log("   → Incremento color:", datosIniciales.color_precio);
      setIncColor(Number(datosIniciales.color_precio));
    }

    // Cargar descuento
    if (datosIniciales.descuento_cliente && descuento === 0) {
      console.log("   → Descuento inicial:", datosIniciales.descuento_cliente);
      setDescuento(Number(datosIniciales.descuento_cliente));
    }
  }, [datosIniciales, modoEdicion, descuento]);

  /* ================== ENCONTRAR COLOR POR NOMBRE ================== */
  useEffect(() => {
    if (!datosIniciales || !modoEdicion) return;
    if (colores.length === 0) {
      console.log("⏸️ [MODO EDICIÓN MOSQUITERA] Esperando colores...");
      return;
    }

    console.log("🔍 [MODO EDICIÓN MOSQUITERA] Buscando color...");
    console.log("   Color guardado:", datosIniciales.color);

    if (datosIniciales.color && !colorId) {
      const colorEncontrado = colores.find(
        (c) => c.nombre.toLowerCase() === datosIniciales.color.toLowerCase()
      );

      if (colorEncontrado) {
        console.log("✅ Color encontrado:", colorEncontrado);
        setColorId(String(colorEncontrado.id));
      } else {
        console.warn("⚠️ No se encontró color:", datosIniciales.color);
        console.log("   Colores disponibles:", colores.map((c) => c.nombre));
      }
    }
  }, [datosIniciales, modoEdicion, colores, colorId]);

  const colorActual = useMemo(
    () => colores.find((c) => String(c.id) === String(colorId)),
    [colores, colorId]
  );

  /* 🧮 Recalcular precios */
  useEffect(() => {
    let cancelled = false;

    const calc = async () => {
      setMsg("");
      console.log("---- RECÁLCULO ----");
      console.log("[inputs]", { alto, ancho, colorId, colorActual, accSel, descuento });

      // Precio base
      let base = 0;
      if (alto && ancho) {
        const p = await getMosqBasePrice(Number(alto), Number(ancho));
        if (cancelled) return;
        if (p == null) {
          setPrecioBase(0);
          setIncColor(0);
          setAccTotal(0);
          setTotal(0);
          setMsg("⚠️ No hay tarifa para esa combinación de medidas.");
          console.warn("[calc] SIN TARIFA para:", { alto, ancho });
          return;
        }
        base = Number(p);
      }

      // Incremento por color
      const inc =
        alto && ancho && colorActual
          ? calcColorIncrement(alto, ancho, colorActual.incremento_eur_ml)
          : 0;

      // Accesorios
      const acc = calcAccesoriosTotal(accSel);

      // Totales
      const subtotal = base + inc + acc;
      const tot = applyDiscount(subtotal, descuento);

      console.log("[calc] resultados:", { base, inc, acc, subtotal, descuento, tot });

      if (!cancelled) {
        setPrecioBase(Number(base.toFixed(2)));
        setIncColor(Number(inc.toFixed(2)));
        setAccTotal(Number(acc.toFixed(2)));
        setTotal(Number(tot.toFixed(2)));
      }
    };

    calc();
    return () => {
      cancelled = true;
    };
  }, [alto, ancho, colorActual, accSel, descuento]);

  /* ✏️ Cambiar unidades de accesorio */
  const setAccUnidades = (acc, unidades) => {
    const uds = Math.max(0, parseInt(unidades || "0", 10));
    console.log("[setAccUnidades]", { acc, unidades, uds });
    setAccSel((prev) => {
      const exists = prev.find((x) => x.id === acc.id);
      if (!exists && uds > 0) {
        const next = [
          ...prev,
          { id: acc.id, nombre: acc.nombre, precio_unit: acc.precio_unit, unidades: uds },
        ];
        console.table(next);
        return next;
      }
      if (exists) {
        if (uds === 0) {
          const next = prev.filter((x) => x.id !== acc.id);
          console.table(next);
          return next;
        }
        const next = prev.map((x) => (x.id === acc.id ? { ...x, unidades: uds } : x));
        console.table(next);
        return next;
      }
      return prev;
    });
  };

  /* 🖼️ Ruta imagen accesorio */
  const getAccImg = (nombre) => {
    const key = ACC_IMG_ALIAS[nombre] || slugImg(nombre);
    return `/assets/mosquiteras/accesorios/${key}.png`;
  };

  /* 💾 Guardar presupuesto */
  async function guardarPresupuesto() {
    // MODO EDICIÓN: usar callback
    if (modoEdicion && onSubmit) {
      const datosPresupuesto = {
        cliente: profile?.usuario || datosIniciales?.cliente || "",
        email: profile?.email || datosIniciales?.email || "",
        cif: profile?.cif || datosIniciales?.cif || null,
        alto_mm: Number(alto),
        ancho_mm: Number(ancho),
        color: colorActual?.nombre || null,
        medida_precio: Number(precioBase),
        color_precio: Number(incColor),
        accesorios: accSel.map((a) => ({
          id: a.id,
          nombre: a.nombre,
          unidades: Number(a.unidades || 0),
          precio_unit: Number(a.precio_unit || 0),
        })),
        subtotal: Number(precioBase + incColor + accTotal),
        descuento_cliente: Number(descuento),
        total: Number(total),
      };

      console.log("💾 [MODO EDICIÓN MOSQUITERA] Enviando datos:", datosPresupuesto);
      onSubmit(datosPresupuesto);
      return;
    }

    // MODO NORMAL: guardar nuevo presupuesto
    setSaving(true);
    setMsg("");
    try {
      console.log("===== GUARDAR PRESUPUESTO =====");
      console.log("[session]", session?.user?.id);
      console.log("[profile]", profile);

      if (!session?.user?.id) {
        console.warn("[guardar] no hay sesión");
        router.push("/login?m=login-required");
        return;
      }
      if (!alto || !ancho || !precioBase) {
        console.warn("[guardar] faltan medidas o precioBase", { alto, ancho, precioBase });
        setMsg("⚠️ Completa medidas válidas antes de guardar.");
        return;
      }

      const subtotalCalc = Number(precioBase) + Number(incColor) + Number(accTotal);
      const colorNombre = colorActual?.nombre || null;

      const payload = {
        user_id: session.user.id,
        cliente: profile?.usuario || "",
        email: profile?.email || "",
        cif: profile?.cif || null,
        tipo: `mosquitera-${tipo || ""}`,
        alto_mm: Number(alto),
        ancho_mm: Number(ancho),
        medida_precio: Number(precioBase),
        color: colorNombre,
        color_precio: Number(incColor),
        accesorios: accSel.map((a) => ({
          id: a.id,
          nombre: a.nombre,
          unidades: Number(a.unidades || 0),
          precio_unit: Number(a.precio_unit || 0),
        })),
        subtotal: Number(subtotalCalc),
        descuento_cliente: Number(descuento),
        total: Number(total),
        pagado: false,
      };

      console.log("[payload json] >>>");
      console.log(JSON.stringify(payload, null, 2));

      const { data, error, status } = await supabase
        .from("presupuestos")
        .insert([payload])
        .select("id")
        .maybeSingle();

      console.log("[insert presupuestos] status:", status);
      console.log("[insert presupuestos] data:", data);
      if (error) {
        console.error("[insert presupuestos] error:", error);
        setMsg(`❌ No se pudo guardar el presupuesto: ${error.message || "error desconocido"}`);
        return;
      }

      setMsg("✅ Presupuesto guardado correctamente.");

      setTimeout(() => {
        router.push("/mis-presupuestos");
      }, 1500);
    } catch (e) {
      console.error("💥 [guardarPresupuesto] exception:", e);
      setMsg(`❌ Error inesperado: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Head>
        <title>{`Configurar Mosquitera ${tipo || ""} · PresuProsol`}</title>
      </Head>
      {!modoEdicion && <Header />}

      <main className={`container ${!modoEdicion ? 'py-5' : ''}`} style={{ maxWidth: 1024 }}>
        {!modoEdicion && (
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h1 className="h4 m-0" style={{ color: "var(--primary)" }}>
              Configurar mosquitera {tipo ? `· ${tipo}` : ""}
            </h1>
            <button className="btn btn-outline-secondary" onClick={() => router.push("/mosquiteras")}>
              ← Volver
            </button>
          </div>
        )}

        <div className="card shadow-sm" style={{ borderRadius: 16 }}>
          <div className="card-body p-4">
            <div className="row g-4">
              {/* Medidas */}
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Alto (mm)</label>
                <select className="form-select" value={alto} onChange={(e) => setAlto(e.target.value)}>
                  <option value="">Selecciona alto…</option>
                  {altos.map((v) => (
                    <option key={v} value={v}>
                      {v} mm
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Ancho (mm)</label>
                <select className="form-select" value={ancho} onChange={(e) => setAncho(e.target.value)}>
                  <option value="">Selecciona ancho…</option>
                  {anchos.map((v) => (
                    <option key={v} value={v}>
                      {v} mm
                    </option>
                  ))}
                </select>
              </div>

              {/* Accesorios */}
              <div className="col-12">
                <label className="form-label fw-semibold d-block mb-3">Accesorios</label>
                {accesorios.length === 0 && <p className="text-muted">No hay accesorios disponibles</p>}
                <div className="row g-3">
                  {accesorios.map((a) => {
                    const sel = accSel.find((x) => x.id === a.id)?.unidades || 0;
                    const img = getAccImg(a.nombre);
                    return (
                      <div className="col-12 col-md-6" key={a.id}>
                        <div className="d-flex gap-3 align-items-center border rounded p-3">
                          <div style={{ width: 60, height: 60, position: "relative", flex: "0 0 60px" }}>
                            <Image
                              src={img}
                              alt={a.nombre}
                              fill
                              sizes="60px"
                              style={{ objectFit: "contain", borderRadius: 8 }}
                              unoptimized
                            />
                          </div>
                          <div className="flex-fill">
                            <div className="fw-semibold">{a.nombre}</div>
                            <small className="text-muted">
                              {a.precio_unit.toFixed(2)} € / {a.unidad || "ud"}
                              {a.perimetral && " · perimetral"}
                            </small>
                          </div>
                          <div style={{ minWidth: 90 }}>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              className="form-control form-control-sm"
                              value={sel || ""}
                              onChange={(e) => setAccUnidades(a, e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {accSel.length > 0 && (
                  <small className="text-muted d-block mt-2">
                    💡 Total accesorios: <strong>{accTotal.toFixed(2)} €</strong>
                  </small>
                )}
              </div>

              {/* Colores */}
              <div className="col-12">
                <label className="form-label fw-semibold d-block mb-3">Color</label>
                {colores.length === 0 && <p className="text-muted">No hay colores disponibles</p>}
                <div className="row g-2">
                  {colores.map((c) => {
                    const selected = String(c.id) === String(colorId);
                    return (
                      <div className="col-6 col-md-4 col-lg-3" key={c.id}>
                        <button
                          type="button"
                          className={`w-100 d-flex align-items-center gap-2 border rounded p-3 ${
                            selected ? "border-primary border-2 bg-light" : "border-1"
                          }`}
                          onClick={() => setColorId(selected ? "" : String(c.id))}
                          title={c.nombre}
                          style={{ transition: "all 0.2s ease" }}
                        >
                          <span
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              backgroundColor: c.hex || guessHexFromName(c.nombre),
                              border:
                                (c.hex || "").toUpperCase() === "#FFFFFF"
                                  ? "1px solid #ddd"
                                  : "1px solid rgba(0,0,0,0.05)",
                              boxShadow: selected ? "0 0 0 3px rgba(99,102,241,0.35)" : "none",
                              display: "inline-block",
                            }}
                          />
                          <div className="text-start flex-fill">
                            <div className="fw-semibold small">{c.nombre}</div>
                            <small className="text-muted">
                              +{c.incremento_eur_ml.toFixed(2)} €/ml
                            </small>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
                {colorActual && alto && ancho && (
                  <small className="text-muted d-block mt-2">
                    💡 Incremento por color: <strong>{incColor.toFixed(2)} €</strong>
                  </small>
                )}
              </div>

              {/* Resumen */}
              <div className="col-12">
                <hr />
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Precio base:</span>
                    <strong className="text-muted">{precioBase.toFixed(2)} €</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Color:</span>
                    <strong className="text-muted">{incColor.toFixed(2)} €</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Accesorios:</span>
                    <strong className="text-muted">{accTotal.toFixed(2)} €</strong>
                  </div>

                  {descuento > 0 && (
                    <>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Subtotal:</span>
                        <strong className="text-muted">{(precioBase + incColor + accTotal).toFixed(2)} €</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Descuento ({descuento}%):</span>
                        <strong className="text-muted text-danger">
                          -{((precioBase + incColor + accTotal) * (descuento / 100)).toFixed(2)} €
                        </strong>
                      </div>
                    </>
                  )}

                  {descuento === 0 && (
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Descuento cliente:</span>
                      <strong className="text-muted">{descuento}%</strong>
                    </div>
                  )}

                  <hr />
                  <div className="d-flex justify-content-between fs-4">
                    <span className="fw-bold">TOTAL:</span>
                    <strong className="fw-bold" style={{ color: "#198754" }}>{total.toFixed(2)} €</strong>
                  </div>
                </div>
              </div>

              {msg && (
                <div className={`col-12 alert ${msg.startsWith("✅") ? "alert-success" : "alert-warning"} mb-0`}>
                  {msg}
                </div>
              )}

              <div className="col-12">
                <button
                  className="btn w-100"
                  style={{ background: "var(--accent)", color: "var(--surface)", fontWeight: 600 }}
                  onClick={guardarPresupuesto}
                  disabled={saving || guardando || !alto || !ancho || !precioBase}
                >
                  {(saving || guardando) ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {modoEdicion ? "Actualizando…" : "Guardando…"}
                    </>
                  ) : (
                    <>{modoEdicion ? "💾 Guardar Cambios" : "💾 Guardar presupuesto"}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {!modoEdicion && <Footer />}
    </>
  );
}
