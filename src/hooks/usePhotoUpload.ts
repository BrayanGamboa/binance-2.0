import { useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import { conexionBD } from '../services/ConexionBD';

const BUCKET = 'avatars';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_MB = 5;

interface UsePhotoUploadReturn {
  preview: string | null;
  setPreview: Dispatch<SetStateAction<string | null>>;
  file: File | null;
  uploading: boolean;
  uploadError: string | null;
  handleFileSelect: (selectedFile: File) => string | null;
  uploadPhoto: (userDocument: string) => Promise<string | null>;
}

function usePhotoUpload(initialPreview: string | null = null): UsePhotoUploadReturn {
  const [preview, setPreview] = useState<string | null>(initialPreview);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  /**
    * El método handleFileSelect valida el archivo seleccionado y genera una URL de vista previa. 
    * Devuelve un mensaje de error si el archivo no es válido, o null si todo está bien.
   */
  const handleFileSelect = useCallback(
    (selectedFile: File): string | null => {
      if (!ALLOWED_TYPES.includes(selectedFile.type)) {
        return 'Solo se permiten imágenes JPG, PNG, WebP o GIF';
      }
      if (selectedFile.size > MAX_SIZE_MB * 1024 * 1024) {
        return `La imagen no puede superar ${MAX_SIZE_MB} MB`;
      }

      // Revoca la URL de objeto anterior para evitar errores de memoria
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }

      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      setFile(selectedFile);
      setUploadError(null);
      return null;
    },
    [preview],
  );

  /**
   * Sube el archivo seleccionado a Supabase Storage.
   * @param userDocument — se usa para nombrar el archivo de manera única
   * @returns URL pública en caso de éxito, null en caso de fallo
   */
  const uploadPhoto = useCallback(
    async (userDocument: string): Promise<string | null> => {
      if (!file) return null;

      setUploading(true);
      setUploadError(null);

      try {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const path = `${userDocument}/${Date.now()}.${ext}`;

        const { error: storageError } = await conexionBD.storage
          .from(BUCKET)
          .upload(path, file, { upsert: true, contentType: file.type });

        if (storageError) throw storageError;

        const { data } = conexionBD.storage.from(BUCKET).getPublicUrl(path);
        return data.publicUrl;
      } catch (err) {
        setUploadError((err as Error).message ?? 'Error al subir la imagen');
        return null;
      } finally {
        setUploading(false);
      }
    },
    [file],
  );

  return {
    preview,
    setPreview,
    file,
    uploading,
    uploadError,
    handleFileSelect,
    uploadPhoto,
  };
}

export { usePhotoUpload };