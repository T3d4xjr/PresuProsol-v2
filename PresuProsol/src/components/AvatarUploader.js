// src/components/AvatarUploader.js
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../pages/api/supabaseClient';

const BUCKET = 'fotosPerfiles';
const BASE_URL =
  'https://vmbvmkrawjeedhhfhzdh.supabase.co/storage/v1/object/public/fotosPerfiles';

export default function AvatarUploader({ userId, currentUrl, onUploaded }) {
  const [preview, setPreview] = useState(
    currentUrl || '/assets/avatar.jpg' // avatar por defecto
  );
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 👇 sincroniza el preview con lo que venga del padre (perfil.foto_url)
  useEffect(() => {
    if (currentUrl) {
      setPreview(currentUrl);
    } else {
      setPreview('/assets/avatar.jpg');
    }
  }, [currentUrl]);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Selecciona un archivo de imagen válido.');
      return;
    }

    setErrorMsg('');
    // Vista previa inmediata en el navegador
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const ext = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${ext}`;
    const filePath = `${userId}/${fileName}`;

    // 1) Subir al bucket
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Error subiendo avatar:', uploadError);
      setErrorMsg('No se pudo subir la imagen. Inténtalo de nuevo.');
      setUploading(false);
      return;
    }

    // 2) Obtener URL pública
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    const publicUrl = data?.publicUrl || `${BASE_URL}/${filePath}`;

    // 3) Guardar la URL en la tabla usuarios
    const { error: dbError } = await supabase
      .from('usuarios')
      .update({
        foto_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (dbError) {
      console.error('Error guardando foto_url en usuarios:', dbError);
      setErrorMsg(
        'La imagen se subió, pero no se pudo guardar en tu perfil. Inténtalo luego.'
      );
      setUploading(false);
      return;
    }

    // 4) Actualizar estado local + informar al padre
    setUploading(false);
    setErrorMsg('');
    setPreview(publicUrl);
    onUploaded?.(publicUrl);
  };

  return (
    <div className="text-center">
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: '50%',
          overflow: 'hidden',
          margin: '0 auto 12px',
          border: '3px solid rgba(0,0,0,0.06)',
          boxShadow: '0 4px 10px rgba(15,23,42,0.12)',
        }}
      >
        <Image
          src={preview || '/assets/avatar.jpg'}
          alt="Foto de perfil"
          width={140}
          height={140}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      <label className="btn btn-outline-secondary btn-sm">
        {uploading ? 'Subiendo…' : 'Cambiar foto'}
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          style={{ display: 'none' }}
        />
      </label>

      {errorMsg && (
        <div className="mt-2 alert alert-danger p-2" style={{ fontSize: 13 }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}
