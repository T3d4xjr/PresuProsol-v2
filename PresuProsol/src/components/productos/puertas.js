import dynamic from "next/dynamic";

const ConfigPuertaSeccional = dynamic(
  () => import("../../pages/puertas-seccionales/[tipo]"),
  { ssr: false }
);

export default function PuertasForm({
  datosIniciales = null,
  onSubmit = null,
  guardando = false,
  modoEdicion = false,
}) {
  console.log("📦 [PuertasForm] Props:", {
    modoEdicion,
    tieneDatos: !!datosIniciales,
    guardando,
  });

  // Detectar tipo desde datosIniciales.tipo
  // Tipos: "puerta-seccional-residencial", "puerta-seccional-industrial"
  const tipo =
    datosIniciales?.tipo?.includes("residencial")
      ? "residencial"
      : datosIniciales?.tipo?.includes("industrial")
      ? "industrial"
      : "residencial"; // Por defecto

  console.log("🚪 Tipo de puerta detectado:", tipo);

  return (
    <ConfigPuertaSeccional
      datosIniciales={datosIniciales}
      onSubmit={onSubmit}
      guardando={guardando}
      modoEdicion={modoEdicion}
      tipoOverride={tipo}
    />
  );
}