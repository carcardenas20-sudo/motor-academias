const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface TokenData {
  usuario_id: string;
  academia_id: string | null;
  rol: 'super_admin' | 'admin_academia' | 'estudiante';
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export async function login(email: string, password: string, tenant?: string | null): Promise<LoginResponse> {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const url = tenant ? `${API_URL}/auth/login?tenant=${encodeURIComponent(tenant)}` : `${API_URL}/auth/login`;

  const headers: HeadersInit = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  if (tenant) {
    headers['X-Tenant-Slug'] = tenant;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al iniciar sesión');
  }

  return response.json();
}

export async function getMe(token: string): Promise<TokenData> {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Token inválido o expirado');
  }

  return response.json();
}
