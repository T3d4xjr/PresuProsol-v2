import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useAuth from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import Header from "../components/Header";
import AvatarUploader from "../components/AvatarUploader";

export default function Perfil() {
  const router = useRouter();
  const { session, profile, loading, refreshProfile } = useAuth();

  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("/assets/avatar.jpg");

  // 🔒 Si no hay sesión -> redirigir a login
  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login?m=login-required");
    }
  }, [loading, session, router]);

  // 🔄 Sincronizar avatar cuando cargue el perfil
  useEffect(() => {
    if (profile?.foto_url) {
      setAvatarUrl(profile.foto_url);
    } else {
      setAvatarUrl("/assets/avatar.jpg");
    }
  }, [profile]);

  // 🕑 Mientras carga, no renderiza nada
  if (loading) return null;

  // 🔐 Si NO hay sesión, no renderiza
  if (!session) return null;

  // 🚫 Perfil no cargado o error
  if (session && profile === null) {
    return (
      <>
        <Head>
          <title>Perfil · PresuProsol</title>
        </Head>
        <Header />
        <main className="container" style={{ maxWidth: 920, marginTop: 24 }}>
          <h1>Perfil</h1>
          <div className="alert alert-warning">
            No hemos podido cargar tu perfil aún. Si acabas de registrarte,
            espera un momento y recarga.
          </div>
        </main>
      </>
    );
  }

  // 🚷 No habilitado por admin
  if (session && profile && profile.habilitado === false) {
    return (
      <>
        <Head>
          <title>Perfil · PresuProsol</title>
        </Head>
        <Header />
        <main className="container" style={{ maxWidth: 920, marginTop: 24 }}>
          <h1>Perfil</h1>
          <div className="alert alert-warning">
            Tu acceso está <strong>pendiente de aprobación</strong> por un
            administrador.
          </div>
        </main>
      </>
    );
  }

  // 💾 Guardar cambios del perfil
  async function onSave(e) {
    e.preventDefault();
    setMsg("");
    setSaving(true);

    const f = new FormData(e.currentTarget);
    const payload = {
      usuario: f.get("usuario")?.toString().trim(),
      email: f.get("email")?.toString().trim(),
      cif: f.get("cif")?.toString().trim(),
      telefono: f.get("telefono")?.toString().trim() || null,
      direccion: f.get("direccion")?.toString().trim() || null,
      nacionalidad: f.get("nacionalidad")?.toString().trim() || null,
      foto_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("usuarios")
      .update(payload)
      .eq("id", session.user.id);

    setSaving(false);

    if (error) {
      setMsg(`❌ No se pudo actualizar: ${error.message}`);
    } else {
      setMsg("✅ Perfil actualizado.");
      refreshProfile?.(); // 🔄 Refresca el perfil del hook
    }
  }

  // 🧩 Render principal
  return (
    <>
      <Head>
        <title>Perfil · PresuProsol</title>
      </Head>
      <Header />

      <main className="container" style={{ maxWidth: 920, marginTop: 24 }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h1>Mi perfil</h1>

          <div className="d-flex gap-2">
            {/* 📋 Mis Presupuestos - Todos los usuarios */}
            <button
              onClick={() => router.push("/mis-presupuestos")}
              className="btn btn-outline-primary"
            >
              📋 Mis Presupuestos
            </button>

            {/* 📦 Mis Pedidos - Todos los usuarios */}
            <button
              onClick={() => router.push("/mis-pedidos")}
              className="btn btn-outline-success"
            >
              📦 Mis Pedidos
            </button>

            {/* 🔐 Administración - Solo admin */}
            {profile?.rol === "admin" && (
              <button
                onClick={() => router.push("/admin/usuarios")}
                className="btn btn-outline-secondary"
              >
                👤 Usuarios
              </button>
            )}

            {/* 🚚 Gestión de Pedidos - Solo admin */}
            {profile?.rol === "admin" && (
              <button
                onClick={() => router.push("/admin/pedidos")}
                className="btn btn-outline-warning"
              >
                🚚 Pedidos
              </button>
            )}
          </div>
        </div>

        <div className="auth-wrap">
          <div className="auth-max">
            <div className="auth-card">
              {/* 📸 Selector de foto de perfil */}
              <AvatarUploader
                userId={session.user.id}
                currentUrl={avatarUrl}
                onUploaded={(newUrl) => {
                  setAvatarUrl(newUrl);
                  refreshProfile?.({ foto_url: newUrl }); // 🔥 Actualiza datos en memoria
                }}
              />

              <form onSubmit={onSave} className="row g-3 mt-3">
                <div className="col-12 col-md-6">
                  <label className="form-label">Usuario</label>
                  <input
                    name="usuario"
                    defaultValue={profile?.usuario || ""}
                    className="form-control"
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={profile?.email || ""}
                    className="form-control"
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">CIF / NIF</label>
                  <input
                    name="cif"
                    defaultValue={profile?.cif || ""}
                    className="form-control"
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">Teléfono</label>
                  <input
                    name="telefono"
                    defaultValue={profile?.telefono || ""}
                    className="form-control"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Dirección</label>
                  <input
                    name="direccion"
                    defaultValue={profile?.direccion || ""}
                    className="form-control"
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">Nacionalidad</label>
                  <input
                    name="nacionalidad"
                    defaultValue={profile?.nacionalidad || ""}
                    className="form-control"
                  />
                </div>

                {msg && (
                  <div
                    className={`col-12 alert ${
                      msg.startsWith("✅") ? "alert-success" : "alert-danger"
                    }`}
                  >
                    {msg}
                  </div>
                )}

                <div className="col-12">
                  <button className="btn btn-accent" disabled={saving}>
                    {saving ? "Guardando…" : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

    </>
  );
}
