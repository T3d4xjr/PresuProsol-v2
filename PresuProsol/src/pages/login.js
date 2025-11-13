// src/pages/login.js
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [alert, setAlert] = useState(null); // { type: 'ok'|'error'|'info', msg: string }
  const [loading, setLoading] = useState(false);

  const show = (type, msg) => setAlert({ type, msg });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    console.clear();
    console.log('🔹 [LOGIN] Iniciando proceso de login...');
    console.log('➡️ Email introducido:', email);

    try {
      // 1) Iniciar sesión en Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        show('error', 'Correo o contraseña incorrectos.');
        setLoading(false);
        return;
      }

      const { user } = data.session;

      console.log('[LOGIN] auth user:', {
        id: user.id,
        email: user.email,
      });

      // 2) Buscar al usuario en public.administracion_usuarios POR EMAIL
      const { data: adminRow, error: adminErr } = await supabase
        .from('administracion_usuarios')
        .select('id, usuario, email, cif, habilitado, rol')
        .eq('email', user.email) // 👈 nos basamos en el email
        .maybeSingle();

      console.log('[LOGIN] adminRow por email:', adminRow, adminErr);

      if (adminErr) {
        console.error('[LOGIN] error leyendo administracion_usuarios:', adminErr);
        show('error', 'No se pudo verificar tu acceso. Intenta de nuevo.');
        setLoading(false);
        return;
      }

      // 2.1) No hay fila en administracion_usuarios con ese email
      if (!adminRow) {
        show(
          'error',
          'Tu cuenta se ha autenticado, pero no está registrada en el panel de administración. Contacta con el administrador.'
        );
        setLoading(false);
        return;
      }

      // 2.2) Usuario existe pero NO habilitado
      if (adminRow.habilitado === false) {
        show(
          'info',
          '⚠️ Tu acceso está pendiente de aprobación por un administrador.'
        );
        setLoading(false);
        return;
      }

      // 3) Usuario habilitado: aseguramos que exista en public.usuarios
      let { data: perfil, error: perfilErr } = await supabase
        .from('usuarios')
        .select(
          'id, usuario, email, cif, habilitado, rol, telefono, direccion, nacionalidad, foto_url'
        )
        .eq('id', user.id) // usamos el id real de auth.users
        .maybeSingle();

      console.log('[LOGIN] perfil usuarios (antes de crear):', perfil, perfilErr);

      if (perfilErr) {
        console.error('[LOGIN] error leyendo usuarios:', perfilErr);
        // no bloqueamos el login solo por esto
      }

      // Si no existe fila en usuarios, la creamos a partir de administracion_usuarios
      if (!perfil) {
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
          console.error('[LOGIN] error insertando en usuarios:', insertErr);
          // seguimos dejando entrar igualmente
        } else {
          console.log('[LOGIN] perfil creado en usuarios');
        }
      }

      // 4) Todo OK -> Bienvenida y redirección
      show('ok', `¡Bienvenido, ${adminRow.usuario}!`);
      setTimeout(() => {
        window.location.href = '/';
      }, 800);
    } catch (err) {
      console.error('[LOGIN] error inesperado:', err);
      show('error', 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
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
            Accede con tu email y contraseña. Si aún no tienes cuenta, primero{' '}
            <Link
              href="/registro"
              style={{ color: 'var(--accent)', fontWeight: 600 }}
            >
              solicita acceso
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
              }`}
            >
              {alert.msg}
            </div>
          )}

          <div className={styles.loginCard}>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                />
              </div>

              <button
              
                type="submit"
                className={styles.loginButton}
                disabled={loading}
              >
                
                {loading ? 'Entrando…' : 'Entrar'}
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

      <Footer />
      
    </>
  );
}