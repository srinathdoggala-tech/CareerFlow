const API_BASE = 'http://localhost:5000/api';

// Helper to get auth headers
const getHeaders = () => {
  const token = localStorage.getItem('careerflow_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Generic fetch wrapper
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth API
  auth: {
    register: (data: any) => request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    login: (data: any) => request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    googleLogin: (data: any) => request<any>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    me: () => request<any>('/auth/me'),
  },

  // Applications API
  applications: {
    list: (filters: { status?: string; priority?: string; workMode?: string; jobType?: string; search?: string } = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params.append(key, val);
      });
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<any[]>(`/applications${query}`);
    },
    get: (id: string) => request<any>(`/applications/${id}`),
    create: (data: any) => request<any>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => request<any>(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request<any>(`/applications/${id}`, {
      method: 'DELETE',
    }),
  },

  // Dashboard API
  dashboard: {
    getStats: () => request<any>('/dashboard/stats'),
  },

  // Goals API
  goals: {
    get: () => request<any>('/goals'),
    update: (data: any) => request<any>('/goals', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  },

  // AI Copilot API
  ai: {
    analyzeJD: (data: { jd: string; resume: string }) => request<any>('/ai/analyze-jd', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    generateOutreach: (data: { type: string; companyName: string; jobTitle: string; jd: string; resume: string; senderName: string }) => request<any>('/ai/generate-outreach', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
};
