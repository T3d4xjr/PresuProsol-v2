// src/components/productos/CompactosForm.js
import dynamic from "next/dynamic";

// Import dinámico del configurador de compactos
const ConfigCompacto = dynamic(
  () => import("../../pages/compactos/[tipo]"),
  { ssr: false }
);

export default function CompactosForm({
  datosIniciales = null,
  onSubmit = null,
  guardando = false,
  modoEdicion = false,
}) {
  console.log("📦 [CompactosForm] Props:", {
    modoEdicion,
    tieneDatos: !!datosIniciales,
    guardando,
  });

  // Detectar tipo desde datosIniciales.tipo
  const tipo =
    datosIniciales?.tipo?.includes("pvc")
      ? "pvc"
      : datosIniciales?.tipo?.includes("aluminio")
      ? "aluminio"
      : "pvc";

  return (
    <ConfigCompacto
      datosIniciales={datosIniciales}
      onSubmit={onSubmit}
      guardando={guardando}
      modoEdicion={modoEdicion}
      tipoOverride={tipo} // 👈 se usará dentro de [tipo].js
    />
  );
}
