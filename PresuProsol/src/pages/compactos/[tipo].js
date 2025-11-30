// src/pages/compactos/[tipo].js
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

// MAPEO DE IMÁGENES DE ACCESORIOS
const ACCESORIO_IMAGENES = {
  "capsulaAluminio.png": "capsulaAluminio.png",
  "capsulaDiagonal.png": "capsulaDiagonal.png",
  "capsulaPlastico.png": "capsulaPlastico.png",
  "discoPlastico.png": "discoPlastico.png",
};

// Función para obtener la imagen del accesorio
const getAccesorioImagen = (nombreAccesorio) => {
  console.log("🔍 [getAccesorioImagen] Buscando imagen para:", nombreAccesorio);

  if (!nombreAccesorio) return null;

  const nombre = nombreAccesorio.toLowerCase();
  console.log("   → nombre normalizado:", nombre);

  if (nombre.includes("capsula") && nombre.includes("aluminio")) {
    console.log("   ✅ Match: capsulaAluminio.png");
    return "/assets/persianasCompacto/accesorios/capsulaAluminio.png";
  }
  if (nombre.includes("capsula") && nombre.includes("diagonal")) {
    console.log("   ✅ Match: capsulaDiagonal.png");
    return "/assets/persianasCompacto/accesorios/capsulaDiagonal.png";
  }
  if (nombre.includes("capsula") && nombre.includes("plastico")) {
    console.log("   ✅ Match: capsulaPlastico.png");
    return "/assets/persianasCompacto/accesorios/capsulaPlastico.png";
  }
  if (nombre.includes("disco") && nombre.includes("plastico")) {
    console.log("   ✅ Match: discoPlastico.png");
    return "/assets/persianasCompacto/accesorios/discoPlastico.png";
  }
  if (nombre.includes("tubo") || nombre.includes("eje")) {
    console.log("   ✅ Match: tuboEje.png");
    return "/assets/persianasCompacto/accesorios/tuboEje.png";
  }

  console.log("   ❌ No match encontrado");
  return null;
};

export default function ConfigCompacto({
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

  // Catálogo
  const [modelos, setModelos] = useState([]);
  const [acabados, setAcabados] = useState([]);
  const [accesorios, setAccesorios] = useState([]);

  // Selección - INICIALIZAR con datosIniciales si existe
  const [modeloId, setModeloId] = useState("");
  const [acabadoId, setAcabadoId] = useState("");
  const [alto, setAlto] = useState("");
  const [ancho, setAncho] = useState("");
  const [accSel, setAccSel] = useState([]);

  // Precios
  const [precioGuiaMl, setPrecioGuiaMl] = useState(null);
  const [precioGuias, setPrecioGuias] = useState(0);
  const [accTotal, setAccTotal] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [total, setTotal] = useState(0);

  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const tituloTipo =
    tipo === "pvc"
      ? "Compacto cajón PVC"
      : tipo === "aluminio"
      ? "Compacto cajón aluminio"
      : "Compacto";

  const modeloSel = useMemo(
    () => modelos.find((m) => m.id === modeloId),
    [modelos, modeloId]
  );
  const acabadoSel = useMemo(
    () => acabados.find((a) => a.id === acabadoId),
    [acabados, acabadoId]
  );

  /* ================== ACCESO ================== */
  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login?m=login-required");
    }
  }, [loading, session, router]);

  /* ================== CARGA CATÁLOGO ================== */
  useEffect(() => {
    const load = async () => {
      try {
        console.log("📦 [CARGANDO CATÁLOGO] tipo:", tipo);
        console.log("   modoEdicion:", modoEdicion);

        // MODELOS - filtrados por tipo
        const { data: m, error: mErr } = await supabase
          .from("compactos_modelos")
          .select("*")
          .eq("activo", true)
          .order("nombre");

        if (mErr) {
          console.error("❌ [compactos_modelos] error:", mErr);
          setModelos([]);
        } else {
          console.log("✅ [MODELOS CARGADOS]:", m?.length);
          console.table(m);
          setModelos(m || []);
        }

        // ACABADOS
        const { data: a, error: aErr } = await supabase
          .from("compactos_acabados")
          .select("*")
          .eq("activo", true)
          .order("orden");

        if (aErr) {
          console.error("❌ [compactos_acabados] error:", aErr);
          setAcabados([]);
        } else {
          console.log("✅ [ACABADOS CARGADOS]:", a?.length);
          console.table(a);
          setAcabados(a || []);
        }

        // ACCESORIOS
        const { data: acc, error: accErr } = await supabase
          .from("compactos_accesorios")
          .select("*")
          .eq("activo", true)
          .order("nombre");

        if (accErr) {
          console.error("❌ [compactos_accesorios] error:", accErr);
          setAccesorios([]);
        } else {
          console.log("✅ [ACCESORIOS CARGADOS]:", acc?.length);
          console.table(acc);
          setAccesorios(acc || []);
        }
      } catch (e) {
        console.error("❌ [load catálogo] exception:", e);
      }
    };

    // CARGAR SIEMPRE - tanto en modo normal como edición
    if (tipo || modoEdicion) {
      console.log("🔄 Iniciando carga de catálogo...");
      load();
    } else {
      console.log("⏸️ Esperando tipo o modo edición...");
    }
  }, [tipo, modoEdicion]); // IMPORTANTE: agregar modoEdicion como dependencia

  /* ================== DESCUENTO CLIENTE ================== */
  useEffect(() => {
    const loadDesc = async () => {
      if (!session?.user?.id) return;

      const uid = session.user.id;

      try {
        console.log("[compactos descuento] buscando para auth_user_id:", uid);

        const { data, error, status } = await supabase
          .from("administracion_usuarios")
          .select("id, auth_user_id, descuento, descuento_cliente")
          .or(`auth_user_id.eq.${uid},id.eq.${uid}`)
          .maybeSingle();

        console.log(
          "[compactos descuento] status:",
          status,
          "data:",
          data,
          "error:",
          error
        );

        if (error) {
          console.warn("[compactos descuento] error:", error);
          setDescuento(0);
          return;
        }

        if (!data) {
          console.warn("[compactos descuento] no se encontró usuario");
          setDescuento(0);
          return;
        }

        const pct = Number(data?.descuento ?? data?.descuento_cliente ?? 0);
        console.log("[compactos descuento] aplicado =", pct, "%");

        setDescuento(Number.isFinite(pct) ? pct : 0);
      } catch (e) {
        console.error("[compactos descuento] exception:", e);
        setDescuento(0);
      }
    };

    loadDesc();
  }, [session?.user?.id]);

  /* ================== PRECIO GUÍAS (€/ml) ================== */
  useEffect(() => {
    const loadPrecioGuia = async () => {
      setPrecioGuiaMl(null);
      if (!modeloId || !acabadoId) return;

      try {
        console.log("🔍 [BUSCANDO PRECIO]");
        console.log("   modelo_id seleccionado:", modeloId);
        console.log("   acabado_id seleccionado:", acabadoId);
        console.log("   modelo nombre:", modeloSel?.nombre);
        console.log("   acabado nombre:", acabadoSel?.nombre);

        const { data, error } = await supabase
          .from("compactos_guias_precios")
          .select("precio_ml")
          .eq("modelo_id", modeloId)
          .eq("acabado_id", acabadoId)
          .maybeSingle();

        if (error) {
          console.error("❌ [ERROR en búsqueda]:", error);
          setPrecioGuiaMl(null);
          return;
        }

        if (!data) {
          console.warn("⚠️ NO ENCONTRADO precio para combinación:");
          console.warn("   modelo_id:", modeloId);
          console.warn("   acabado_id:", acabadoId);
          setPrecioGuiaMl(null);
        } else {
          console.log("✅ PRECIO ENCONTRADO:", data.precio_ml, "€/ml");
          setPrecioGuiaMl(Number(data.precio_ml || 0));
        }
      } catch (e) {
        console.error("💥 EXCEPTION:", e);
        setPrecioGuiaMl(null);
      }
    };

    loadPrecioGuia();
  }, [modeloId, acabadoId, modeloSel, acabadoSel]);

  /* ================== CÁLCULOS ================== */
  useEffect(() => {
    // Convertimos a número de forma segura (acepta coma o punto)
    const altoNum = alto ? parseFloat(String(alto).replace(",", ".")) : 0;
    const anchoNum = ancho ? parseFloat(String(ancho).replace(",", ".")) : 0;

    const tieneMedidas =
      altoNum > 0 && anchoNum > 0 && precioGuiaMl !== null && !isNaN(precioGuiaMl);

    let pGuias = 0;

    if (tieneMedidas) {
      const altoM = altoNum / 1000;
      const anchoM = anchoNum / 1000;
      const perimetroM = (altoM + anchoM) * 2;
      pGuias = precioGuiaMl * perimetroM;
    }

    setPrecioGuias(+pGuias.toFixed(2));

    // Accesorios
    const acc = accSel.reduce((sum, a) => {
      return sum + Number(a.pvp || 0) * Number(a.unidades || 0);
    }, 0);
    setAccTotal(+acc.toFixed(2));

    // Subtotal y total con descuento
    const subtotal = pGuias + acc;
    const desc = subtotal * (descuento / 100);
    const tot = subtotal - desc;
    setTotal(+tot.toFixed(2));

    console.log("[CÁLCULOS]", {
      altoNum,
      anchoNum,
      precioGuiaMl,
      pGuias,
      acc,
      subtotal,
      desc,
      tot,
    });
  }, [alto, ancho, precioGuiaMl, accSel, descuento]);

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

  /* ================== CARGAR DATOS INICIALES EN MODO EDICIÓN ================== */
  useEffect(() => {
    if (!datosIniciales || !modoEdicion) return;

    console.log("📝 [MODO EDICIÓN] Cargando datos iniciales:", datosIniciales);

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

    // Cargar descuento (solo si no viene del perfil)
    if (datosIniciales.descuento_cliente && descuento === 0) {
      console.log("   → Descuento inicial:", datosIniciales.descuento_cliente);
      setDescuento(Number(datosIniciales.descuento_cliente));
    }
  }, [datosIniciales, modoEdicion, descuento]);

  /* ================== ENCONTRAR MODELO Y ACABADO POR NOMBRE ================== */
  useEffect(() => {
    if (!datosIniciales || !modoEdicion) return;
    if (modelos.length === 0 || acabados.length === 0) {
      console.log("⏸️ [MODO EDICIÓN] Esperando catálogos...");
      console.log("   Modelos:", modelos.length, "Acabados:", acabados.length);
      return;
    }

    console.log("🔍 [MODO EDICIÓN] Buscando modelo y acabado...");
    console.log("   Color guardado:", datosIniciales.color);
    console.log("   Tipo presupuesto:", datosIniciales.tipo);

    // Buscar acabado por nombre (guardado en color)
    if (datosIniciales.color && !acabadoId) {
      const acabadoEncontrado = acabados.find(
        a => a.nombre.toLowerCase() === datosIniciales.color.toLowerCase()
      );
      
      if (acabadoEncontrado) {
        console.log("✅ Acabado encontrado:", acabadoEncontrado);
        setAcabadoId(acabadoEncontrado.id);
      } else {
        console.warn("⚠️ No se encontró acabado:", datosIniciales.color);
        console.log("   Acabados disponibles:", acabados.map(a => a.nombre));
      }
    }

    // Si no hay un modelo específico guardado, seleccionar el primero disponible
    if (modelos.length > 0 && !modeloId) {
      console.log("ℹ️ Seleccionando primer modelo disponible:", modelos[0].nombre);
      setModeloId(modelos[0].id);
    }

  }, [datosIniciales, modoEdicion, modelos, acabados, modeloId, acabadoId]);

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
        medida_precio: Number(precioGuias),
        accesorios: accSel.map((a) => ({
          id: a.id,
          nombre: a.nombre,
          unidades: Number(a.unidades || 0),
          precio_unit: Number(a.pvp || 0),
        })),
        subtotal: Number(precioGuias + accTotal),
        descuento_cliente: Number(descuento),
        total: Number(total),
      };

      console.log("💾 [MODO EDICIÓN] Enviando datos:", datosPresupuesto);
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

      if (!modeloId || !acabadoId || !alto || !ancho) {
        setMsg("⚠️ Completa todos los campos requeridos.");
        setSaving(false);
        return;
      }

      if (precioGuiaMl === null) {
        setMsg(
          "⚠️ No hay precio disponible para esta combinación. Contacta con administración."
        );
        setSaving(false);
        return;
      }

      const subtotal = Number(precioGuias) + Number(accTotal);

      const payload = {
        user_id: session.user.id,
        cliente: profile?.usuario || "",
        email: profile?.email || "",
        cif: profile?.cif || null,
        tipo: `compacto-${tipo}`,
        alto_mm: Number(alto),
        ancho_mm: Number(ancho),
        medida_precio: Number(precioGuias),
        color: acabadoSel?.nombre || null,
        color_precio: 0,
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

      console.log("[guardar compacto] payload:", payload);

      const { data, error } = await supabase
        .from("presupuestos")
        .insert([payload])
        .select("id")
        .maybeSingle();

      if (error) {
        console.error("[insert presupuesto]", error);
        setMsg(`❌ No se pudo guardar: ${error.message}`);
        return;
      }

      setMsg("✅ Presupuesto guardado correctamente.");

      setTimeout(() => {
        router.push("/mis-presupuestos");
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
        <title>Configurar Compacto Cajón {tipo?.toUpperCase()} · PresuProsol</title>
      </Head>
      
      {/* Solo mostrar Header principal si NO está en modo edición */}
      {!modoEdicion && <Header />}

      <main className={`container ${!modoEdicion ? 'py-5' : ''}`} style={{ maxWidth: 1024 }}>
        {/* 🔥 ESTE ES EL HEADER SECUNDARIO - Solo mostrarlo si NO está en modo edición */}
        {!modoEdicion && (
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h1 className="h4 m-0" style={{ color: "var(--primary)" }}>
              Compacto cajón {tipo?.toUpperCase()}
            </h1>
            <button
              className="btn btn-outline-secondary"
              onClick={() => router.push("/compactos")}
            >
              ← Volver
            </button>
          </div>
        )}

        <div className="card shadow-sm" style={{ borderRadius: 16 }}>
          <div className="card-body p-4">
            <div className="row g-4">
              {/* Modelo */}
              <div className="col-12 col-md-6">
                <label className="form-label">Modelo de guía</label>
                <select
                  className="form-select"
                  value={modeloId}
                  onChange={(e) => {
                    console.log("🔄 Modelo seleccionado:", e.target.value);
                    const modelo = modelos.find(
                      (m) => m.id === e.target.value
                    );
                    console.log("   Datos del modelo:", modelo);
                    setModeloId(e.target.value);
                  }}
                >
                  <option value="">Selecciona modelo…</option>
                  {modelos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
                <small className="text-muted d-block mt-1">
                  Total modelos: {modelos.length}
                </small>
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

                {!modeloId && !acabadoId && (
                  <small className="text-muted d-block mt-1">
                    Selecciona modelo y acabado
                  </small>
                )}

                {modeloId && !acabadoId && (
                  <small className="text-muted d-block mt-1">
                    Selecciona un acabado
                  </small>
                )}

                {modeloId && acabadoId && precioGuiaMl === null && (
                  <small className="text-danger d-block mt-1">
                    Precio guías: consultar
                  </small>
                )}

                {modeloId && acabadoId && precioGuiaMl !== null && (
                  <small className="text-success d-block mt-1 fw-semibold">
                    Precio guías: {Number(precioGuiaMl).toFixed(2)} €/ml
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
                <label className="form-label d-block mb-3">Accesorios</label>
                <div className="row g-3">
                  {accesorios.map((a) => {
                    const sel =
                      accSel.find((x) => x.id === a.id)?.unidades || 0;
                    const imgSrc = getAccesorioImagen(a.nombre);

                    return (
                      <div className="col-12 col-md-6 col-lg-4" key={a.id}>
                        <div
                          className="card h-100 shadow-sm"
                          style={{
                            transition: "transform 0.2s, box-shadow 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                            e.currentTarget.style.boxShadow =
                              "0 4px 12px rgba(0,0,0,0.15)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform =
                              "translateY(0)";
                            e.currentTarget.style.boxShadow =
                              "0 2px 8px rgba(0,0,0,0.08)";
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

                          {/* Sin imagen */}
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
                            <h6
                              className="card-title mb-2"
                              style={{ fontSize: 14, fontWeight: 600 }}
                            >
                              {a.nombre}
                            </h6>
                            <p
                              className="text-muted mb-3"
                              style={{ fontSize: 13 }}
                            >
                              {Number(a.pvp || 0).toFixed(2)} € / {a.unidad}
                            </p>

                            <div className="d-flex align-items-center gap-2">
                              <label
                                className="form-label mb-0"
                                style={{ fontSize: 13 }}
                              >
                                Unidades:
                              </label>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                className="form-control form-control-sm"
                                value={sel}
                                onChange={(e) =>
                                  onSetAccUnidades(a, e.target.value)
                                }
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
                    Total accesorios:{" "}
                    <strong>{accTotal.toFixed(2)} €</strong>
                  </div>
                )}
              </div>

              {/* Resumen */}
              <div className="col-12">
                <hr />
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">
                      Precio guías{precioGuiaMl !== null ? ` (${precioGuiaMl.toFixed(2)} €/ml)` : ''}:
                    </span>
                    <strong className="text-muted">
                      {precioGuias.toFixed(2)} €
                    </strong>
                  </div>

                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Accesorios:</span>
                    <strong className="text-muted">
                      {accTotal.toFixed(2)} €
                    </strong>
                  </div>

                  {descuento > 0 && (
                    <>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Subtotal:</span>
                        <strong className="text-muted">
                          {(precioGuias + accTotal).toFixed(2)} €
                        </strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Descuento ({descuento}%):</span>
                        <strong className="text-muted text-danger">
                          -{((precioGuias + accTotal) * (descuento / 100)).toFixed(2)} €
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
                    msg.startsWith("✅") ? "alert-success" : "alert-warning"
                  } mb-0`}
                >
                  {msg}
                </div>
              )}

              {/* Botón final */}
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
                    (saving || guardando) ||
                    !modeloId ||
                    !acabadoId ||
                    !alto ||
                    !ancho ||
                    precioGuiaMl === null
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
