const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Curso {
  id: string;
  academia_id: string;
  titulo: string;
  descripcion: string | null;
  orden: number;
  publicado: boolean;
  creado_en: string;
  actualizado_en: string | null;
}

export interface Bloque {
  id: string;
  academia_id: string;
  curso_id: string;
  titulo: string;
  orden: number;
  creado_en: string;
  actualizado_en: string | null;
}

export interface Pildora {
  id: string;
  academia_id: string;
  bloque_id: string;
  titulo: string;
  tipo: 'video' | 'texto' | 'prueba';
  contenido: string | null;
  duracion_min: number | null;
  orden: number;
  publicada: boolean;
  actualizado_en: string | null;
}

export interface Progreso {
  pildora_id: string;
  completada: boolean;
  completada_en: string | null;
}

// ─────────────────────────────────────────────
// CURSOS SERVICES
// ─────────────────────────────────────────────

export async function getCursos(token: string, academiaId: string): Promise<Curso[]> {
  const response = await fetch(`${API_URL}/academias/${academiaId}/cursos`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al obtener los cursos.');
  }

  return response.json();
}

export async function createCurso(
  token: string,
  academiaId: string,
  data: { titulo: string; descripcion?: string; orden?: number; publicado?: boolean }
): Promise<Curso> {
  const response = await fetch(`${API_URL}/academias/${academiaId}/cursos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al crear el curso.');
  }

  return response.json();
}

export async function updateCurso(
  token: string,
  academiaId: string,
  cursoId: string,
  data: { titulo: string; descripcion?: string; orden?: number; publicado?: boolean }
): Promise<Curso> {
  const response = await fetch(`${API_URL}/academias/${academiaId}/cursos/${cursoId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al actualizar el curso.');
  }

  return response.json();
}

export async function deleteCurso(token: string, academiaId: string, cursoId: string): Promise<void> {
  const response = await fetch(`${API_URL}/academias/${academiaId}/cursos/${cursoId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al eliminar el curso.');
  }
}

// ─────────────────────────────────────────────
// BLOQUES SERVICES
// ─────────────────────────────────────────────

export async function getBloques(token: string, academiaId: string, cursoId: string): Promise<Bloque[]> {
  const response = await fetch(`${API_URL}/academias/${academiaId}/cursos/${cursoId}/bloques`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al obtener los módulos.');
  }

  return response.json();
}

export async function createBloque(
  token: string,
  academiaId: string,
  cursoId: string,
  data: { titulo: string; orden?: number }
): Promise<Bloque> {
  const response = await fetch(`${API_URL}/academias/${academiaId}/cursos/${cursoId}/bloques`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al crear el módulo.');
  }

  return response.json();
}

export async function updateBloque(
  token: string,
  academiaId: string,
  bloqueId: string,
  data: { titulo: string; orden?: number }
): Promise<Bloque> {
  const response = await fetch(`${API_URL}/academias/${academiaId}/bloques/${bloqueId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al actualizar el módulo.');
  }

  return response.json();
}

export async function deleteBloque(token: string, academiaId: string, bloqueId: string): Promise<void> {
  const response = await fetch(`${API_URL}/academias/${academiaId}/bloques/${bloqueId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al eliminar el módulo.');
  }
}

// ─────────────────────────────────────────────
// PILDORAS SERVICES
// ─────────────────────────────────────────────

export async function getPildoras(token: string, academiaId: string, bloqueId: string): Promise<Pildora[]> {
  const response = await fetch(`${API_URL}/academias/${academiaId}/bloques/${bloqueId}/pildoras`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al obtener las clases.');
  }

  return response.json();
}

export async function createPildora(
  token: string,
  academiaId: string,
  bloqueId: string,
  data: { titulo: string; tipo?: string; contenido?: string; duracion_min?: number; orden?: number; publicada?: boolean }
): Promise<Pildora> {
  const response = await fetch(`${API_URL}/academias/${academiaId}/bloques/${bloqueId}/pildoras`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al crear la lección.');
  }

  return response.json();
}

export async function updatePildora(
  token: string,
  academiaId: string,
  pildoraId: string,
  data: { titulo: string; tipo?: string; contenido?: string; duracion_min?: number; orden?: number; publicada?: boolean }
): Promise<Pildora> {
  const response = await fetch(`${API_URL}/academias/${academiaId}/pildoras/${pildoraId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al actualizar la lección.');
  }

  return response.json();
}

export async function deletePildora(token: string, academiaId: string, pildoraId: string): Promise<void> {
  const response = await fetch(`${API_URL}/academias/${academiaId}/pildoras/${pildoraId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al eliminar la lección.');
  }
}

// ─────────────────────────────────────────────
// PROGRESO SERVICES
// ─────────────────────────────────────────────

export async function getProgreso(token: string, academiaId: string): Promise<Progreso[]> {
  const response = await fetch(`${API_URL}/academias/${academiaId}/progreso`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al obtener el progreso.');
  }

  return response.json();
}

export async function toggleProgreso(
  token: string,
  academiaId: string,
  pildoraId: string,
  completada: boolean
): Promise<Progreso> {
  const response = await fetch(`${API_URL}/academias/${academiaId}/progreso/${pildoraId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ completada }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al actualizar el progreso de la lección.');
  }

  return response.json();
}
