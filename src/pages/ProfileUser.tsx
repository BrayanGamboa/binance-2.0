import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import './ProfileUser.css';
import { conexionBD } from '../services/ConexionBD';
import { profileSchema, type ProfileFormValues } from '../schemas/profileSchema';
import { usePhotoUpload } from '../hooks/usePhotoUpload';

const STORAGE_KEY = 'ct_profile_doc';
const DEFAULT_DOCUMENT = '1234';

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="pf_field">
      <label className="pf_field_label" htmlFor={id}>
        {label}
      </label>
      {children}
      {error && (
        <p className="pf_field_error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface UserRow {
  name: string | null;
  email: string | null;
  document: string | number;
  url_image?: string | null;
  password?: string;
}

export function ProfileUser() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedAvatarRef = useRef<string | null>(null);

  // Estado de la página
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [saveError, setSaveError] = useState('');
  const [photoFileError, setPhotoFileError] = useState('');
  const [editMode, setEditMode] = useState(false);

  // Formulario con validación Zod
  const {
    register,
    handleSubmit,
    reset,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      document: '',
      password: '',
      confirmPassword: '',
    },
  });

  const watchedName = watch('name');

  // Manejo de la foto de perfil
  const {
    preview,
    setPreview,
    uploading,
    uploadError,
    handleFileSelect,
    uploadPhoto,
  } = usePhotoUpload(null);

  // Carga los datos del usuario al montar el componente
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const storedDoc = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_DOCUMENT;

        const { data: allRows, error: allErr } = await conexionBD
          .from('tbl_user')
          .select('*');

        if (allErr) throw allErr;
        if (!allRows || allRows.length === 0)
          throw new Error('La tabla tbl_user está vacía o sin permisos de lectura');

        const rows = allRows as UserRow[];
        const user =
          rows.find((r) => String(r.document) === String(storedDoc)) ??
          rows.find((r) => String(r.document) === String(DEFAULT_DOCUMENT)) ??
          rows[0];

        if (!user) throw new Error('No se encontró ningún usuario en la base de datos');

        localStorage.setItem(STORAGE_KEY, String(user.document));

        reset({
          name: user.name ?? '',
          email: user.email ?? '',
          document: String(user.document ?? ''),
          password: '',
          confirmPassword: '',
        });

        if (user.url_image) {
          setPreview(user.url_image);
          savedAvatarRef.current = user.url_image;
        }
      } catch (err) {
        setFetchError((err as Error).message ?? 'No se pudo cargar el perfil');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [reset, setPreview]);

  const handleEdit = () => {
    setSuccessMsg('');
    setSaveError('');
    setEditMode(true);
  };

  const handleCancel = () => {
    reset();
    setPhotoFileError('');
    setEditMode(false);
    setSaveError('');
    // Descarta la foto seleccionada y restaura la última guardada
    setPreview(savedAvatarRef.current);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAvatarClick = () => {
    if (editMode) fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const err = handleFileSelect(selected);
    setPhotoFileError(err ?? '');
  };

  // Solo se ejecuta si Zod valida correctamente el formulario
  const onSubmit = async (data: ProfileFormValues) => {
    setSuccessMsg('');
    setSaveError('');
    setSaving(true);

    try {
      let url_image = preview;

      if (!photoFileError && fileInputRef.current?.files?.[0]) {
        const publicUrl = await uploadPhoto(data.document);
        if (publicUrl) {
          url_image = publicUrl;
        } else if (uploadError) {
          setSaveError(`Error al subir la imagen: ${uploadError}`);
          return;
        }
      }

      const { error: updateError } = await conexionBD
        .from('tbl_user')
        .update({ name: data.name, email: data.email, url_image })
        .eq('document', data.document);

      if (updateError) throw updateError;

      // La contraseña solo se guarda en localStorage (no hay auth en el backend)
      if (data.password) {
        try {
          const stored = JSON.parse(localStorage.getItem('ct_user') ?? '{}') as Record<string, string>;
          stored.password = data.password;
          localStorage.setItem('ct_user', JSON.stringify(stored));
        } catch {
        }
      }

      // Actualiza la referencia de la foto guardada para futuros cancelados
      savedAvatarRef.current = url_image ?? savedAvatarRef.current;
      if (url_image) setPreview(url_image);
      if (fileInputRef.current) fileInputRef.current.value = '';
      reset({ ...getValues(), password: '', confirmPassword: '' });
      setSuccessMsg('Perfil actualizado correctamente');
      setEditMode(false);
    } catch (err) {
      setSaveError((err as Error).message ?? 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  // Pantallas de carga y error antes del render principal
  if (loading) {
    return (
      <div className="pf_page">
        <div className="pf_loading" aria-live="polite">
          Cargando perfil…
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="pf_page">
        <div className="pf_error_box" role="alert">
          {fetchError}
        </div>
      </div>
    );
  }

  const isBusy = saving || uploading || isSubmitting;

  return (
    <div className="pf_page">
      <div className="pf_page_header">
        <div>
          <h2 className="pf_page_title">Configuración de perfil</h2>
          <p className="pf_page_subtitle">Actualiza tu información personal</p>
        </div>
        {!editMode && (
          <button
            type="button"
            className="pf_btn pf_btn--outline"
            onClick={handleEdit}
          >
            ✏ Editar perfil
          </button>
        )}
      </div>

      <div className="pf_card">
        <form className="pf_form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="pf_avatar_section">
            <button
              type="button"
              className={`pf_avatar_btn ${!editMode ? 'pf_avatar_btn--static' : ''}`}
              onClick={handleAvatarClick}
              aria-label={editMode ? 'Cambiar foto de perfil' : 'Foto de perfil'}
              title={editMode ? 'Cambiar foto' : undefined}
            >
              {preview ? (
                <img src={preview} alt="Foto de perfil" className="pf_avatar_img" />
              ) : (
                <span className="pf_avatar_placeholder" aria-hidden="true">
                  {watchedName ? watchedName.charAt(0).toUpperCase() : '?'}
                </span>
              )}
              {editMode && (
                <span className="pf_avatar_overlay" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  Cambiar foto
                </span>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="pf_file_input"
              onChange={handleFileChange}
              aria-hidden="true"
              tabIndex={-1}
            />

            {photoFileError && (
              <p className="pf_field_error" role="alert">
                {photoFileError}
              </p>
            )}
            <p className="pf_avatar_hint">JPG, PNG, WebP o GIF · máx. 5 MB</p>
          </div>

          <div className="pf_fields">
            <Field
              id="pf-name"
              label="Nombre completo"
              error={editMode ? errors.name?.message : undefined}
            >
              <input
                id="pf-name"
                type="text"
                className={`pf_input ${!editMode ? 'pf_input--readonly' : errors.name ? 'pf_input_error' : ''}`}
                placeholder="Tu nombre completo"
                autoComplete="name"
                readOnly={!editMode}
                {...register('name')}
              />
            </Field>

            <Field
              id="pf-email"
              label="Correo electrónico"
              error={editMode ? errors.email?.message : undefined}
            >
              <input
                id="pf-email"
                type="email"
                className={`pf_input ${!editMode ? 'pf_input--readonly' : errors.email ? 'pf_input_error' : ''}`}
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                readOnly={!editMode}
                {...register('email')}
              />
            </Field>

            <Field
              id="pf-document"
              label="Documento / ID"
              error={errors.document?.message}
            >
              <input
                id="pf-document"
                type="text"
                className="pf_input pf_input--readonly"
                aria-readonly="true"
                title="El documento no se puede cambiar"
                readOnly
                {...register('document')}
              />
            </Field>

            {editMode && (
              <>
                <div className="pf_divider">
                  <span>Cambiar contraseña</span>
                </div>

                <Field
                  id="pf-password"
                  label="Nueva contraseña"
                  error={errors.password?.message}
                >
                  <input
                    id="pf-password"
                    type="password"
                    className={`pf_input ${errors.password ? 'pf_input_error' : ''}`}
                    placeholder="Mínimo 8 caracteres (opcional)"
                    autoComplete="new-password"
                    {...register('password')}
                  />
                </Field>

                <Field
                  id="pf-confirmPassword"
                  label="Confirmar contraseña"
                  error={errors.confirmPassword?.message}
                >
                  <input
                    id="pf-confirmPassword"
                    type="password"
                    className={`pf_input ${errors.confirmPassword ? 'pf_input_error' : ''}`}
                    placeholder="Repite la nueva contraseña"
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                  />
                </Field>
              </>
            )}
          </div>

          {successMsg && (
            <p className="pf_feedback pf_feedback_success" role="status">
              {successMsg}
            </p>
          )}
          {saveError && (
            <p className="pf_feedback pf_feedback_error" role="alert">
              {saveError}
            </p>
          )}

          {editMode && (
            <div className="pf_actions">
              <button
                type="button"
                className="pf_btn pf_btn_ghost"
                onClick={handleCancel}
                disabled={isBusy}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="pf_btn pf_btn_primary"
                disabled={isBusy}
              >
                {isBusy ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
