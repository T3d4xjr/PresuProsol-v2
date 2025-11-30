import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

export default function ModalPago({ presupuesto, userId, onClose, onSuccess }) {
  const [procesando, setProcesando] = useState(false);

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">💳 Realizar Pago</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            {/* Resumen del presupuesto */}
            <div className="alert alert-info mb-4">
              <h6>📋 Resumen del presupuesto</h6>
              <p className="mb-1">
                <strong>Tipo:</strong> {presupuesto.tipo}
              </p>
              {presupuesto.color && (
                <p className="mb-1">
                  <strong>Color:</strong> {presupuesto.color}
                </p>
              )}
              <hr />
              <p className="mb-0 h5">
                <strong>Total a pagar:</strong>{" "}
                <span className="text-success">{presupuesto.total?.toFixed(2)} €</span>
              </p>
            </div>

            {/* Formulario de pago con Stripe */}
            {stripePromise ? (
              <Elements stripe={stripePromise}>
                <FormularioTarjeta
                  presupuesto={presupuesto}
                  userId={userId}
                  onSuccess={onSuccess}
                  procesando={procesando}
                  setProcesando={setProcesando}
                />
              </Elements>
            ) : (
              <div className="alert alert-warning">
                ⚠️ El pago con tarjeta no está configurado. Verifica las claves de Stripe en .env.local
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={procesando}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para pago con Tarjeta (Stripe)
function FormularioTarjeta({ presupuesto, userId, onSuccess, procesando, setProcesando }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);

  const tarjetasPrueba = [
    { nombre: "Visa (Éxito)", numero: "4242 4242 4242 4242", tipo: "✅ Pago exitoso" },
    { nombre: "Visa (Requiere autenticación)", numero: "4000 0027 6000 3184", tipo: "🔐 3D Secure" },
    { nombre: "Mastercard", numero: "5555 5555 5555 4444", tipo: "✅ Pago exitoso" },
    { nombre: "American Express", numero: "3782 822463 10005", tipo: "✅ Pago exitoso" },
    { nombre: "Visa (Rechazo)", numero: "4000 0000 0000 0002", tipo: "❌ Tarjeta rechazada" },
  ];

  async function handleSubmit(e) {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("El sistema de pago aún no está listo. Espera un momento.");
      return;
    }

    setProcesando(true);
    setError(null);

    try {
      console.log("🔄 Iniciando pago con Stripe...");

      // 1. Crear PaymentIntent en el backend
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: presupuesto.total,
          presupuestoId: presupuesto.id,
          userId: userId,
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setError("Hubo un problema con el servidor. Por favor, intenta de nuevo.");
        setProcesando(false);
        return;
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setProcesando(false);
        return;
      }

      console.log("✅ Solicitud de pago creada");

      // 2. Confirmar el pago con la tarjeta
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        }
      );

      if (stripeError) {
        // Mensajes amistosos según el tipo de error
        let mensajeAmistoso = "";
        
        switch (stripeError.code) {
          case "card_declined":
            mensajeAmistoso = "❌ Tu tarjeta fue rechazada. Intenta con otra tarjeta o contacta a tu banco.";
            break;
          case "expired_card":
            mensajeAmistoso = "⏰ Tu tarjeta ha expirado. Por favor, usa una tarjeta válida.";
            break;
          case "incorrect_cvc":
            mensajeAmistoso = "🔢 El código de seguridad (CVV) es incorrecto. Verifica los 3 dígitos en el reverso de tu tarjeta.";
            break;
          case "processing_error":
            mensajeAmistoso = "⚠️ Hubo un error procesando el pago. Por favor, intenta de nuevo.";
            break;
          case "invalid_number":
            mensajeAmistoso = "❌ El número de tarjeta no es válido. Verifica que lo hayas escrito correctamente o usa una de las tarjetas de prueba.";
            break;
          case "incomplete_number":
            mensajeAmistoso = "📝 El número de tarjeta está incompleto. Verifica que hayas ingresado todos los dígitos.";
            break;
          case "incomplete_expiry":
            mensajeAmistoso = "📅 La fecha de vencimiento está incompleta. Usa el formato MM/AA.";
            break;
          case "incomplete_cvc":
            mensajeAmistoso = "🔒 El código CVV está incompleto. Son 3 dígitos (4 en American Express).";
            break;
          case "insufficient_funds":
            mensajeAmistoso = "💰 No hay fondos suficientes en tu tarjeta. Intenta con otra forma de pago.";
            break;
          default:
            mensajeAmistoso = stripeError.message || "⚠️ Error al procesar el pago. Por favor, intenta de nuevo.";
        }

        setError(mensajeAmistoso);
        setProcesando(false);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        console.log("✅ Pago exitoso, creando pedido...");

        // 3. Confirmar pago y crear pedido
        const confirmResponse = await fetch("/api/confirmar-pago", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            presupuestoId: presupuesto.id,
            userId: userId,
          }),
        });

        if (!confirmResponse.ok) {
          setError("✅ El pago se procesó correctamente, pero hubo un error al crear tu pedido. Contacta con soporte.");
          setProcesando(false);
          return;
        }

        console.log("✅ Pedido creado correctamente");
        onSuccess();
      }
    } catch (err) {
      console.error("❌ Error en pago:", err);
      setError(err.message || "⚠️ Hubo un error procesando tu pago. Por favor, intenta de nuevo.");
      setProcesando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label fw-bold">Datos de la tarjeta</label>
        <div className="border rounded p-3 bg-light">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                },
                invalid: {
                  color: "#dc3545",
                  iconColor: "#dc3545",
                },
              },
            }}
          />
        </div>
      </div>

      {/* Tarjetas de prueba */}
      <div className="card bg-light mb-3">
        <div className="card-body">
          <h6 className="card-title mb-3">
            🧪 <strong>Tarjetas de prueba disponibles</strong>
          </h6>
          <div className="table-responsive">
            <table className="table table-sm table-borderless mb-0">
              <thead>
                <tr>
                  <th>Tarjeta</th>
                  <th>Número</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {tarjetasPrueba.map((tarjeta, index) => (
                  <tr key={index}>
                    <td className="small fw-semibold">{tarjeta.nombre}</td>
                    <td className="small">
                      <code style={{ fontSize: '11px' }}>{tarjeta.numero}</code>
                    </td>
                    <td className="small">{tarjeta.tipo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <hr />
          <div className="small text-muted">
            <strong>📌 Datos adicionales para todas las tarjetas:</strong>
            <ul className="mb-0 mt-2">
              <li>Fecha de vencimiento: Cualquier fecha futura (ej: <code>12/25</code>)</li>
              <li>CVV: Cualquier 3 dígitos (ej: <code>123</code>)</li>
              <li>Código postal: Cualquier número (ej: <code>12345</code>)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Mensaje de error amistoso */}
      {error && (
        <div className="alert alert-danger d-flex align-items-start" role="alert">
          <div className="me-2" style={{ fontSize: "24px" }}>⚠️</div>
          <div>
            <strong>Ups, hubo un problema</strong>
            <p className="mb-2 mt-1">{error}</p>
            <small className="text-dark">
              💡 <strong>Sugerencia:</strong> Usa una de las tarjetas de prueba de la tabla de arriba.
            </small>
          </div>
        </div>
      )}

      <button
        type="submit"
        className="btn btn-success btn-lg w-100"
        disabled={!stripe || procesando}
      >
        {procesando ? (
          <>
            <span className="spinner-border spinner-border-sm me-2"></span>
            Procesando pago seguro...
          </>
        ) : (
          <>
            💳 Pagar {presupuesto.total?.toFixed(2)} € de forma segura
          </>
        )}
      </button>

      <div className="text-center mt-3">
        <small className="text-muted">
          🔒 Pago 100% seguro procesado por <strong>Stripe</strong>
        </small>
      </div>
    </form>
  );
}