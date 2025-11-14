// src/pages/proteccion-solar/[tipo].js
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import useAuth from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";

export default function ConfigProteccionSolar() {
  const router = useRouter();
  const { tipo } = router.query;
  const { session, profile, loading } = useAuth();

  // Catálogo
  const [modelos, setModelos] = useState([]);
  const [colores, setColores] = useState([]);
  const [accesorios, setAccesorios] = useState([]);

  // Selección
  const [modeloId, setModeloId] = useState("");
  const [colorId, setColorId] = useState("");
  const [alto, setAlto] = useState(""); // mm
  const [ancho, setAncho] = useState(""); // mm
  const [accSel, setAccSel] = useState([]);

  // Precios
  const [precioM2, setPrecioM2] = useState(null);
  const [precioBase, setPrecioBase] = useState(0);
  const [incrementoColor, setIncrementoColor] = useState(0);
  const [accTotal, setAccTotal] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [total, setTotal] = useState(0);

  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const tituloTipo = {
    "toldos-brazos": "Toldos de brazos",
    "toldos-punto-recto": "Toldos de punto recto",
    "screen-vertical": "Screen vertical"
  }[tipo] || "Protección Solar";

  // Calcular seleccionados
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
    if (!loading && !session) {
      router.replace("/login?m=login-required");
    }
  }, [loading, session, router]);

  /* ================== CARGA CATÁLOGO ================== */
  useEffect(() => {
    const load = async () => {
      try {
        // MODELOS
        const { data: m, error: mErr } = await supabase
          .from("proteccionsolar_modelos")
          .select("*");

        if (mErr) {
          console.error("[proteccionsolar_modelos] error:", mErr);
          setModelos([]);
        } else {
          const activos = (m || []).filter((x) => x.activo === true);
          setModelos(activos.sort((a, b) => a.nombre.localeCompare(b.nombre)));
        }

        // COLORES ESTRUCTURA
        const { data: c, error: cErr } = await supabase
          .from("proteccionsolar_colores_estructura")
          .select("*");

        if (cErr) {
          console.error("[proteccionsolar_colores_estructura] error:", cErr);
          setColores([]);
        } else {
          const activos = (c || []).filter((x) => x.activo === true);
          setColores(activos.sort((a, b) => (a.orden || 0) - (b.orden || 0)));
        }

        // ACCESORIOS
        const { data: acc, error: accErr } = await supabase
          .from("proteccionsolar_accesorios")
          .select("*");

        if (accErr) {
          console.error("[proteccionsolar_accesorios] error:", accErr);
          setAccesorios([]);
        } else {
          const activos = (acc || []).filter((x) => x.activo === true);
          setAccesorios(activos.sort((a, b) => a.nombre.localeCompare(b.nombre)));
        }
      } catch (e) {
        console.error("[load catálogo] exception:", e);
      }
    };

    if (tipo) load();
  }, [tipo]);

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
        console.error("[proteccion-solar descuento] exception:", e);
        setDescuento(0);
      }
    };

    loadDesc();
  }, [session?.user?.id]);

  /* ================== PRECIO BASE (€/m²) ================== */
  useEffect(() => {
    const loadPrecio = async () => {
      setPrecioM2(null);
      if (!modeloId || !colorId) return;

      try {
        const { data, error } = await supabase
          .from("proteccionsolar_precios")
          .select("*")
          .eq("modelo_id", modeloId)
          .eq("color_id", colorId)
          .maybeSingle();

        if (error || !data) {
          console.warn("[precio] no encontrado para", { modeloId, colorId });
          setPrecioM2(null);
        } else {
          setPrecioM2(Number(data.precio_m2 || 0));
        }
      } catch (e) {
        console.error("[loadPrecio] exception:", e);
        setPrecioM2(null);
      }
    };

    loadPrecio();
  }, [modeloId, colorId]);

  /* ================== INCREMENTO COLOR ================== */
  useEffect(() => {
    if (!colorSel) {
      setIncrementoColor(0);
      return;
    }
    setIncrementoColor(Number(colorSel.incremento_m2 || 0));
  }, [colorSel]);

  /* ================== CÁLCULOS ================== */
  useEffect(() => {
    const altoM = Number(alto || 0) / 1000;
    const anchoM = Number(ancho || 0) / 1000;
    const areaM2 = altoM * anchoM;

    // Precio base
    const pBase = precioM2 !== null ? precioM2 * areaM2 : 0;
    setPrecioBase(+pBase.toFixed(2));

    // Accesorios
    const acc = accSel.reduce((sum, a) => {
      return sum + Number(a.pvp || 0) * Number(a.unidades || 0);
    }, 0);
    setAccTotal(+acc.toFixed(2));

    // Subtotal y total con descuento
    const subtotal = pBase + (incrementoColor * areaM2) + acc;
    const desc = subtotal * (descuento / 100);
    const tot = subtotal - desc;
    setTotal(+tot.toFixed(2));
  }, [alto, ancho, precioM2, incrementoColor, accSel, descuento]);

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

  /* ================== GUARDAR ================== */
  async function guardar() {
    setSaving(true);
    setMsg("");

    try {
      if (!session?.user?.id) {
        router.push("/login?m=login-required");
        return;
      }

      if (!modeloId || !colorId || !alto || !ancho) {
        setMsg("⚠️ Completa todos los campos requeridos.");
        return;
      }

      if (precioM2 === null) {
        setMsg("⚠️ No hay precio disponible para esta combinación. Contacta con administración.");
        return;
      }

      const altoM = Number(alto) / 1000;
      const anchoM = Number(ancho) / 1000;
      const areaM2 = altoM * anchoM;
      const precioColorTotal = incrementoColor * areaM2;
      const subtotal = Number(precioBase) + Number(precioColorTotal) + Number(accTotal);

      const payload = {
        user_id: session.user.id,
        cliente: profile?.usuario || "",
        email: profile?.email || "",
        cif: profile?.cif || null,
        tipo: `proteccion-solar-${tipo}`,
        alto_mm: Number(alto),
        ancho_mm: Number(ancho),
        medida_precio: Number(precioBase),
        color: colorSel?.nombre || null,
        color_precio: Number(precioColorTotal),
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
        <title>Configurar {tituloTipo} · PresuProsol</title>
      </Head>
      <Header />

      <main className="container py-4" style={{ maxWidth: 980 }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h1 className="h4 m-0">{tituloTipo}</h1>
          <button
            className="btn btn-outline-secondary"
            onClick={() => router.push("/proteccion-solar")}
          >
            ← Volver
          </button>
        </div>

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
                  {modelos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color estructura */}
              <div className="col-12 col-md-6">
                <label className="form-label">Color estructura</label>
                <select
                  className="form-select"
                  value={colorId}
                  onChange={(e) => setColorId(e.target.value)}
                >
                  <option value="">Selecciona color…</option>
                  {colores.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {incrementoColor > 0 && `(+${incrementoColor.toFixed(2)} €/m²)`}
                    </option>
                  ))}
                </select>

                {precioM2 === null && modeloId && colorId && (
                  <small className="text-danger d-block mt-1">
                    Precio: consultar
                  </small>
                )}

                {precioM2 !== null && modeloId && colorId && (
                  <small className="text-muted d-block mt-1">
                    Precio base: {Number(precioM2).toFixed(2)} €/m²
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

              {/* Accesorios */}
              <div className="col-12">
                <label className="form-label d-block">Accesorios</label>
                <div className="row g-2">
                  {accesorios.map((a) => {
                    const sel = accSel.find((x) => x.id === a.id)?.unidades || 0;
                    return (
                      <div className="col-12 col-md-6" key={a.id}>
                        <div className="d-flex align-items-center justify-content-between border rounded p-2">
                          <div>
                            <div className="fw-semibold">{a.nombre}</div>
                            <small className="text-muted">
                              {Number(a.pvp || 0).toFixed(2)} € / {a.unidad}
                            </small>
                          </div>
                          <div style={{ minWidth: 120 }}>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              className="form-control"
                              value={sel}
                              onChange={(e) => onSetAccUnidades(a, e.target.value)}
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

              {/* Resumen */}
              <div className="col-12">
                <hr />
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between">
                    <span>Precio base:</span>
                    <strong>{precioBase.toFixed(2)} €</strong>
                  </div>
                  {incrementoColor > 0 && (
                    <div className="d-flex justify-content-between">
                      <span>Incremento color:</span>
                      <strong>{(incrementoColor * (Number(alto) * Number(ancho) / 1000000)).toFixed(2)} €</strong>
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

              {msg && (
                <div
                  className={`col-12 alert ${
                    msg.startsWith("✅") ? "alert-success" : "alert-warning"
                  } mb-0`}
                >
                  {msg}
                </div>
              )}

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
                    !modeloId ||
                    !colorId ||
                    !alto ||
                    !ancho ||
                    precioM2 === null
                  }
                >
                  {saving ? "⏳ Guardando…" : "💾 Guardar presupuesto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}