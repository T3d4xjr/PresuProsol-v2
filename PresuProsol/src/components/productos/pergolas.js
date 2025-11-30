import dynamic from "next/dynamic";

const ConfigPergola = dynamic(
  () => import("../../pages/pergolas/[tipo]"),
  { ssr: false }
);

export default function PergolasForm({
  datosIniciales = null,
  onSubmit = null,
  guardando = false,
  modoEdicion = false,
}) {
  console.log("📦 [PergolasForm] Props:", {
    modoEdicion,
    tieneDatos: !!datosIniciales,
    guardando,
  });

  return (
    <ConfigPergola
      datosIniciales={datosIniciales}
      onSubmit={onSubmit}
      guardando={guardando}
      modoEdicion={modoEdicion}
    />
  );
}