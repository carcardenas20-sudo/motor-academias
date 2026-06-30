const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface GamificacionPerfil {
  puntos: number;
  nivel: number;
  racha_dias: number;
}

export interface LeaderboardEntry {
  nombre: string;
  puntos: number;
  nivel: number;
}

export async function getGamificacionPerfil(token: string, academiaId: string): Promise<GamificacionPerfil> {
  const response = await fetch(`${API_URL}/academias/${academiaId}/gamificacion/perfil`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al obtener el perfil de gamificación.');
  }

  return response.json();
}

export async function getLeaderboard(token: string, academiaId: string): Promise<LeaderboardEntry[]> {
  const response = await fetch(`${API_URL}/academias/${academiaId}/gamificacion/leaderboard`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al obtener la tabla de clasificación.');
  }

  return response.json();
}
