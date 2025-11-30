import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../src/components/Header';
import Footer from '../../src/components/Footer';
import { supabase } from '../../src/lib/supabaseClient';
import styles from '../../src/styles/Login.module.css';

export default function Registro() {
  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [cif, setCif] = useState('');
  const [pass, setPass] = useState('');
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const show = (type, msg) => setAlert({ type, msg });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    // Usar .then/.catch para evitar que Next.js capture el error
    supabase.auth.signUp({
      email,
      password: pass,
    })
    .then(async ({ data, error }) => {
      if (error) {
        console.error('[REGISTRO] Error al crear usuario:', error);
        
        // Mensajes de error en español
        if (error.message.includes('User already registered')) {
          show('error', '❌ Este correo electrónico ya está registrado. Por favor, inicia sesión.');
        } else if (error.message.includes('Password should be at least')) {
          show('error', '❌ La contraseña debe tener al menos 6 caracteres.');
        } else if (error.message.includes('Invalid email')) {
          show('error', '❌ El correo electrónico no es válido.');
        } else if (error.message.includes('Email rate limit exceeded')) {
          show('error', '⚠️ Demasiados intentos. Por favor, espera unos minutos e intenta de nuevo.');
        } else {
          show('error', '❌ No se pudo completar el registro. Por favor, intenta de nuevo.');
        }
        
        setLoading(false);
        return;
      }

      try {
        const authUser = data.user;
        console.log('[REGISTRO] ✅ Usuario creado en Auth:', authUser.id);

        // Insertar solicitud en administracion_usuarios (pendiente de aprobación)
        const { error: insertErr } = await supabase
          .from('administracion_usuarios')
          .insert({
            id: authUser.id,
            auth_user_id: authUser.id,
            usuario,
            email,
            cif,
            habilitado: false,
            rol: 'usuario',
            created_at: new Date().toISOString(),
          });

        if (insertErr) {
          console.error('[REGISTRO] ❌ Error al insertar en administracion_usuarios:', insertErr);
          
          if (insertErr.message.includes('duplicate key')) {
            show('error', '⚠️ Este usuario ya existe en el sistema. Por favor, inicia sesión.');
          } else {
            show('error', '❌ Error al guardar tus datos. Por favor, contacta con el administrador.');
          }
          
          setLoading(false);
          return;
        }

        console.log('[REGISTRO] ✅ Solicitud guardada correctamente');
        show('ok', '✅ ¡Solicitud enviada con éxito! Un administrador revisará tu acceso y te notificaremos por correo electrónico.');
        
        // Limpiar formulario
        setUsuario('');
        setEmail('');
        setCif('');
        setPass('');
        
      } catch (err) {
        console.error('[REGISTRO] ❌ Error inesperado:', err);
        show('error', '❌ Ocurrió un error inesperado. Por favor, intenta de nuevo más tarde.');
        setLoading(false);
      }
    })
    .catch((err) => {
      console.error('[REGISTRO] ❌ Error de red capturado:', err);
      show('error', '❌ Error de conexión. Por favor, verifica tu conexión a internet e intenta de nuevo.');
      setLoading(false);
    });
  };

  return (
    <>
      <Head>
        <title>Solicitar acceso · PresuProsol</title>
      </Head>
      
      <Header />

      <main className={styles.loginContainer}>
        <div className={styles.loginBox}>
          <h1 className={styles.loginTitle}>Solicitar acceso</h1>
          <p className={styles.loginSubtitle}>
            Rellena tus datos. Revisaremos tu solicitud lo antes posible y te notificaremos cuando tu cuenta esté activa.
          </p>

          {/* Mensaje de alerta */}
          {alert && (
            <div
              className={`alert ${
                alert.type === 'ok' ? 'alert-success' : 'alert-danger'
              } d-flex align-items-center`}
              role="alert"
            >
              <div>{alert.msg}</div>
            </div>
          )}

          <div className={styles.loginCard}>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Nombre de usuario</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Introduce tu nombre de usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

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
                <small className="text-muted">
                  Recibirás un correo de confirmación en esta dirección
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label">CIF / NIF</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="B12345678 o 12345678A"
                  value={cif}
                  onChange={(e) => setCif(e.target.value.toUpperCase())}
                  required
                  disabled={loading}
                  pattern="[A-Z0-9]{8,9}"
                  title="Introduce un CIF o NIF válido (8-9 caracteres)"
                />
                <small className="text-muted">
                  Formato: B12345678 (CIF) o 12345678A (NIF)
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Mínimo 6 caracteres"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
                <small className="text-muted">
                  Debe tener al menos 6 caracteres
                </small>
              </div>

              <button
                type="submit"
                className={styles.loginButton}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Enviando solicitud...
                  </>
                ) : (
                  '📝 Solicitar acceso'
                )}
              </button>
            </form>
          </div>

          <div className={styles.loginFooterText}>
            <small>
              ¿Ya tienes cuenta?{' '}
              <Link href="/login">Inicia sesión</Link>
            </small>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
