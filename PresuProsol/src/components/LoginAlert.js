// src/components/LoginAlert.js
import React from 'react';
import { useRouter } from 'next/router';

export default function LoginAlert({ onClose }) {
  const router = useRouter();

  return (
    <div className="login-alert-overlay">
      <div className="login-alert-box">
        <h2>Acceso restringido</h2>
        <p>
          Para acceder a esta sección necesitas iniciar sesión con tu cuenta de cliente.
        </p>
        <div className="login-alert-buttons">
          <button
            className="btn-secundario"
            onClick={onClose}
          >
            Cerrar
          </button>
          <button
            className="btn-primario"
            onClick={() => {
              onClose?.();
              router.push('/login?m=login-required');
            }}
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
