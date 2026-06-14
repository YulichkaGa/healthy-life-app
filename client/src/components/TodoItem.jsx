import React from 'react';
import '../styles/todo.css';

function TodoItem({ todo, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(todo.title);
  const [editedDescription, setEditedDescription] = React.useState(
    todo.description || ''
  );

  const handleToggleComplete = () => {
    onUpdate(todo.id, { ...todo, completed: !todo.completed });
  };

  const handleSaveEdit = () => {
    if (editedTitle.trim()) {
      onUpdate(todo.id, {
        ...todo,
        title: editedTitle,
        description: editedDescription,
      });
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      onDelete(todo.id);
    }
  };

  if (isEditing) {
    return (
      <div className="todo-item editing">
        <div className="todo-edit-form">
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="todo-edit-input"
            placeholder="Todo title"
          />
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className="todo-edit-textarea"
            placeholder="Description (optional)"
          />
          <div className="todo-edit-actions">
            <button onClick={handleSaveEdit} className="btn btn-primary">
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed || false}
        onChange={handleToggleComplete}
        className="todo-checkbox"
      />
      <div className="todo-content">
        <h3 className="todo-title">{todo.title}</h3>
        {todo.description && <p className="todo-description">{todo.description}</p>}
      </div>
      <div className="todo-actions">
        <button onClick={() => setIsEditing(true)} className="btn btn-edit">
          Edit
        </button>
        <button onClick={handleDelete} className="btn btn-delete">
          Delete
        </button>
      </div>
    </div>
  );
}

export default TodoItem;
