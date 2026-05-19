import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";
import { conexionBD } from "../services/ConexionBD";
import { Spinner } from "../components/common/Spinner";
import "./UsersPage.css";


interface User {
  document: string;
  name: string | null;
  email: string | null;
  url_image: string | null;
}

interface AvatarProps {
  url: string | null;
  name: string | null;
}

interface EditModalProps {
  user: User;
  onClose: () => void;
  onSaved: (updated: User) => void;
}

interface DeleteConfirmProps {
  user: User;
  onClose: () => void;
  onDeleted: (document: string) => void;
}


function Avatar({ url, name }: AvatarProps) {
  if (url)
    return <img src={url} alt={name ?? undefined} className="ul_avatar" loading="lazy" />;
  return (
    <span className="ul_avatar ul_avatar_placeholder" aria-hidden="true">
      {name ? name.charAt(0).toUpperCase() : "?"}
    </span>
  );
}


function EditModal({ user, onClose, onSaved }: EditModalProps) {
  const [form, setForm] = useState({ name: user.name ?? "", email: user.email ?? "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("Nombre y correo son obligatorios.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { error: dbErr } = await conexionBD
        .from("tbl_user")
        .update({ name: form.name.trim(), email: form.email.trim() })
        .eq("document", user.document);
      if (dbErr) throw dbErr;
      onSaved({ ...user, name: form.name.trim(), email: form.email.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="ul_modal_overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
      onClick={(e: MouseEvent<HTMLDivElement>) => e.target === e.currentTarget && onClose()}
    >
      <div className="ul_modal">
        <div className="ul_modal_header">
          <h3 id="edit-modal-title" className="ul_modal_title">
            Editar usuario
          </h3>
          <button
            type="button"
            className="ul_modal_close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form className="ul_modal_form" onSubmit={handleSubmit} noValidate>
          <div className="ul_field">
            <label htmlFor="edit-doc" className="ul_field_label">
              Documento
            </label>
            <input
              id="edit-doc"
              className="ul_field_input ul_field_input_readonly"
              value={user.document}
              readOnly
            />
          </div>

          <div className="ul_field">
            <label htmlFor="edit-name" className="ul_field_label">
              Nombre completo
            </label>
            <input
              id="edit-name"
              name="name"
              type="text"
              className="ul_field_input"
              value={form.name}
              onChange={handleChange}
              placeholder="Nombre completo"
              autoComplete="off"
              required
            />
          </div>

          <div className="ul_field">
            <label htmlFor="edit-email" className="ul_field_label">
              Correo electrónico
            </label>
            <input
              id="edit-email"
              name="email"
              type="email"
              className="ul_field_input"
              value={form.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              autoComplete="off"
              required
            />
          </div>

          {error && (
            <p className="ul_modal_error" role="alert">
              {error}
            </p>
          )}

          <div className="ul_modal_actions">
            <button
              type="button"
              className="ul_btn ul_btn_ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="ul_btn ul_btn_primary"
              disabled={saving}
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function DeleteConfirm({ user, onClose, onDeleted }: DeleteConfirmProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      const { error: dbErr } = await conexionBD
        .from("tbl_user")
        .delete()
        .eq("document", user.document);
      if (dbErr) throw dbErr;
      onDeleted(user.document);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
      setDeleting(false);
    }
  };

  return (
    <div
      className="ul_modal_overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      onClick={(e: MouseEvent<HTMLDivElement>) => e.target === e.currentTarget && onClose()}
    >
      <div className="ul_modal ul_modal_sm">
        <div className="ul_modal_header">
          <h3 id="delete-modal-title" className="ul_modal_title">
            Eliminar usuario
          </h3>
          <button
            type="button"
            className="ul_modal_close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <p className="ul_modal_body">
          ¿Estás seguro de que deseas eliminar a{" "}
          <strong>{user.name ?? user.document}</strong>? Esta acción no se puede
          deshacer.
        </p>

        {error && (
          <p className="ul_modal_error" role="alert">
            {error}
          </p>
        )}

        <div className="ul_modal_actions">
          <button
            type="button"
            className="ul_btn ul_btn_ghost"
            onClick={onClose}
            disabled={deleting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="ul_btn ul_btn_danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await conexionBD
        .from("tbl_user")
        .select("document, name, email, url_image")
        .order("name", { ascending: true });
      if (error) throw error;
      setUsers((data as User[]) ?? []);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "No se pudo cargar la lista de usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSaved = (updated: User) => {
    setUsers((prev) =>
      prev.map((u) => (u.document === updated.document ? updated : u)),
    );
    setEditUser(null);
  };

  const handleDeleted = (document: string) => {
    setUsers((prev) => prev.filter((u) => u.document !== document));
    setDeleteUser(null);
  };

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      String(u.document).includes(search),
  );

  return (
    <div className="ul_page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Usuarios</h2>
          <p className="page-subtitle">
            {loading
              ? "Cargando…"
              : `${users.length} usuario${users.length !== 1 ? "s" : ""} registrado${users.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          type="button"
          className="ul_btn ul_btn_outline"
          onClick={fetchUsers}
          disabled={loading}
        >
          ↻ Recargar
        </button>
      </div>

      <div className="ul_toolbar">
        <input
          type="search"
          className="ul_search"
          placeholder="Buscar por nombre, correo o documento…"
          value={search}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          aria-label="Buscar usuarios"
        />
        {search && (
          <p className="ul_results">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {loading && (
        <div className="ul_centered">
          <Spinner size="lg" />
        </div>
      )}

      {fetchError && (
        <div className="error-box" role="alert">
          <strong>Error:</strong> {fetchError}
        </div>
      )}

      {!loading && !fetchError && (
        <>
          {filtered.length === 0 ? (
            <p className="ul_empty">No se encontraron usuarios.</p>
          ) : (
            <div className="ul_table_wrap">
              <table className="ul_table">
                <thead>
                  <tr>
                    <th className="ul_col_avatar" aria-label="Avatar" />
                    <th className="ul_col_name">Nombre</th>
                    <th className="ul_col_email">Correo</th>
                    <th className="ul_col_doc">Documento</th>
                    <th className="ul_col_actions">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr key={user.document} className="ul_row">
                      <td className="ul_col_avatar">
                        <Avatar url={user.url_image} name={user.name} />
                      </td>
                      <td className="ul_col_name">{user.name ?? "—"}</td>
                      <td className="ul_col_email text-muted">
                        {user.email ?? "—"}
                      </td>
                      <td className="ul_col_doc font-mono">{user.document}</td>
                      <td className="ul_col_actions">
                        <button
                          type="button"
                          className="ul_action_btn ul_action_btn_edit"
                          onClick={() => setEditUser(user)}
                          aria-label={`Editar ${user.name ?? user.document}`}
                        >
                          ✏ Editar
                        </button>
                        <button
                          type="button"
                          className="ul_action_btn ul_action_btn_delete"
                          onClick={() => setDeleteUser(user)}
                          aria-label={`Eliminar ${user.name ?? user.document}`}
                        >
                          🗑 Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {editUser && (
        <EditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={handleSaved}
        />
      )}
      {deleteUser && (
        <DeleteConfirm
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
