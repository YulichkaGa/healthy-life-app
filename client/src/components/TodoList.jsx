import React from 'react';
import TodoItem from './TodoItem';
import '../styles/todo.css';

function TodoList({ todos, isLoading, error, onUpdate, onDelete }) {
  if (isLoading) {
    return (
      <div className="todo-list loading">
        <div className="spinner"></div>
        <p>Loading todos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="todo-list error">
        <div className="error-banner">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!todos || todos.length === 0) {
    return (
      <div className="todo-list empty">
        <p>No todos yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="todo-list">
      <h2>Your Todos ({todos.length})</h2>
      <div className="todos-container">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

export default TodoList;
