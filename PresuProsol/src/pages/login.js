// src/pages/login.js
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from "@/components/Header";
import { supabase } from "@/pages/api/supabaseClient";
import styles from "@/styles/Login.module.css";

export default function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const show = (type, msg) => setAlert({ type, msg });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    console.clear();
    console.log('🔹 [LOGIN] Iniciando proceso de login...');
    console.log('➡️ Email introducido:', email);

    // Usar .then/.catch en lugar de await para evitar que Next.js capture el error
    supabase.auth.signInWithPassword({
      email,
      password: pass,
    })
    .then(async ({ data, error }) => {
      // Verificar si hubo error de autenticación
      if (error) {
        console.error('[LOGIN] Error de autenticación:', error);
        
        // Mensajes de error en español según el tipo
        if (error.message.includes('Invalid login credentials')) {
          show('error', '❌ Correo electrónico o contraseña incorrectos.');
        } else if (error.message.includes('Email not confirmed')) {
          show('error', '⚠️ Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.');
        } else if (error.message.includes('User not found')) {
          show('error', '❌ No existe una cuenta con este correo electrónico.');
        } else {
          show('error', '❌ Error al iniciar sesión. Por favor, intenta de nuevo.');
        }
        
        setLoading(false);
        return;
      }

      // Continuar con el proceso de login
      try {
        const { user } = data.session;

        console.log('[LOGIN] ✅ Usuario autenticado:', {
          id: user.id,
          email: user.email,
        });

        // Buscar al usuario en public.administracion_usuarios POR EMAIL
        const { data: adminRow, error: adminErr } = await supabase
          .from('administracion_usuarios')
          .select('id, usuario, email, cif, habilitado, rol')
          .eq('email', user.email)
          .maybeSingle();

        console.log('[LOGIN] Datos de administración encontrados:', adminRow);

        if (adminErr) {
          console.error('[LOGIN] ❌ Error leyendo administracion_usuarios:', adminErr);
          show('error', '⚠️ No se pudo verificar tu acceso. Por favor, intenta de nuevo.');
          setLoading(false);
          return;
        }

        // No hay fila en administracion_usuarios con ese email
        if (!adminRow) {
          show(
            'error',
            '❌ Tu cuenta no está registrada en el sistema. Por favor, contacta con el administrador.'
          );
          setLoading(false);
          return;
        }

        // Usuario existe pero NO habilitado
        if (adminRow.habilitado === false) {
          show(
            'info',
            '⏳ Tu cuenta está pendiente de aprobación por un administrador. Te notificaremos cuando esté activa.'
          );
          setLoading(false);
          return;
        }

        // Usuario habilitado: aseguramos que exista en public.usuarios
        let { data: perfil, error: perfilErr } = await supabase
          .from('usuarios')
          .select(
            'id, usuario, email, cif, habilitado, rol, telefono, direccion, nacionalidad, foto_url'
          )
          .eq('id', user.id)
          .maybeSingle();

        console.log('[LOGIN] Perfil de usuario:', perfil);

        if (perfilErr) {
          console.error('[LOGIN] ⚠️ Error leyendo perfil de usuarios:', perfilErr);
        }

        // Si no existe fila en usuarios, la creamos
        if (!perfil) {
          console.log('[LOGIN] 📝 Creando perfil de usuario...');
          
          const { error: insertErr } = await supabase.from('usuarios').insert({
            id: user.id,
            usuario: adminRow.usuario,
            email: adminRow.email,
            cif: adminRow.cif,
            habilitado: adminRow.habilitado,
            rol: adminRow.rol,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (insertErr) {
            console.error('[LOGIN] ⚠️ Error creando perfil de usuario:', insertErr);
          } else {
            console.log('[LOGIN] ✅ Perfil de usuario creado correctamente');
          }
        }

        // Todo OK -> Bienvenida y redirección
        console.log('[LOGIN] 🎉 Login exitoso');
        show('ok', `¡Bienvenido/a, ${adminRow.usuario}! 🎉`);
        
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
        
      } catch (err) {
        console.error('[LOGIN] ❌ Error inesperado durante el proceso:', err);
        show('error', '❌ Ocurrió un error inesperado. Por favor, intenta de nuevo más tarde.');
        setLoading(false);
      }
    })
    .catch((err) => {
      // Este catch captura errores de red u otros errores inesperados
      console.error('[LOGIN] ❌ Error de red capturado:', err);
      show('error', '❌ Error de conexión. Por favor, verifica tu conexión a internet e intenta de nuevo.');
      setLoading(false);
    });
  };

  return (
    <>
      <Head>
        <title>Iniciar sesión · PresuProsol</title>
      </Head>

      <Header />

      <main className={styles.loginContainer}>
        <div className={styles.loginBox}>
          <h1 className={styles.loginTitle}>Iniciar sesión</h1>
          <p className={styles.loginSubtitle}>
            Accede con tu correo electrónico y contraseña. Si aún no tienes cuenta,{' '}
            <Link
              href="/registro"
              style={{ color: 'var(--accent)', fontWeight: 600 }}
            >
              solicita acceso aquí
            </Link>
            .
          </p>

          {/* Mensaje de alerta */}
          {alert && (
            <div
              className={`alert ${
                alert.type === 'ok'
                  ? 'alert-success'
                  : alert.type === 'info'
                  ? 'alert-warning'
                  : 'alert-danger'
              } d-flex align-items-center`}
              role="alert"
            >
              <div>
                {alert.msg}
              </div>
            </div>
          )}

          <div className={styles.loginCard}>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Correo electrónico</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Introduce tu contraseña"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className={styles.loginButton}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Iniciando sesión...
                  </>
                ) : (
                  '🔐 Iniciar sesión'
                )}
              </button>
            </form>
          </div>

          <div className={styles.loginFooterText}>
            <small>
              ¿No tienes cuenta?{' '}
              <Link href="/registro">Solicita acceso</Link>
            </small>
          </div>
        </div>
      </main>

    </>
  );
}