import React, { useState, useEffect } from 'react';
import TodoList from '../components/TodoList';
import TodoForm from '../components/TodoForm';
import { todoService } from '../api/todoService';
import '../styles/todo.css';

function TodoPage() {
  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Fetch todos on component mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await todoService.fetchTodos();
      setTodos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load todos');
      setTodos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTodo = async (newTodo) => {
    setIsAdding(true);
    setError('');
    try {
      const createdTodo = await todoService.createTodo(newTodo);
      setTodos([...todos, createdTodo]);
    } catch (err) {
      setError(err.message || 'Failed to add todo');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateTodo = async (id, updatedTodo) => {
    setError('');
    try {
      const result = await todoService.updateTodo(id, updatedTodo);
      setTodos(todos.map((todo) => (todo.id === id ? result : todo)));
    } catch (err) {
      setError(err.message || 'Failed to update todo');
    }
  };

  const handleDeleteTodo = async (id) => {
    setError('');
    try {
      await todoService.deleteTodo(id);
      setTodos(todos.filter((todo) => todo.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete todo');
    }
  };

  return (
    <div className="todo-page">
      <div className="todo-container">
        <header className="todo-header">
          <h1>My Todo App</h1>
          <p>Organize your tasks efficiently</p>
        </header>

        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={() => setError('')} className="close-btn">
              ✕
            </button>
          </div>
        )}

        <div className="todo-content">
          <TodoForm onAdd={handleAddTodo} isLoading={isAdding} />
          <TodoList
            todos={todos}
            isLoading={isLoading}
            error={error && !isAdding ? error : ''}
            onUpdate={handleUpdateTodo}
            onDelete={handleDeleteTodo}
          />
        </div>
      </div>
    </div>
  );
}

export default TodoPage;
