import { useEffect } from 'react';
import '../styles/globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Suprimir solo errores de AuthApiError en consola
      const originalError = console.error;
      console.error = (...args) => {
        const errorString = JSON.stringify(args);
        if (
          errorString.includes('AuthApiError') ||
          errorString.includes('Invalid login credentials')
        ) {
          return; // No mostrar estos errores
        }
        originalError(...args);
      };
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;