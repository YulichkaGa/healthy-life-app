const express = require('express');
const { query } = require('../db/init');

const router = express.Router();

// GET /api/todos - Get all todos
router.get('/todos', async (req, res, next) => {
  try {
    const todos = query('SELECT * FROM todos ORDER BY createdAt DESC');
    res.status(200).json({ success: true, data: todos });
  } catch (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    next(err);
  }
});

// GET /api/todos/:id - Get single todo
router.get('/todos/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid todo ID',
      });
    }

    const todo = query('SELECT * FROM todos WHERE id = ?', [id]);

    if (!todo || todo.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found',
      });
    }

    res.status(200).json({ success: true, data: todo[0] });
  } catch (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    next(err);
  }
});

// POST /api/todos - Create new todo
router.post('/todos', async (req, res, next) => {
  try {
    const { title, description } = req.body;

    // Validate request body
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Title is required and must be a non-empty string',
      });
    }

    // Optional: Validate description if provided
    if (description && typeof description !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Description must be a string',
      });
    }

    const result = query(
      'INSERT INTO todos (title, description, completed) VALUES (?, ?, ?)',
      [title.trim(), description?.trim() || null, 0]
    );

    const newTodo = query('SELECT * FROM todos WHERE id = ?', [result.lastId]);

    res.status(201).json({
      success: true,
      data: newTodo[0],
      message: 'Todo created successfully',
    });
  } catch (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    next(err);
  }
});

// PUT /api/todos/:id - Update todo
router.put('/todos/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid todo ID',
      });
    }

    // Check if todo exists
    const existingTodo = query('SELECT * FROM todos WHERE id = ?', [id]);
    if (!existingTodo || existingTodo.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found',
      });
    }

    // Validate request body - at least one field must be provided
    if (!title && description === undefined && completed === undefined) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (title, description, or completed) must be provided',
      });
    }

    // Validate field types
    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Title must be a non-empty string',
      });
    }

    if (description !== undefined && description !== null && typeof description !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Description must be a string',
      });
    }

    if (completed !== undefined && typeof completed !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Completed must be a boolean',
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title.trim());
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description ? description.trim() : null);
    }

    if (completed !== undefined) {
      updates.push('completed = ?');
      params.push(completed ? 1 : 0);
    }

    updates.push('updatedAt = CURRENT_TIMESTAMP');
    params.push(id);

    query(
      `UPDATE todos SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const updatedTodo = query('SELECT * FROM todos WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      data: updatedTodo[0],
      message: 'Todo updated successfully',
    });
  } catch (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    next(err);
  }
});

// DELETE /api/todos/:id - Delete todo
router.delete('/todos/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid todo ID',
      });
    }

    // Check if todo exists
    const existingTodo = query('SELECT * FROM todos WHERE id = ?', [id]);
    if (!existingTodo || existingTodo.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found',
      });
    }

    query('DELETE FROM todos WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      data: null,
      message: 'Todo deleted successfully',
    });
  } catch (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    next(err);
  }
});

module.exports = router;
