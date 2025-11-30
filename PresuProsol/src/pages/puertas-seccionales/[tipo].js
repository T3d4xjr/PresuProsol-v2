// src/pages/puertas-seccionales/[tipo].js
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../api/supabaseClient";

export default function ConfigPuertaSeccional({
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

  const tituloTipo =
    tipo === "residencial"
      ? "Puerta Seccional Residencial"
      : "Puerta Seccional Industrial";

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

  /* ================== CARGA CATÁLOGO ================== */
  useEffect(() => {
    const load = async () => {
      try {
        console.log("🔄 Cargando catálogo puertas…");

        // MEDIDAS
        const { data: m, error: mErr } = await supabase
          .from("puertas_medidas")
          .select("*");

        if (mErr) {
          console.error("[puertas_medidas] error:", mErr);
          setMedidas([]);
        } else {
          const sortedMedidas = (m || []).sort((a, b) => {
            if (a.ancho_mm !== b.ancho_mm) return a.ancho_mm - b.ancho_mm;
            return a.alto_mm - b.alto_mm;
          });

          setMedidas(sortedMedidas);
        }

        // COLORES
        const { data: c, error: cErr } = await supabase
          .from("puertas_colores")
          .select("*");

        if (cErr) {
          console.error("[puertas_colores] error:", cErr);
          setColores([]);
        } else {
          setColores((c || []).filter((x) => x.activo === true));
        }

        // ACCESORIOS
        const { data: acc, error: accErr } = await supabase
          .from("puertas_accesorios")
          .select("*");

        if (accErr) {
          console.error("[puertas_accesorios] error:", accErr);
          setAccesorios([]);
        } else {
          setAccesorios((acc || []).filter((x) => x.activo === true));
        }
      } catch (e) {
        console.error("💥 Error cargando catálogo:", e);
      }
    };

    if (tipo || modoEdicion) load();
  }, [tipo, modoEdicion]);

  /* ================== DESCUENTO CLIENTE ================== */
  useEffect(() => {
    const loadDesc = async () => {
      if (!session?.user?.id) return;

      const uid = session.user.id;

      try {
        const { data, error } = await supabase
          .from("administracion_usuarios")
          .select("id, auth_user_id, descuento, descuento_cliente")
          .or(`auth_user_id.eq.${uid},id.eq.${uid}`)
          .maybeSingle();

        if (error || !data) {
          setDescuento(0);
          return;
        }

        const pct = Number(data?.descuento ?? data?.descuento_cliente ?? 0);
        setDescuento(Number.isFinite(pct) ? pct : 0);
      } catch (e) {
        console.error("[puertas descuento] exception:", e);
        setDescuento(0);
      }
    };

    loadDesc();
  }, [session?.user?.id]);

  /* ================== CARGAR DATOS INICIALES EN MODO EDICIÓN ================== */
  useEffect(() => {
    if (!datosIniciales || !modoEdicion) return;

    console.log("📝 [MODO EDICIÓN PUERTA SECCIONAL] Cargando datos iniciales:", datosIniciales);

    // Medida - buscar por alto y ancho
    if (datosIniciales.alto_mm && datosIniciales.ancho_mm && medidas.length > 0) {
      const medidaEncontrada = medidas.find(
        (m) => m.alto_mm === Number(datosIniciales.alto_mm) && 
               m.ancho_mm === Number(datosIniciales.ancho_mm)
      );
      if (medidaEncontrada) {
        console.log("   → Medida encontrada:", medidaEncontrada.ancho_mm, "×", medidaEncontrada.alto_mm);
        setMedidaId(String(medidaEncontrada.id));
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
        const { data, error } = await supabase
          .from("puertas_precios")
          .select(`
            *,
            color:puertas_colores(*)
          `)
          .eq("ancho_mm", medida.ancho_mm)
          .eq("alto_mm", medida.alto_mm)
          .eq("color_id", color.id)
          .maybeSingle();

        if (error || !data) {
          console.warn("[precio puertas] no encontrado:", error);
          setPrecioBase(null);
          return;
        }

        setPrecioBase(Number(data.precio || 0));

        if (data.color?.incremento_eur_m2) {
          const area =
            (medida.ancho_mm * medida.alto_mm) / 1_000_000;
          const inc = area * Number(data.color.incremento_eur_m2);
          setIncrementoColor(+inc.toFixed(2));
        }
      } catch (e) {
        console.error("💥 Error precio:", e);
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
          .map((x) =>
            x.id === acc.id ? { ...x, unidades: uds } : x
          )
          .filter((x) => x.unidades > 0);
      }

      return prev;
    });
  };

  /* ================== FUNCIÓN PARA OBTENER IMAGEN ACCESORIO ================== */
  function getImagenAccesorio(nombreAccesorio) {
    if (!nombreAccesorio) return null;

    const nombre = nombreAccesorio.toLowerCase();

    if (nombre.includes("centralita")) {
      return "/assets/puertasGaraje/accesorios/centralita.png";
    }

    if (nombre.includes("decodificador")) {
      return "/assets/puertasGaraje/accesorios/decodificador.png";
    }

    if (nombre.includes("emisor")) {
      return "/assets/puertasGaraje/accesorios/emisor.png";
    }

    if (nombre.includes("fotocelula") || nombre.includes("fotocélula")) {
      return "/assets/puertasGaraje/accesorios/fotocelula.png";
    }

    if (nombre.includes("kit") && nombre.includes("fijacion")) {
      return "/assets/puertasGaraje/accesorios/kitFijacion.png";
    }

    if (nombre.includes("llavero")) {
      return "/assets/puertasGaraje/accesorios/llavero.png";
    }

    if (nombre.includes("luz") && nombre.includes("parpadeante")) {
      return "/assets/puertasGaraje/accesorios/luzParpadeante.png";
    }

    if (nombre.includes("manivela")) {
      return "/assets/puertasGaraje/accesorios/manivelaMonoblock.png";
    }

    if (nombre.includes("motor")) {
      return "/assets/puertasGaraje/accesorios/motor.png";
    }

    if (nombre.includes("pulsador")) {
      return "/assets/puertasGaraje/accesorios/pulsadorPared.png";
    }

    if (nombre.includes("sensor")) {
      return "/assets/puertasGaraje/accesorios/sensorRadio.png";
    }

    if (nombre.includes("tarjeta")) {
      return "/assets/puertasGaraje/accesorios/tarjeta.png";
    }

    if (nombre.includes("unidad") && nombre.includes("mando")) {
      return "/assets/puertasGaraje/accesorios/unidadMando.png";
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
        alto_mm: medidaSel?.alto_mm || 0,
        ancho_mm: medidaSel?.ancho_mm || 0,
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

      console.log("💾 [MODO EDICIÓN PUERTA SECCIONAL] Enviando datos:", datosPresupuesto);
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

      if (!medidaId || !colorId) {
        setMsg("⚠️ Completa todos los campos requeridos.");
        return;
      }

      if (precioBase === null) {
        setMsg("⚠️ No hay precio disponible para esta combinación. Contacta con administración.");
        return;
      }

      const subtotal = (precioBase || 0) + incrementoColor + accTotal;

      const payload = {
        user_id: session.user.id,
        cliente: profile?.usuario || "",
        email: profile?.email || "",
        cif: profile?.cif || null,
        tipo: `puerta-seccional-${tipo}`,
        alto_mm: medidaSel?.alto_mm || 0,
        ancho_mm: medidaSel?.ancho_mm || 0,
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

      console.log("💾 [GUARDANDO PUERTA]", payload);

      const { error } = await supabase
        .from("presupuestos")
        .insert([payload]);

      if (error) {
        console.error("[insert presupuesto]", error);
        setMsg(`❌ No se pudo guardar: ${error.message}`);
        return;
      }

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

      <main className={`container ${!modoEdicion ? 'py-4' : ''}`} style={{ maxWidth: 980 }}>
        {!modoEdicion && (
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h1 className="h4 m-0">{tituloTipo}</h1>
            <button
              className="btn btn-outline-secondary"
              onClick={() => router.push("/puertas-seccionales")}
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
                <label className="form-label">Medida (ancho × alto)</label>
                <select
                  className="form-select"
                  value={medidaId}
                  onChange={(e) => setMedidaId(e.target.value)}
                >
                  <option value="">Selecciona medida…</option>
                  {medidas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.ancho_mm} × {m.alto_mm} mm
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
                <label className="form-label d-block">
                  Accesorios
                </label>

                {accesorios.length === 0 && (
                  <small className="text-muted">No hay accesorios disponibles</small>
                )}

                {accesorios.length > 0 && (
                  <div className="row g-2">
                    {accesorios.map((a) => {
                      const sel = accSel.find((x) => x.id === a.id)?.unidades || 0;
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
                                  flexShrink: 0
                                }}
                                onError={(e) => {
                                  console.error("❌ Error cargando imagen:", imagenUrl);
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
                              step={1}
                              className="form-control"
                              style={{ width: 80 }}
                              value={sel}
                              onChange={(e) => onSetAccUnidades(a, e.target.value)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {accSel.length > 0 && (
                  <small className="text-muted d-block mt-2">
                    💡 Total accesorios: <strong>{accTotal.toFixed(2)} €</strong>
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
                    saving || guardando ||
                    !medidaId ||
                    !colorId ||
                    precioBase === null
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
