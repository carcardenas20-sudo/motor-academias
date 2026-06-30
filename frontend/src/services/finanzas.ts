const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Transaccion {
  id: string;
  tipo: 'venta' | 'costo';
  monto: number;
  fecha: string;
  detalle: string;
}

export interface FinanzasMetricas {
  ingresos_totales: number;
  costos_totales: number;
  beneficio_neto: number;
  transacciones: Transaccion[];
}

export async function getFinanzasMetricas(token: string, academiaId: string): Promise<FinanzasMetricas> {
  const response = await fetch(`${API_URL}/academias/${academiaId}/finanzas/metricas`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al obtener las métricas financieras.');
  }

  return response.json();
}

export async function createCosto(
  token: string,
  academiaId: string,
  data: { monto: number; descripcion: string }
): Promise<{ id: string; monto: number; descripcion: string; creado_en: string }> {
  const response = await fetch(`${API_URL}/academias/${academiaId}/finanzas/costos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al registrar el costo.');
  }

  return response.json();
}

export async function deleteCosto(token: string, academiaId: string, costoId: string): Promise<void> {
  const response = await fetch(`${API_URL}/academias/${academiaId}/finanzas/costos/${costoId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al eliminar el costo.');
  }
}
