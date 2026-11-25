async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });
  if (!response.ok) {
    let message = 'Không thể hoàn thành yêu cầu.';
    try {
      const body = await response.json();
      if (body.error) message = body.error;
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  tasks: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') query.set(key, value);
    });
    return request(`/api/tasks${query.size ? `?${query}` : ''}`);
  },
  task: (id) => request(`/api/tasks/${id}`),
  createTask: (task) => request('/api/tasks', { method: 'POST', body: JSON.stringify(task) }),
  updateTask: (id, task) => request(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(task) }),
  toggleTask: (id) => request(`/api/tasks/${id}/toggle`, { method: 'PATCH' }),
  deleteTask: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' }),
  restoreTask: (task) => request('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      due_time: task.due_time,
      priority: task.priority,
      category: task.category,
      status: task.status
    })
  }),
  stats: () => request('/api/stats')
};
