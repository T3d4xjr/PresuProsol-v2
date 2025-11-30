import dynamic from "next/dynamic";

const ConfigMosquitera = dynamic(
  () => import("../../pages/mosquiteras/[tipo]"),
  { ssr: false }
);

export default function MosquiterasForm({ 
  datosIniciales = null, 
  onSubmit = null, 
  guardando = false, 
  modoEdicion = false 
}) {
  console.log("📦 [MosquiterasForm Wrapper] Props recibidas:", {
    modoEdicion,
    tieneDatosIniciales: !!datosIniciales,
    tieneOnSubmit: !!onSubmit,
    guardando
  });

  // Determinar el tipo desde datosIniciales
  const tipoDetectado = datosIniciales?.tipo?.toLowerCase() || "";
  
  let tipo = "corredera"; // valor por defecto
  
  if (tipoDetectado.includes("corredera")) tipo = "corredera";
  else if (tipoDetectado.includes("plisada")) tipo = "plisada";
  else if (tipoDetectado.includes("enrollable")) tipo = "enrollable";
  else if (tipoDetectado.includes("fija")) tipo = "fija";
  else if (tipoDetectado.includes("abatible")) tipo = "abatible";
  else if (tipoDetectado.includes("lateral")) tipo = "lateral";

  console.log("   Tipo detectado:", tipo);

  return (
    <ConfigMosquitera
      datosIniciales={datosIniciales}
      onSubmit={onSubmit}
      guardando={guardando}
      modoEdicion={modoEdicion}
      tipoOverride={tipo}
    />
  );
}