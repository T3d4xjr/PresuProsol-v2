// src/pages/compactos/[tipo].js
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import useAuth from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";

export default function ConfigCompacto() {
  const router = useRouter();
  const { tipo } = router.query; // 'pvc' | 'aluminio'
  const { session, profile, loading } = useAuth();

  // Catálogo
  const [modelos, setModelos] = useState([]);
  const [acabados, setAcabados] = useState([]);
  const [accesorios, setAccesorios] = useState([]);

  // Selección
  const [modeloId, setModeloId] = useState("");
  const [acabadoId, setAcabadoId] = useState("");
  const [alto, setAlto] = useState(""); // mm
  const [ancho, setAncho] = useState(""); // mm
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

  // 🔥 MOVER AQUÍ: Calcular modeloSel y acabadoSel ANTES de los useEffect
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
        // MODELOS - sin RLS
        const { data: m, error: mErr } = await supabase
          .from("compactos_modelos")
          .select("*")
          .eq("tipo", tipo || "aluminio");

        if (mErr) {
          console.error("[compactos_modelos] error:", mErr);
          setModelos([]);
        } else {
          // Filtrar activos en cliente
          const activos = (m || []).filter((x) => x.activo === true);
          setModelos(activos.sort((a, b) => a.nombre.localeCompare(b.nombre)));
        }

        // ACABADOS - sin RLS
        const { data: a, error: aErr } = await supabase
          .from("compactos_acabados")
          .select("*");

        if (aErr) {
          console.error("[compactos_acabados] error:", aErr);
          setAcabados([]);
        } else {
          // Filtrar activos y ordenar en cliente
          const activos = (a || []).filter((x) => x.activo === true);
          setAcabados(activos.sort((a, b) => (a.orden || 0) - (b.orden || 0)));
        }

        // ACCESORIOS - sin RLS
        const { data: acc, error: accErr } = await supabase
          .from("compactos_accesorios")
          .select("*");

        if (accErr) {
          console.error("[compactos_accesorios] error:", accErr);
          setAccesorios([]);
        } else {
          // Filtrar activos y ordenar en cliente
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

        // Verificar QUÉ HAY en la tabla de precios
        const { data: allPrecios, error: allErr } = await supabase
          .from("compactos_guias_precios")
          .select("*");

        if (allErr) {
          console.error("❌ [ERROR] No se puede leer compactos_guias_precios:", allErr);
          return;
        }

        console.log("📊 [TABLA compactos_guias_precios] Total registros:", allPrecios?.length || 0);
        
        if (allPrecios && allPrecios.length > 0) {
          console.table(allPrecios);
        } else {
          console.warn("⚠️ La tabla compactos_guias_precios está VACÍA");
        }

        // Buscar el precio específico
        const { data, error } = await supabase
          .from("compactos_guias_precios")
          .select("*")
          .eq("modelo_id", modeloId)
          .eq("acabado_id", acabadoId)
          .maybeSingle();

        if (error) {
          console.error("❌ [ERROR en búsqueda]:", error);
          setPrecioGuiaMl(null);
          return;
        }

        if (!data) {
          console.warn("⚠️ NO ENCONTRADO - Buscando combinación:");
          console.warn("   modelo_id:", modeloId);
          console.warn("   acabado_id:", acabadoId);
          console.warn("💡 SOLUCIÓN: Inserta este registro en Supabase:");
          console.log(`
INSERT INTO compactos_guias_precios (modelo_id, acabado_id, precio_ml)
VALUES ('${modeloId}', '${acabadoId}', 15.00);
          `);
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
    // Convertir medidas a metros
    const altoM = Number(alto || 0) / 1000;
    const anchoM = Number(ancho || 0) / 1000;
    const perimetroM = (altoM + anchoM) * 2;

    // Precio guías
    const pGuias = precioGuiaMl !== null ? precioGuiaMl * perimetroM : 0;
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

  /* ================== GUARDAR ================== */
  async function guardar() {
    setSaving(true);
    setMsg("");

    try {
      if (!session?.user?.id) {
        router.push("/login?m=login-required");
        return;
      }

      if (!modeloId || !acabadoId || !alto || !ancho) {
        setMsg("⚠️ Completa todos los campos requeridos.");
        return;
      }

      if (precioGuiaMl === null) {
        setMsg("⚠️ No hay precio disponible para esta combinación. Contacta con administración.");
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
            onClick={() => router.push("/compactos")}
          >
            ← Volver
          </button>
        </div>

        <div className="card shadow-sm">
          <div className="card-body">
            <div className="row g-3">
              {/* Modelo */}
              <div className="col-12 col-md-6">
                <label className="form-label">Modelo de guía</label>
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

                {precioGuiaMl === null && modeloId && acabadoId && (
                  <small className="text-danger d-block mt-1">
                    Precio guías: consultar
                  </small>
                )}

                {precioGuiaMl !== null && modeloId && acabadoId && (
                  <small className="text-muted d-block mt-1">
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
                    <span>Precio guías:</span>
                    <strong>{precioGuias.toFixed(2)} €</strong>
                  </div>
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
                    !acabadoId ||
                    !alto ||
                    !ancho ||
                    precioGuiaMl === null
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
