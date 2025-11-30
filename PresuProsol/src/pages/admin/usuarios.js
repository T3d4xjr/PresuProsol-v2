// src/pages/admin/usuarios.js
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useAuth from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

// 👉 Helper de notificaciones por email
import { enviarAvisoEstadoUsuario } from "../../lib/emailNotifications";

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

  // 🟢 HABILITAR
  async function habilitarUsuario(u) {
    setMsg("");

    try {
      // Cambia bandera habilitado en administracion_usuarios
      const { error: upErr } = await supabase
        .from("administracion_usuarios")
        .update({ habilitado: true })
        .eq("id", u.id);
      if (upErr) throw upErr;

      const now = new Date().toISOString();

      // Alta operativa en tabla usuarios
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

      // 📧 Notificación por email (no bloquea la UI)
      enviarAvisoEstadoUsuario({
        email: u.email,        // 👉 gmail del usuario
        usuario: u.usuario,
        estado: "habilitado",
      });

      setMsg("✅ Usuario habilitado correctamente.");
      fetchUsuarios();
    } catch (err) {
      console.error("Error al habilitar:", err);
      setMsg("❌ No se pudo habilitar el usuario.");
    }
  }

  // 🔴 DESHABILITAR
  async function deshabilitarUsuario(u) {
    setMsg("");
    try {
      const { error: upErr } = await supabase
        .from("administracion_usuarios")
        .update({ habilitado: false })
        .eq("id", u.id);
      if (upErr) throw upErr;

      // Borrar fila operativa en usuarios
      const { error: delErr } = await supabase
        .from("usuarios")
        .delete()
        .eq("id", u.id);
      if (delErr) throw delErr;

      // 📧 Notificación por email
      enviarAvisoEstadoUsuario({
        email: u.email,        // 👉 gmail del usuario
        usuario: u.usuario,
        estado: "deshabilitado",
      });

      setMsg("⚠️ Usuario deshabilitado y eliminado de usuarios.");
      fetchUsuarios();
    } catch (err) {
      console.error("Error al deshabilitar:", err);
      setMsg("❌ No se pudo deshabilitar el usuario.");
    }
  }

  // Cambiar ROL
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
        await supabase.from("usuarios").update({ rol: role }).eq("id", u.id);
      }

      setMsg("🔄 Rol actualizado correctamente.");
      fetchUsuarios();
    } catch (err) {
      console.error("Error rol:", err);
      setMsg("❌ No se pudo cambiar el rol.");
    }
  }

  // Cambiar % descuento
  async function cambiarDescuento(u, nuevoValor) {
    setMsg("");
    const n = Number(
      String(nuevoValor).replace(",", ".").replace(/[^\d.]/g, "")
    );
    if (Number.isNaN(n) || n < 0 || n > 100) {
      setMsg("❗ Descuento inválido (0–100%)");
      return;
    }

    // Optimistic UI
    setUsuarios((prev) =>
      prev.map((row) =>
        row.id === u.id
          ? { ...row, descuento: Number(n.toFixed(2)) }
          : row
      )
    );

    const { error } = await supabase
      .from("administracion_usuarios")
      .update({ descuento: Number(n.toFixed(2)) })
      .eq("id", u.id);

    if (error) {
      console.error("Error descuento:", error);
      setMsg("❌ No se pudo guardar el descuento.");
      fetchUsuarios();
    } else {
      setMsg("💾 Descuento actualizado.");
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
              🔄 Actualizar
            </button>
          </div>

          {msg && (
            <div
              className={`alert ${
                msg.startsWith("✅")
                  ? "alert-success"
                  : msg.startsWith("💾")
                  ? "alert-info"
                  : msg.startsWith("🔄")
                  ? "alert-info"
                  : msg.startsWith("⚠️")
                  ? "alert-warning"
                  : msg.startsWith("❗")
                  ? "alert-warning"
                  : "alert-danger"
              }`}
            >
              {msg}
            </div>
          )}

          {loadingData ? (
            <p>Cargando usuarios...</p>
          ) : usuarios.length === 0 ? (
            <div className="alert alert-warning">
              No hay usuarios registrados.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>CIF / NIF</th>
                    <th>Rol</th>
                    <th>Descuento %</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id}>
                      <td>{u.usuario}</td>
                      <td>{u.email}</td>
                      <td>{u.cif}</td>

                      <td>
                        <select
                          value={u.rol || "usuario"}
                          onChange={(e) => cambiarRol(u, e.target.value)}
                          className="form-select form-select-sm"
                        >
                          <option value="usuario">usuario</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>

                      <td style={{ minWidth: 120 }}>
                        <div className="input-group input-group-sm">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            className="form-control"
                            value={u.descuento ?? 0}
                            onChange={(e) =>
                              setUsuarios((prev) =>
                                prev.map((row) =>
                                  row.id === u.id
                                    ? { ...row, descuento: e.target.value }
                                    : row
                                )
                              )
                            }
                            onBlur={(e) =>
                              cambiarDescuento(u, e.target.value)
                            }
                          />
                          <span className="input-group-text">%</span>
                        </div>
                      </td>

                      <td>
                        {u.habilitado ? (
                          <span className="badge bg-success">Habilitado</span>
                        ) : (
                          <span className="badge bg-secondary">
                            Deshabilitado
                          </span>
                        )}
                      </td>

                      <td>
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString("es-ES")
                          : "-"}
                      </td>

                      <td className="text-center">
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
