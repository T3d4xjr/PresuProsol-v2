import dynamic from "next/dynamic";

const ConfigProteccionSolar = dynamic(
  () => import("../../pages/proteccion-solar/[tipo]"),
  { ssr: false }
);

export default function ProteccionSolarForm({
  datosIniciales = null,
  onSubmit = null,
  guardando = false,
  modoEdicion = false,
}) {
  console.log("📦 [ProteccionSolarForm] Props:", {
    modoEdicion,
    tieneDatos: !!datosIniciales,
    guardando,
  });

  // Detectar tipo desde datosIniciales.tipo
  // Tipos: "proteccion-solar-ventuszip01", "proteccion-solar-Stor-disaluz", "proteccion-solar-Stor-vilaluz"
  const tipo =
    datosIniciales?.tipo?.includes("ventuszip01")
      ? "ventuszip01"
      : datosIniciales?.tipo?.includes("Stor-disaluz")
      ? "Stor-disaluz"
      : datosIniciales?.tipo?.includes("Stor-vilaluz")
      ? "Stor-vilaluz"
      : "ventuszip01"; // Por defecto

  return (
    <ConfigProteccionSolar
      datosIniciales={datosIniciales}
      onSubmit={onSubmit}
      guardando={guardando}
      modoEdicion={modoEdicion}
      tipoOverride={tipo}
    />
  );
}