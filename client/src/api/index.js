const BASE = '/api'

function token() {
  return localStorage.getItem('token')
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'שגיאה')
  return data
}

export const api = {
  auth: {
    register: (body) => req('POST', '/auth/register', body),
    login: (body) => req('POST', '/auth/login', body),
    me: () => req('GET', '/auth/me'),
  },
  nutrition: {
    getMeals: (date) => req('GET', `/nutrition/meals${date ? `?date=${date}` : ''}`),
    addMeal: (body) => req('POST', '/nutrition/meals', body),
    deleteMeal: (id) => req('DELETE', `/nutrition/meals/${id}`),
    analyze: (image) => req('POST', '/nutrition/analyze', { image }),
    search: (q) => req('GET', `/nutrition/search?q=${encodeURIComponent(q)}`),
  },
  fitness: {
    getWorkouts: (date) => req('GET', `/fitness/workouts${date ? `?date=${date}` : ''}`),
    addWorkout: (body) => req('POST', '/fitness/workouts', body),
    deleteWorkout: (id) => req('DELETE', `/fitness/workouts/${id}`),
    updateSteps: (steps) => req('PATCH', '/fitness/steps', { steps }),
    updateWater: (glasses) => req('PATCH', '/fitness/water', { glasses }),
  },
  sleep: {
    log: (body) => req('POST', '/sleep/log', body),
    history: () => req('GET', '/sleep/history'),
  },
  mood: {
    log: (mood) => req('POST', '/mood/log', { mood }),
    history: () => req('GET', '/mood/history'),
  },
  ai: {
    chat: (messages) => req('POST', '/ai/chat', { messages }),
    insight: () => req('GET', '/ai/insight'),
  },
  dashboard: {
    today: () => req('GET', '/dashboard/today'),
    weekly: () => req('GET', '/dashboard/weekly'),
    streak: () => req('GET', '/dashboard/streak'),
  },
}