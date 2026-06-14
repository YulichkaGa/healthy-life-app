const API_BASE_URL = '/api/todos';

export const todoService = {
  async fetchTodos() {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) throw new Error('Failed to fetch todos');
    const json = await response.json();
    return json.data;
  },

  async createTodo(todo) {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo),
    });
    if (!response.ok) throw new Error('Failed to create todo');
    const json = await response.json();
    return json.data;
  },

  async updateTodo(id, todo) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo),
    });
    if (!response.ok) throw new Error('Failed to update todo');
    const json = await response.json();
    return json.data;
  },

  async deleteTodo(id) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete todo');
    return await response.json();
  },
};