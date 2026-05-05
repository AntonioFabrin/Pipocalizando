import { Request, Response } from 'express';
import pool from '../config/db';

// ─── Categorias de filmes ────────────────────────────────────────────────────

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM movie_categories WHERE is_active = 1 ORDER BY name');
    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Erro interno' });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, emoji } = req.body;
    if (!name) { res.status(400).json({ message: 'Nome obrigatório.' }); return; }
    const [result]: any = await pool.query(
      'INSERT INTO movie_categories (name, description, emoji) VALUES (?, ?, ?)',
      [name, description || null, emoji || '🎬']
    );
    res.status(201).json({ message: 'Categoria criada!', id: result.insertId });
  } catch {
    res.status(500).json({ message: 'Erro interno' });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, emoji, is_active } = req.body;
    const [result]: any = await pool.query(
      'UPDATE movie_categories SET name=?, description=?, emoji=?, is_active=? WHERE id=?',
      [name, description || null, emoji || '🎬', is_active ?? 1, req.params.id]
    );
    if (result.affectedRows === 0) { res.status(404).json({ message: 'Categoria não encontrada.' }); return; }
    res.json({ message: 'Categoria atualizada!' });
  } catch {
    res.status(500).json({ message: 'Erro interno' });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('UPDATE movie_categories SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Categoria removida.' });
  } catch {
    res.status(500).json({ message: 'Erro interno' });
  }
};

// ─── Salas ───────────────────────────────────────────────────────────────────

export const getRooms = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM movie_rooms WHERE is_active = 1 ORDER BY name');
    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Erro interno' });
  }
};

export const createRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, capacity, type, has_3d, has_accessibility } = req.body;
    if (!name) { res.status(400).json({ message: 'Nome obrigatório.' }); return; }
    const [result]: any = await pool.query(
      'INSERT INTO movie_rooms (name, capacity, type, has_3d, has_accessibility) VALUES (?, ?, ?, ?, ?)',
      [name, capacity || 100, type || 'standard', has_3d || 0, has_accessibility ?? 1]
    );
    res.status(201).json({ message: 'Sala criada!', id: result.insertId });
  } catch {
    res.status(500).json({ message: 'Erro interno' });
  }
};

export const updateRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, capacity, type, has_3d, has_accessibility, is_active } = req.body;
    const [result]: any = await pool.query(
      'UPDATE movie_rooms SET name=?, capacity=?, type=?, has_3d=?, has_accessibility=?, is_active=? WHERE id=?',
      [name, capacity || 100, type || 'standard', has_3d || 0, has_accessibility ?? 1, is_active ?? 1, req.params.id]
    );
    if (result.affectedRows === 0) { res.status(404).json({ message: 'Sala não encontrada.' }); return; }
    res.json({ message: 'Sala atualizada!' });
  } catch {
    res.status(500).json({ message: 'Erro interno' });
  }
};

export const deleteRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('UPDATE movie_rooms SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Sala removida.' });
  } catch {
    res.status(500).json({ message: 'Erro interno' });
  }
};

// ─── Sessões ─────────────────────────────────────────────────────────────────

export const getSessions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query(`
      SELECT ms.*, m.title, m.rating, mr.name as room_name, mr.type as room_type
      FROM movie_sessions ms
      JOIN movies m ON ms.movie_id = m.id
      JOIN movie_rooms mr ON ms.room_id = mr.id
      WHERE ms.is_active = 1
      ORDER BY ms.session_date, ms.session_time
    `);
    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Erro interno' });
  }
};

export const createSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movie_id, room_id, session_date, session_time, available_seats, language } = req.body;
    if (!movie_id || !room_id || !session_date || !session_time) {
      res.status(400).json({ message: 'Filme, sala, data e horário são obrigatórios.' }); return;
    }
    const [result]: any = await pool.query(
      'INSERT INTO movie_sessions (movie_id, room_id, session_date, session_time, available_seats, language) VALUES (?, ?, ?, ?, ?, ?)',
      [movie_id, room_id, session_date, session_time, available_seats || 100, language || 'dublado']
    );
    res.status(201).json({ message: 'Sessão criada!', id: result.insertId });
  } catch {
    res.status(500).json({ message: 'Erro interno' });
  }
};

export const updateSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movie_id, room_id, session_date, session_time, available_seats, language, is_active } = req.body;
    const [result]: any = await pool.query(
      'UPDATE movie_sessions SET movie_id=?, room_id=?, session_date=?, session_time=?, available_seats=?, language=?, is_active=? WHERE id=?',
      [movie_id, room_id, session_date, session_time, available_seats || 100, language || 'dublado', is_active ?? 1, req.params.id]
    );
    if (result.affectedRows === 0) { res.status(404).json({ message: 'Sessão não encontrada.' }); return; }
    res.json({ message: 'Sessão atualizada!' });
  } catch {
    res.status(500).json({ message: 'Erro interno' });
  }
};

export const deleteSession = async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('UPDATE movie_sessions SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Sessão removida.' });
  } catch {
    res.status(500).json({ message: 'Erro interno' });
  }
};

// ─── Filmes ───────────────────────────────────────────────────────────────────

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, status, rating, room } = req.query;
    let query = `
      SELECT m.*,
        mc.name  AS category_name,
        mc.emoji AS category_emoji,
        mr.name  AS room_name,
        mr.type  AS room_type,
        mr.has_3d
      FROM movies m
      LEFT JOIN movie_categories mc ON m.category_id = mc.id
      LEFT JOIN movie_rooms mr ON m.room_id = mr.id
      WHERE m.is_active = 1
    `;
    const params: any[] = [];
    if (category) { query += ' AND m.category_id = ?'; params.push(category); }
    if (status)   { query += ' AND m.status = ?';      params.push(status); }
    if (rating)   { query += ' AND m.rating = ?';      params.push(rating); }
    if (room)     { query += ' AND m.room_id = ?';     params.push(room); }
    query += ' ORDER BY m.session_date ASC, m.session_time ASC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Erro interno' });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows]: any = await pool.query(`
      SELECT m.*,
        mc.name  AS category_name,
        mc.emoji AS category_emoji,
        mr.name  AS room_name,
        mr.type  AS room_type,
        mr.capacity,
        mr.has_3d
      FROM movies m
      LEFT JOIN movie_categories mc ON m.category_id = mc.id
      LEFT JOIN movie_rooms mr ON m.room_id = mr.id
      WHERE m.id = ? AND m.is_active = 1
    `, [req.params.id]);
    if (rows.length === 0) { res.status(404).json({ message: 'Filme não encontrado.' }); return; }
    const [sessions] = await pool.query(`
      SELECT ms.*, mr.name as room_name, mr.type as room_type
      FROM movie_sessions ms
      JOIN movie_rooms mr ON ms.room_id = mr.id
      WHERE ms.movie_id = ? AND ms.is_active = 1
      ORDER BY ms.session_date, ms.session_time
    `, [req.params.id]);
    res.json({ ...rows[0], sessions });
  } catch {
    res.status(500).json({ message: 'Erro interno' });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, category_id, genre, duration_minutes, director, cast_info, rating, poster_url, session_date, session_time, room, room_id, price, premiere_date, on_display_until, status } = req.body;
    if (!title) { res.status(400).json({ message: 'Título obrigatório.' }); return; }
    const [result]: any = await pool.query(
      `INSERT INTO movies (title, description, category_id, genre, duration_minutes, director, cast_info, rating, poster_url, session_date, session_time, room, room_id, price, premiere_date, on_display_until, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, category_id || null, genre || null, duration_minutes || null, director || null, cast_info || null, rating || null, poster_url || null, session_date || null, session_time || null, room || null, room_id || null, price || 0, premiere_date || null, on_display_until || null, status || 'coming_soon']
    );
    res.status(201).json({ message: 'Filme criado!', id: result.insertId });
  } catch {
    res.status(500).json({ message: 'Erro interno' });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, category_id, genre, duration_minutes, director, cast_info, rating, poster_url, session_date, session_time, room, room_id, price, premiere_date, on_display_until, status, is_active } = req.body;
    if (!title) { res.status(400).json({ message: 'Título obrigatório.' }); return; }
    const [result]: any = await pool.query(
      `UPDATE movies SET title=?, description=?, category_id=?, genre=?, duration_minutes=?, director=?, cast_info=?, rating=?, poster_url=?, session_date=?, session_time=?, room=?, room_id=?, price=?, premiere_date=?, on_display_until=?, status=?, is_active=? WHERE id=?`,
      [title, description || null, category_id || null, genre || null, duration_minutes || null, director || null, cast_info || null, rating || null, poster_url || null, session_date || null, session_time || null, room || null, room_id || null, price || 0, premiere_date || null, on_display_until || null, status || 'now_playing', is_active ?? 1, req.params.id]
    );
    if (result.affectedRows === 0) { res.status(404).json({ message: 'Filme não encontrado.' }); return; }
    res.json({ message: 'Filme atualizado!' });
  } catch {
    res.status(500).json({ message: 'Erro interno' });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('UPDATE movies SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Filme removido.' });
  } catch {
    res.status(500).json({ message: 'Erro interno' });
  }
};
