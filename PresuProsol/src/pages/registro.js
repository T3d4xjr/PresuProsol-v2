import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabaseClient';

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
    setLoading(true); setAlert(null);

    try {
      // 1) Crear usuario en Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
      });
      if (error) throw error;
      const authUser = data.user;

      // 2) Insertar solicitud en administracion_usuarios (pendiente)
      const { error: eIns } = await supabase.from('administracion_usuarios').insert({
        id: authUser.id,            // clave primaria = auth.users.id
        auth_user_id: authUser.id,  // redundancia útil para joins
        usuario,
        email,
        cif,
        habilitado: false,
        rol: 'usuario',
      });
      if (eIns) throw eIns;

      show('ok', '✅ Solicitud enviada. Un administrador revisará tu acceso.');
      setUsuario(''); setEmail(''); setCif(''); setPass('');
    } catch (err) {
      console.error(err);
      show('error', err.message || 'No se pudo completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Solicitar acceso · PresuProsol</title></Head>
      <Header />

      <div className="container" style={{maxWidth: 960, marginTop: 48}}>
        <h1 style={{ color: 'var(--primary)', fontWeight: 700 }}>Solicitar acceso</h1>
        <p className="text-muted" style={{marginBottom: 20}}>
          Rellena tus datos. Revisaremos tu solicitud lo antes posible.
        </p>

        {alert && (
          <div className={`alert ${alert.type === 'ok' ? 'alert-success' : 'alert-danger'}`} style={{borderRadius: 12, fontWeight: 600}}>
            {alert.msg}
          </div>
        )}

        <div className="card shadow-sm" style={{borderRadius: 16}}>
          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Usuario</label>
                <input className="form-control" value={usuario} onChange={e => setUsuario(e.target.value)} required/>
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required/>
              </div>
              <div className="mb-3">
                <label className="form-label">CIF / NIF</label>
                <input className="form-control" value={cif} onChange={e => setCif(e.target.value)} required/>
              </div>
              <div className="mb-3">
                <label className="form-label">Contraseña</label>
                <input type="password" className="form-control" value={pass} onChange={e => setPass(e.target.value)} required/>
              </div>

              <button
                type="submit"
                className="btn"
                disabled={loading}
                style={{width:'100%', background:'var(--accent)', color:'#fff', borderRadius:12, padding:'12px 16px', fontWeight:700}}
              >
                {loading ? 'Enviando…' : 'Solicitar acceso'}
              </button>
            </form>
          </div>
        </div>

        <div className="text-center mt-3">
          <small className="text-muted">
            ¿Ya tienes cuenta? <Link href="/login" style={{ color:'var(--accent)', fontWeight:600 }}>Inicia sesión</Link>
          </small>
        </div>
      </div>

      <Footer />
    </>
  );
}
