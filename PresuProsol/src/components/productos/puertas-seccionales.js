import dynamic from "next/dynamic";

const ConfigPuertasSeccionales = dynamic(
  () => import("../../pages/puertas-seccionales/[tipo]"),
  { ssr: false }
);

export default function PuertasSeccionalesForm({ 
  datosIniciales = null, 
  onSubmit = null, 
  guardando = false, 
  modoEdicion = false 
}) {
  const tipo = datosIniciales?.tipo?.replace('puerta-seccional-', '') || 'residencial';

  return (
    <ConfigPuertasSeccionales
      datosIniciales={datosIniciales}
      onSubmit={onSubmit}
      guardando={guardando}
      modoEdicion={modoEdicion}
      tipoOverride={tipo}
    />
  );
}