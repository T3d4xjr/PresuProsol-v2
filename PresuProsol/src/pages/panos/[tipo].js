// src/pages/panos/[tipo].js
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import useAuth from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";

import {
  getPanoPricePerM2,
  calcAreaM2,
  calcAccesoriosTotal,
  applyDiscount,
} from "../../lib/pricingPanos";

export default function ConfigPanos() {
  const router = useRouter();
  const { tipo } = router.query; // 'pano' | 'lamas'
  const { session, profile, loading } = useAuth();

  // datos catálogo
  const [modelos, setModelos] = useState([]); // [{id,tipo,nombre}]
  const [acabados, setAcabados] = useState([]); // [{id,clave,nombre}]
  const [accesorios, setAccesorios] = useState([]); // [{id,nombre,unidad,pvp}]

  // selección
  const [modeloId, setModeloId] = useState("");
  const [acabadoId, setAcabadoId] = useState("");
  const [alto, setAlto] = useState(""); // mm
  const [ancho, setAncho] = useState(""); // mm
  const [accSel, setAccSel] = useState([]); // [{id,nombre,pvp,unidades}]

  // importes
  const [precioM2, setPrecioM2] = useState(null); // null = consultar
  const [areaM2, setAreaM2] = useState(0);
  const [base, setBase] = useState(0);
  const [accTotal, setAccTotal] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [total, setTotal] = useState(0);

  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  /* ================== ACCESO ================== */
  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login?m=login-required");
    }
  }, [loading, session, router]);

  /* ================== CARGA CATÁLOGO ================== */
  useEffect(() => {
    const load = async () => {
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
        setAccesorios(acc || []);
      }
    };

    load();
  }, []);

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

        if (!data) {
          console.warn("[panos descuento] no se encontró usuario");
          setDescuento(0);
          return;
        }

        // Priorizar descuento (campo principal), luego descuento_cliente
        const pct = Number(data?.descuento ?? data?.descuento_cliente ?? 0);
        console.log("[panos descuento] aplicado =", pct, "%", {
          descuento: data?.descuento,
          descuento_cliente: data?.descuento_cliente,
          calculado: pct
        });

        setDescuento(Number.isFinite(pct) ? pct : 0);
      } catch (e) {
        console.error("[panos descuento] exception:", e);
        setDescuento(0);
      }
    };

    loadDesc();
  }, [session?.user?.id]);

  /* ================== PRECIO €/m² ================== */
  useEffect(() => {
    const run = async () => {
      setPrecioM2(null);
      if (!modeloId || !acabadoId) return;

      const p = await getPanoPricePerM2(modeloId, acabadoId);
      // puede ser null -> "consultar"
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

      // 🔥 PAYLOAD con alto_mm y ancho_mm (igual que mosquiteras)
      const payload = {
        user_id: session.user.id,
        cliente: profile?.usuario || "",
        email: profile?.email || "",
        cif: profile?.cif || null,
        tipo: `paño-${tipo || "completo"}`,
        alto_mm: Number(alto), // 🔥 CAMBIADO
        ancho_mm: Number(ancho), // 🔥 CAMBIADO
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
        console.error("[insert detalles]", {
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          message: error?.message,
        });
        setMsg(`❌ No se pudo guardar el presupuesto: ${error.message || "error desconocido"}`);
        return;
      }

      setMsg("✅ Presupuesto guardado correctamente.");
      setTimeout(() => router.push("/pedidos"), 2000);
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

      <Header />

      <main className="container py-4" style={{ maxWidth: 980 }}>
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

              {/* Accesorios */}
              <div className="col-12">
                <label className="form-label d-block">
                  Accesorios
                </label>
                <div className="row g-2">
                  {accesorios.map((a) => {
                    const sel =
                      accSel.find((x) => x.id === a.id)?.unidades ||
                      0;
                    return (
                      <div
                        className="col-12 col-md-6"
                        key={a.id}
                      >
                        <div className="d-flex align-items-center justify-content-between border rounded p-2">
                          <div>
                            <div className="fw-semibold">
                              {a.nombre}
                            </div>
                            <small className="text-muted">
                              {Number(a.pvp || 0).toFixed(2)} € /{" "}
                              {a.unidad}
                            </small>
                          </div>
                          <div style={{ minWidth: 120 }}>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              className="form-control"
                              value={sel}
                              onChange={(e) =>
                                onSetAccUnidades(
                                  a,
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {accSel.length > 0 && (
                  <small className="text-muted d-block mt-2">
                    💡 Total accesorios:{" "}
                    <strong>
                      {accTotal.toFixed(2)} €
                    </strong>
                  </small>
                )}
              </div>

              {/* Resumen */}
              <div className="col-12">
                <hr />
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between">
                    <span>Área:</span>
                    <strong>{areaM2.toFixed(3)} m²</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Precio base:</span>
                    <strong>
                      {base.toFixed(2)} €
                      {precioM2 === null && " (consultar)"}
                    </strong>
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
                    !modeloId ||
                    !acabadoId ||
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
