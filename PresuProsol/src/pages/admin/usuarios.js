// src/pages/admin/usuarios.js
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useAuth from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function UsuariosAdmin() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [msg, setMsg] = useState("");

  // 🔒 Solo admins
  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.replace("/login");
      } else if (profile?.rol !== "admin") {
        router.replace("/perfil");
      }
    }
  }, [loading, session, profile, router]);

  // Cargar lista inicial
  useEffect(() => {
    if (profile?.rol === "admin") {
      fetchUsuarios();
    }
  }, [profile]);

  async function fetchUsuarios() {
    setLoadingData(true);
    setMsg("");

    const { data, error } = await supabase
      .from("administracion_usuarios")
      .select(
        "id, usuario, email, cif, rol, habilitado, created_at, descuento"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando usuarios:", error);
      setMsg("❌ Error cargando usuarios.");
      setUsuarios([]);
    } else {
      setUsuarios(data || []);
    }

    setLoadingData(false);
  }

  // ✅ Habilitar usuario (crea/actualiza su fila operativa en `usuarios`)
  async function habilitarUsuario(u) {
    setMsg("");
    try {
      const { error: upErr } = await supabase
        .from("administracion_usuarios")
        .update({ habilitado: true })
        .eq("id", u.id);
      if (upErr) throw upErr;

      const now = new Date().toISOString();

      const { error: insErr } = await supabase
        .from("usuarios")
        .upsert(
          [
            {
              id: u.id,
              usuario: u.usuario,
              email: u.email,
              cif: u.cif,
              habilitado: true,
              rol: u.rol || "usuario",
              created_at: now,
              updated_at: now,
            },
          ],
          { onConflict: "id" }
        );
      if (insErr) throw insErr;

      setMsg("✅ Usuario habilitado correctamente.");
      fetchUsuarios();
    } catch (err) {
      console.error("Error al habilitar:", err);
      setMsg("❌ No se pudo habilitar el usuario.");
    }
  }

  // 🚫 Deshabilitar usuario (elimina su fila operativa en `usuarios`)
  async function deshabilitarUsuario(u) {
    setMsg("");
    try {
      const { error: upErr } = await supabase
        .from("administracion_usuarios")
        .update({ habilitado: false })
        .eq("id", u.id);
      if (upErr) throw upErr;

      const { error: delErr } = await supabase
        .from("usuarios")
        .delete()
        .eq("id", u.id);
      if (delErr) throw delErr;

      setMsg("✅ Usuario deshabilitado y eliminado de usuarios.");
      fetchUsuarios();
    } catch (err) {
      console.error("Error al deshabilitar:", err);
      setMsg("❌ No se pudo deshabilitar el usuario.");
    }
  }

  // 🔁 Cambiar rol (admin/usuario)
  async function cambiarRol(u, nuevoRol) {
    setMsg("");
    try {
      const role = nuevoRol === "admin" ? "admin" : "usuario";

      const { error: upAdminErr } = await supabase
        .from("administracion_usuarios")
        .update({ rol: role })
        .eq("id", u.id);
      if (upAdminErr) throw upAdminErr;

      if (u.habilitado) {
        const { error: upUsrErr } = await supabase
          .from("usuarios")
          .update({ rol: role })
          .eq("id", u.id);
        if (upUsrErr) throw upUsrErr;
      }

      setMsg("✅ Rol actualizado correctamente.");
      fetchUsuarios();
    } catch (err) {
      console.error("Error al cambiar rol:", err);
      setMsg("❌ No se pudo cambiar el rol.");
    }
  }

  // 💾 Cambiar descuento (%) solo en administracion_usuarios
  async function cambiarDescuento(u, nuevoValor) {
    setMsg("");
    // Normaliza número (0–100, dos decimales)
    const n = Number(
      String(nuevoValor).replace(",", ".").replace(/[^\d.]/g, "")
    );
    if (Number.isNaN(n) || n < 0 || n > 100) {
      setMsg("❌ Descuento inválido. Debe estar entre 0 y 100.");
      return;
    }

    // Optimistic UI
    setUsuarios((prev) =>
      prev.map((row) =>
        row.id === u.id ? { ...row, descuento: Number(n.toFixed(2)) } : row
      )
    );

    const { error } = await supabase
      .from("administracion_usuarios")
      .update({ descuento: Number(n.toFixed(2)) })
      .eq("id", u.id);

    if (error) {
      console.error("Error guardando descuento:", error);
      setMsg("❌ No se pudo guardar el descuento.");
      // Refresca para recuperar valor real
      fetchUsuarios();
    } else {
      setMsg("✅ Descuento actualizado.");
    }
  }

  return (
    <>
      <Head>
        <title>Administración de Usuarios · PresuProsol</title>
      </Head>
      <Header />

      <div className="d-flex flex-column min-vh-100">
        <main className="flex-grow-1 container py-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between gap-3 mb-3">
            <h1 className="h3 m-0">Administración de Usuarios</h1>
            <button
              className="btn btn-outline-secondary btn-sm align-self-md-start"
              onClick={fetchUsuarios}
            >
              <span role="img" aria-label="refresh" className="me-1">
                🔄
              </span>
              Actualizar
            </button>
          </div>

          {msg && (
            <div
              className={`alert ${
                msg.startsWith("✅") ? "alert-success" : "alert-danger"
              }`}
            >
              {msg}
            </div>
          )}

          {loadingData ? (
            <p>Cargando usuarios...</p>
          ) : usuarios.length === 0 ? (
            <div className="alert alert-warning">No hay usuarios registrados.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-nowrap">Usuario</th>
                    <th className="text-nowrap">Email</th>
                    <th className="text-nowrap">CIF / NIF</th>
                    <th className="text-nowrap">Rol</th>
                    <th className="text-nowrap">Descuento %</th>
                    <th className="text-nowrap">Estado</th>
                    <th className="text-nowrap">Creado</th>
                    <th className="text-nowrap text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id}>
                      <td className="text-nowrap">{u.usuario}</td>
                      <td className="text-nowrap">{u.email}</td>
                      <td className="text-nowrap">{u.cif}</td>

                      <td className="text-nowrap">
                        <select
                          value={u.rol || "usuario"}
                          onChange={(e) => cambiarRol(u, e.target.value)}
                          className="form-select form-select-sm"
                          style={{ minWidth: "110px" }}
                        >
                          <option value="usuario">usuario</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>

                      <td className="text-nowrap" style={{ minWidth: 120 }}>
                        <div className="input-group input-group-sm">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            className="form-control"
                            value={
                              typeof u.descuento === "number"
                                ? u.descuento
                                : u.descuento ?? 0
                            }
                            onChange={(e) =>
                              setUsuarios((prev) =>
                                prev.map((row) =>
                                  row.id === u.id
                                    ? {
                                        ...row,
                                        descuento: e.target.value,
                                      }
                                    : row
                                )
                              )
                            }
                            onBlur={(e) => cambiarDescuento(u, e.target.value)}
                          />
                          <span className="input-group-text">%</span>
                        </div>
                      </td>

                      <td className="text-nowrap">
                        {u.habilitado ? (
                          <span className="badge bg-success">Habilitado</span>
                        ) : (
                          <span className="badge bg-secondary">Deshabilitado</span>
                        )}
                      </td>

                      <td className="text-nowrap">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleString("es-ES")
                          : "-"}
                      </td>

                      <td className="text-nowrap text-center">
                        {u.habilitado ? (
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => deshabilitarUsuario(u)}
                          >
                            Deshabilitar
                          </button>
                        ) : (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => habilitarUsuario(u)}
                          >
                            Habilitar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
