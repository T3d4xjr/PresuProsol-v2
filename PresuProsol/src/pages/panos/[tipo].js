// src/pages/panos/[tipo].js
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../api/supabaseClient";

import {
  getPanoPricePerM2,
  calcAreaM2,
  calcAccesoriosTotal,
  applyDiscount,
} from "../api/pricingPanos";

// MAPEO DE IMÁGENES DE ACCESORIOS
const ACCESORIO_IMAGENES = {
  "cajillaRecogedor.png": "cajillaRecogedor.png",
  "capsulaMetalica.png": "capsulaMetalica.png",
  "cinta.png": "cinta.png",
  "DiscoMetalico.png": "DiscoMetalico.png",
  "pasacintas.png": "pasacintas.png",
  "placarecogedor.png": "placarecogedor.png",
  "recogerdorAbatible.png": "recogerdorAbatible.png",
  "recogerdorPlastico.png": "recogerdorPlastico.png",
  "recogerdorMetalico.png": "recogerdorMetalico.png",
  "rodamiento.png": "rodamiento.png",
  "soporte.png": "soporte.png",
  "tubo.png": "tubo.png",
};

// Función para obtener la imagen del accesorio
const getAccesorioImagen = (nombreAccesorio) => {
  if (!nombreAccesorio) return null;

  const nombre = nombreAccesorio.toLowerCase();

  if (nombre.includes("cajilla") || nombre.includes("recogedor cajilla")) {
    return "/assets/panos/accesorios/cajillaRecogedor.png";
  }
  if (nombre.includes("cápsula") || nombre.includes("capsula") || nombre.includes("metalica")) {
    return "/assets/panos/accesorios/capsulaMetalica.png";
  }
  if (nombre.includes("cinta") && !nombre.includes("pasacinta")) {
    return "/assets/panos/accesorios/cinta.png";
  }
  if (nombre.includes("disco") || nombre.includes("metálico disco")) {
    return "/assets/panos/accesorios/DiscoMetalico.png";
  }
  if (nombre.includes("pasacinta") || nombre.includes("pasa cinta")) {
    return "/assets/panos/accesorios/pasacintas.png";
  }
  if (nombre.includes("placa") && nombre.includes("recogedor")) {
    return "/assets/panos/accesorios/placarecogedor.png";
  }
  if (nombre.includes("recogedor abatible")) {
    return "/assets/panos/accesorios/recogerdorAbatible.png";
  }
  if (nombre.includes("recogedor") && nombre.includes("plástico")) {
    return "/assets/panos/accesorios/recogerdorPlastico.png";
  }
  if (nombre.includes("recogedor") && nombre.includes("metálico")) {
    return "/assets/panos/accesorios/recogerdorMetalico.png";
  }
  if (nombre.includes("rodamiento")) {
    return "/assets/panos/accesorios/rodamiento.png";
  }
  if (nombre.includes("soporte")) {
    return "/assets/panos/accesorios/soporte.png";
  }
  if (nombre.includes("tubo")) {
    return "/assets/panos/accesorios/tubo.png";
  }

  return null;
};

export default function ConfigPanos({
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
  const [acabados, setAcabados] = useState([]);
  const [accesorios, setAccesorios] = useState([]);

  const [modeloId, setModeloId] = useState("");
  const [acabadoId, setAcabadoId] = useState("");
  const [alto, setAlto] = useState("");
  const [ancho, setAncho] = useState("");
  const [accSel, setAccSel] = useState([]);

  const [precioM2, setPrecioM2] = useState(null);
  const [areaM2, setAreaM2] = useState(0);
  const [base, setBase] = useState(0);
  const [accTotal, setAccTotal] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [total, setTotal] = useState(0);

  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  /* ================== ACCESO ================== */
  useEffect(() => {
    if (!loading && !session && !modoEdicion) {
      router.replace("/login?m=login-required");
    }
  }, [loading, session, router, modoEdicion]);

  /* ================== CARGA CATÁLOGO ================== */
  useEffect(() => {
    const load = async () => {
      console.log("📦 [CARGANDO CATÁLOGO PAÑOS]");

      // MODELOS
      const { data: m, error: mErr } = await supabase
        .from("panos_modelos")
        .select("id,tipo,nombre,activo")
        .eq("activo", true)
        .order("tipo")
        .order("nombre");

      if (mErr) {
        console.error("[panos_modelos] error:", mErr);
        setModelos([]);
      } else {
        console.log("✅ Modelos cargados:", m?.length);
        setModelos(m || []);
      }

      // ACABADOS
      const { data: a, error: aErr } = await supabase
        .from("panos_acabados")
        .select("id,clave,nombre,activo,orden")
        .eq("activo", true)
        .order("orden");

      if (aErr) {
        console.error("[panos_acabados] error:", aErr);
        setAcabados([]);
      } else {
        console.log("✅ Acabados cargados:", a?.length);
        setAcabados(a || []);
      }

      // ACCESORIOS
      const { data: acc, error: accErr } = await supabase
        .from("panos_accesorios")
        .select("id,nombre,unidad,pvp,activo")
        .eq("activo", true)
        .order("nombre");

      if (accErr) {
        console.error("[panos_accesorios] error:", accErr);
        setAccesorios([]);
      } else {
        console.log("✅ Accesorios cargados:", acc?.length);
        setAccesorios(acc || []);
      }
    };

    if (tipo || modoEdicion) {
      load();
    }
  }, [tipo, modoEdicion]);

  /* ================== DESCUENTO CLIENTE ================== */
  useEffect(() => {
    const loadDesc = async () => {
      if (!session?.user?.id) return;

      const uid = session.user.id;

      try {
        console.log("[panos descuento] buscando para auth_user_id:", uid);

        const { data, error, status } = await supabase
          .from("administracion_usuarios")
          .select("id, auth_user_id, descuento, descuento_cliente")
          .or(`auth_user_id.eq.${uid},id.eq.${uid}`)
          .maybeSingle();

        console.log("[panos descuento] status:", status, "data:", data, "error:", error);

        if (error) {
          console.warn("[panos descuento] error:", error);
          setDescuento(0);
          return;
        }

        const pct = Number(data?.descuento ?? data?.descuento_cliente ?? 0);
        console.log("[panos descuento] aplicado =", pct, "%");
        setDescuento(Number.isFinite(pct) ? pct : 0);
      } catch (e) {
        console.error("[panos descuento] exception:", e);
        setDescuento(0);
      }
    };

    loadDesc();
  }, [session?.user?.id]);

  /* ================== CARGAR DATOS INICIALES EN MODO EDICIÓN ================== */
  useEffect(() => {
    if (!datosIniciales || !modoEdicion) return;

    console.log("📝 [MODO EDICIÓN PAÑOS] Cargando datos iniciales:", datosIniciales);

    if (datosIniciales.alto_mm) {
      console.log("   → Alto:", datosIniciales.alto_mm);
      setAlto(datosIniciales.alto_mm.toString());
    }
    if (datosIniciales.ancho_mm) {
      console.log("   → Ancho:", datosIniciales.ancho_mm);
      setAncho(datosIniciales.ancho_mm.toString());
    }

    if (datosIniciales.accesorios && Array.isArray(datosIniciales.accesorios)) {
      console.log("   → Accesorios:", datosIniciales.accesorios.length);
      // Convertir pvp a precio_unit para compatibilidad
      const accesoriosNormalizados = datosIniciales.accesorios.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        pvp: Number(a.precio_unit || a.pvp || 0),
        unidades: Number(a.unidades || 0),
      }));
      setAccSel(accesoriosNormalizados);
    }

    if (datosIniciales.medida_precio) {
      console.log("   → Precio base:", datosIniciales.medida_precio);
      setBase(Number(datosIniciales.medida_precio));
    }

    if (datosIniciales.descuento_cliente && descuento === 0) {
      console.log("   → Descuento inicial:", datosIniciales.descuento_cliente);
      setDescuento(Number(datosIniciales.descuento_cliente));
    }
  }, [datosIniciales, modoEdicion, descuento]);

  /* ================== ENCONTRAR MODELO Y ACABADO POR NOMBRE ================== */
  useEffect(() => {
    if (!datosIniciales || !modoEdicion) return;
    if (modelos.length === 0 || acabados.length === 0) return;

    // Color contiene el nombre del acabado
    if (datosIniciales.color && !acabadoId) {
      const acabadoEncontrado = acabados.find(
        (a) => a.nombre.toLowerCase() === datosIniciales.color.toLowerCase()
      );

      if (acabadoEncontrado) {
        console.log("✅ Acabado encontrado:", acabadoEncontrado);
        setAcabadoId(String(acabadoEncontrado.id));
      } else {
        console.warn("⚠️ No se encontró acabado:", datosIniciales.color);
      }
    }

    // Intentar detectar modelo desde tipo si no hay otra info
    // El tipo suele ser "paño-completo" o "paño-lamas"
    if (!modeloId && modelos.length > 0) {
      // Por defecto seleccionar el primer modelo disponible
      // O puedes implementar lógica más específica si guardas el modelo en algún campo
      console.log("ℹ️ No hay modelo guardado, usando primer modelo disponible");
      setModeloId(String(modelos[0].id));
    }
  }, [datosIniciales, modoEdicion, modelos, acabados, modeloId, acabadoId]);

  /* ================== PRECIO €/m² ================== */
  useEffect(() => {
    const run = async () => {
      setPrecioM2(null);
      if (!modeloId || !acabadoId) return;

      const p = await getPanoPricePerM2(modeloId, acabadoId);
      setPrecioM2(p);
    };

    run();
  }, [modeloId, acabadoId]);

  /* ================== CÁLCULOS ================== */
  useEffect(() => {
    const area = calcAreaM2(alto, ancho);
    setAreaM2(+area.toFixed(4));

    const baseImporte =
      precioM2 == null
        ? 0
        : +(area * Number(precioM2 || 0)).toFixed(2);
    setBase(baseImporte);

    const acc = calcAccesoriosTotal(accSel);
    setAccTotal(+acc.toFixed(2));

    const subtotal = baseImporte + acc;
    const tot = applyDiscount(subtotal, descuento);
    setTotal(+tot.toFixed(2));
  }, [alto, ancho, precioM2, accSel, descuento]);

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
          .map((x) =>
            x.id === acc.id ? { ...x, unidades: uds } : x
          )
          .filter((x) => (x.unidades || 0) > 0);
      }

      return prev;
    });
  };

  const modeloSel = useMemo(
    () => modelos.find((m) => m.id === modeloId),
    [modelos, modeloId]
  );
  const acabadoSel = useMemo(
    () => acabados.find((a) => a.id === acabadoId),
    [acabados, acabadoId]
  );

  /* ================== GUARDAR ================== */
  async function guardar() {
    // MODO EDICIÓN: usar callback
    if (modoEdicion && onSubmit) {
      const datosPresupuesto = {
        cliente: profile?.usuario || datosIniciales?.cliente || "",
        email: profile?.email || datosIniciales?.email || "",
        cif: profile?.cif || datosIniciales?.cif || null,
        alto_mm: Number(alto),
        ancho_mm: Number(ancho),
        color: acabadoSel?.nombre || null,
        medida_precio: Number(base),
        accesorios: accSel.map((a) => ({
          id: a.id,
          nombre: a.nombre,
          unidades: Number(a.unidades || 0),
          precio_unit: Number(a.pvp || 0),
        })),
        subtotal: Number(base + accTotal),
        descuento_cliente: Number(descuento),
        total: Number(total),
      };

      console.log("💾 [MODO EDICIÓN PAÑOS] Enviando datos:", datosPresupuesto);
      onSubmit(datosPresupuesto);
      return;
    }

    // MODO NORMAL: guardar nuevo presupuesto
    setSaving(true);
    setMsg("");

    try {
      console.log("===== GUARDAR PRESUPUESTO PAÑOS =====");
      console.log("[session]", session?.user?.id);
      console.log("[profile]", profile);

      if (!session?.user?.id) {
        console.warn("[guardar] no hay sesión");
        router.push("/login?m=login-required");
        return;
      }

      if (!modeloId || !acabadoId || !alto || !ancho) {
        console.warn("[guardar] faltan datos", { modeloId, acabadoId, alto, ancho });
        setMsg("⚠️ Completa modelo, acabado y medidas.");
        return;
      }

      if (precioM2 === null) {
        console.warn("[guardar] precio no disponible");
        setMsg("⚠️ No hay precio disponible para esta combinación. Contacta con administración.");
        return;
      }

      const subtotalCalc = Number(base) + Number(accTotal);
      const acabadoNombre = acabadoSel?.nombre || null;

      const payload = {
        user_id: session.user.id,
        cliente: profile?.usuario || "",
        email: profile?.email || "",
        cif: profile?.cif || null,
        tipo: `paño-${tipo || "completo"}`,
        alto_mm: Number(alto),
        ancho_mm: Number(ancho),
        medida_precio: Number(base),
        color: acabadoNombre,
        color_precio: 0,
        accesorios: accSel.map((a) => ({
          id: a.id,
          nombre: a.nombre,
          unidades: Number(a.unidades || 0),
          precio_unit: Number(a.pvp || 0),
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
      setTimeout(() => router.push("/mis-presupuestos"), 1500);
    } catch (e) {
      console.error("💥 [guardarPresupuesto] exception:", e);
      setMsg(`❌ Error inesperado: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  }

  /* ================== RENDER ================== */
  return (
    <>
      <Head>
        <title>Configurar Paño · PresuProsol</title>
      </Head>

      {!modoEdicion && <Header />}

      <main className={`container ${!modoEdicion ? 'py-4' : ''}`} style={{ maxWidth: 980 }}>
        {!modoEdicion && (
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h1 className="h4 m-0">
              Configurar {tipo === "lamas" ? "lamas sueltas" : "paño completo"}
            </h1>
            <button
              className="btn btn-outline-secondary"
              onClick={() => router.push("/panos")}
            >
              ← Volver
            </button>
          </div>
        )}

        <div className="card shadow-sm">
          <div className="card-body">
            <div className="row g-3">
              {/* Modelo */}
              <div className="col-12 col-md-6">
                <label className="form-label">Modelo</label>
                <select
                  className="form-select"
                  value={modeloId}
                  onChange={(e) => setModeloId(e.target.value)}
                >
                  <option value="">Selecciona modelo…</option>
                  {["perfilado", "extrusionado", "pvc", "enrollable"].map(
                    (t) => {
                      const group = modelos.filter(
                        (m) => m.tipo === t
                      );
                      if (!group.length) return null;
                      return (
                        <optgroup key={t} label={t.toUpperCase()}>
                          {group.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.nombre}
                            </option>
                          ))}
                        </optgroup>
                      );
                    }
                  )}
                </select>
              </div>

              {/* Acabado */}
              <div className="col-12 col-md-6">
                <label className="form-label">Acabado</label>
                <select
                  className="form-select"
                  value={acabadoId}
                  onChange={(e) => setAcabadoId(e.target.value)}
                >
                  <option value="">Selecciona acabado…</option>
                  {acabados.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>

                {precioM2 === null && modeloId && acabadoId && (
                  <small className="text-danger d-block mt-1">
                    Precio: consultar
                  </small>
                )}

                {precioM2 != null && modeloId && acabadoId && (
                  <small className="text-muted d-block mt-1">
                    Precio: {Number(precioM2).toFixed(2)} €/m²
                  </small>
                )}
              </div>

              {/* Medidas */}
              <div className="col-12 col-md-6">
                <label className="form-label">Alto (mm)</label>
                <input
                  className="form-control"
                  type="number"
                  min={0}
                  value={alto}
                  onChange={(e) => setAlto(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Ancho (mm)</label>
                <input
                  className="form-control"
                  type="number"
                  min={0}
                  value={ancho}
                  onChange={(e) => setAncho(e.target.value)}
                />
              </div>

              {/* ACCESORIOS CON IMÁGENES */}
              <div className="col-12">
                <label className="form-label d-block mb-3">
                  Accesorios
                </label>
                <div className="row g-3">
                  {accesorios.map((a) => {
                    const sel = accSel.find((x) => x.id === a.id)?.unidades || 0;
                    const imgSrc = getAccesorioImagen(a.nombre);

                    return (
                      <div className="col-12 col-md-6 col-lg-4" key={a.id}>
                        <div 
                          className="card h-100 shadow-sm"
                          style={{
                            transition: "transform 0.2s, box-shadow 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                          }}
                        >
                          {/* Imagen */}
                          {imgSrc && (
                            <div
                              style={{
                                height: 180,
                                overflow: "hidden",
                                background: "#f8f9fa",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <img
                                src={imgSrc}
                                alt={a.nombre}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain",
                                  padding: "0.5rem",
                                }}
                              />
                            </div>
                          )}

                          {/* Sin imagen - solo icono */}
                          {!imgSrc && (
                            <div
                              style={{
                                height: 180,
                                overflow: "hidden",
                                background: "#f8f9fa",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 48,
                                color: "#dee2e6",
                              }}
                            >
                              📦
                            </div>
                          )}

                          {/* Info y control */}
                          <div className="card-body">
                            <h6 className="card-title mb-2" style={{ fontSize: 14, fontWeight: 600 }}>
                              {a.nombre}
                            </h6>
                            <p className="text-muted mb-3" style={{ fontSize: 13 }}>
                              {Number(a.pvp || 0).toFixed(2)} € / {a.unidad}
                            </p>

                            <div className="d-flex align-items-center gap-2">
                              <label className="form-label mb-0" style={{ fontSize: 13 }}>
                                Unidades:
                              </label>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                className="form-control form-control-sm"
                                value={sel}
                                onChange={(e) => onSetAccUnidades(a, e.target.value)}
                                style={{ maxWidth: 80 }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {accSel.length > 0 && (
                  <div className="alert alert-info mt-3 mb-0">
                    💡 Total accesorios: <strong>{accTotal.toFixed(2)} €</strong>
                  </div>
                )}
              </div>

              {/* Resumen */}
              <div className="col-12">
                <hr />
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Área:</span>
                    <strong className="text-muted">{areaM2.toFixed(3)} m²</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Precio base:</span>
                    <strong className="text-muted">
                      {base.toFixed(2)} €
                      {precioM2 === null && " (consultar)"}
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Accesorios:</span>
                    <strong className="text-muted">{accTotal.toFixed(2)} €</strong>
                  </div>

                  {descuento > 0 && (
                    <>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Subtotal:</span>
                        <strong className="text-muted">{(base + accTotal).toFixed(2)} €</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Descuento ({descuento}%):</span>
                        <strong className="text-muted text-danger">
                          -{((base + accTotal) * (descuento / 100)).toFixed(2)} €
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
                    <strong className="fw-bold" style={{ color: "#198754" }}>
                      {total.toFixed(2)} €
                    </strong>
                  </div>
                </div>
              </div>

              {msg && (
                <div
                  className={`col-12 alert ${
                    msg.startsWith("✅")
                      ? "alert-success"
                      : "alert-warning"
                  } mb-0`}
                >
                  {msg}
                </div>
              )}

              <div className="col-12">
                <button
                  className="btn w-100"
                  style={{ background: "var(--accent)", color: "var(--surface)", fontWeight: 600 }}
                  onClick={guardar}
                  disabled={
                    saving ||
                    guardando ||
                    !modeloId ||
                    !acabadoId ||
                    !alto ||
                    !ancho ||
                    precioM2 === null
                  }
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

    </>
  );
}
