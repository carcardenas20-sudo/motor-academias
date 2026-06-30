const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Academia {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  logo_url: string | null;
  color_acento: string;
  activa: boolean;
  creada_en: string;
}

export interface AcademiaCreate {
  slug: string;
  nombre: string;
  descripcion?: string;
  logo_url?: string;
  color_acento?: string;
}

export interface AdminResponse {
  id: string;
  email: string;
  nombre: string | null;
  activo: boolean;
  creado_en: string;
}

export interface AdminCreate {
  email: string;
  password?: string;
  nombre: string;
}

export async function getAcademias(token: string): Promise<Academia[]> {
  const response = await fetch(`${API_URL}/academias`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al obtener las academias');
  }

  return response.json();
}

export async function createAcademia(token: string, data: AcademiaCreate): Promise<Academia> {
  const response = await fetch(`${API_URL}/academias`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al crear la academia');
  }

  return response.json();
}

export async function getAcademiaAdmins(token: string, academiaId: string): Promise<AdminResponse[]> {
  const response = await fetch(`${API_URL}/academias/${academiaId}/admins`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al obtener los administradores');
  }

  return response.json();
}

export async function createAcademiaAdmin(
  token: string,
  academiaId: string,
  data: AdminCreate
): Promise<AdminResponse> {
  const response = await fetch(`${API_URL}/academias/${academiaId}/admins`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al crear el administrador');
  }

  return response.json();
}
