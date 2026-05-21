import { Request, Response } from 'express';
import pool from '../config/db';

const normalizeDateForSql = (value: any): string | null => {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const clean = String(value).trim();
  if (!clean) return null;

  const isoMatch = clean.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  const brMatch = clean.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;

  return clean;
};

const syncPrimaryMovieSession = async (
  movieId: number,
  roomId: any,
  sessionDate: any,
  sessionTime: any,
): Promise<void> => {
  const normalizedDate = normalizeDateForSql(sessionDate);
  const normalizedRoomId = Number(roomId);

  if (!movieId || !Number.isInteger(normalizedRoomId) || !normalizedDate || !sessionTime) return;

  const [existingRows]: any = await pool.query(
    'SELECT id FROM movie_sessions WHERE movie_id = ? AND is_active = 1 ORDER BY id ASC LIMIT 1',
    [movieId]
  );

  if (existingRows.length > 0) {
    await pool.query(
      'UPDATE movie_sessions SET room_id = ?, session_date = ?, session_time = ? WHERE id = ?',
      [normalizedRoomId, normalizedDate, sessionTime, existingRows[0].id]
    );
    return;
  }

  await pool.query(
    `INSERT INTO movie_sessions (movie_id, room_id, session_date, session_time, available_seats, language)
     VALUES (?, ?, ?, ?, 100, 'dublado')`,
    [movieId, normalizedRoomId, normalizedDate, sessionTime]
  );
};

// ─── Categorias de filmes ────────────────────────────────────────────────────

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM movie_categories WHERE is_active = 1 ORDER BY name');
    res.json(rows);
  } catch (err: any) {
    console.error('❌ [getCategories]', err?.message || err);
    res.status(500).json({ message: 'Erro interno', detail: err?.message });
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
  } catch (err: any) {
    console.error('❌ [createCategory]', err?.message || err);
    res.status(500).json({ message: 'Erro interno', detail: err?.message });
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
  } catch (err: any) {
    console.error('❌ [updateCategory]', err?.message || err);
    res.status(500).json({ message: 'Erro interno', detail: err?.message });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('UPDATE movie_categories SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Categoria removida.' });
  } catch (err: any) {
    console.error('❌ [deleteCategory]', err?.message || err);
    res.status(500).json({ message: 'Erro interno', detail: err?.message });
  }
};

// ─── Salas ───────────────────────────────────────────────────────────────────

export const getRooms = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM movie_rooms WHERE is_active = 1 ORDER BY name');
    res.json(rows);
  } catch (err: any) {
    console.error('❌ [getRooms]', err?.message || err);
    res.status(500).json({ message: 'Erro interno', detail: err?.message });
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
  } catch (err: any) {
    console.error('❌ [createRoom]', err?.message || err);
    res.status(500).json({ message: 'Erro interno', detail: err?.message });
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
  } catch (err: any) {
    console.error('❌ [updateRoom]', err?.message || err);
    res.status(500).json({ message: 'Erro interno', detail: err?.message });
  }
};

export const deleteRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('UPDATE movie_rooms SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Sala removida.' });
  } catch (err: any) {
    console.error('❌ [deleteRoom]', err?.message || err);
    res.status(500).json({ message: 'Erro interno', detail: err?.message });
  }
};

// ─── Sessões ─────────────────────────────────────────────────────────────────

export const getSessions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query(`
      SELECT ms.*,
             m.title      AS movie_title,
             m.rating,
             m.poster_url,
             m.room,
             mr.name      AS room_name,
             mr.type      AS room_type
      FROM movie_sessions ms
      JOIN movies      m  ON ms.movie_id = m.id
      JOIN movie_rooms mr ON ms.room_id  = mr.id
      WHERE ms.is_active = 1
      ORDER BY ms.session_date, ms.session_time
    `);
    res.json(rows);
  } catch (err: any) {
    console.error('❌ [getSessions]', err?.message || err);
    res.status(500).json({ message: 'Erro interno', detail: err?.message });
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
      [movie_id, room_id, normalizeDateForSql(session_date), session_time, available_seats || 100, language || 'dublado']
    );
    res.status(201).json({ message: 'Sessão criada!', id: result.insertId });
  } catch (err: any) {
    console.error('❌ [createSession]', err?.message || err);
    res.status(500).json({ message: 'Erro interno', detail: err?.message });
  }
};

export const updateSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movie_id, room_id, session_date, session_time, available_seats, language, is_active } = req.body;
    const [result]: any = await pool.query(
      'UPDATE movie_sessions SET movie_id=?, room_id=?, session_date=?, session_time=?, available_seats=?, language=?, is_active=? WHERE id=?',
      [movie_id, room_id, normalizeDateForSql(session_date), session_time, available_seats || 100, language || 'dublado', is_active ?? 1, req.params.id]
    );
    if (result.affectedRows === 0) { res.status(404).json({ message: 'Sessão não encontrada.' }); return; }
    res.json({ message: 'Sessão atualizada!' });
  } catch (err: any) {
    console.error('❌ [updateSession]', err?.message || err);
    res.status(500).json({ message: 'Erro interno', detail: err?.message });
  }
};

export const deleteSession = async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('UPDATE movie_sessions SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Sessão removida.' });
  } catch (err: any) {
    console.error('❌ [deleteSession]', err?.message || err);
    res.status(500).json({ message: 'Erro interno', detail: err?.message });
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
      LEFT JOIN movie_rooms      mr ON m.room_id     = mr.id
      WHERE m.is_active = 1
    `;
    const params: any[] = [];
    if (category) { query += ' AND m.category_id = ?'; params.push(category); }
    if (status)   { query += ' AND m.status = ?';      params.push(status); }
    if (rating)   { query += ' AND m.rating = ?';      params.push(rating); }
    if (room)     { query += ' AND m.room_id = ?';     params.push(room); }
    // Filmes sem session_date ficam no final; demais ordenados por data
    query += ' ORDER BY ISNULL(m.session_date) ASC, m.session_date ASC, m.session_time ASC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err: any) {
    console.error('❌ [movies.getAll]', err?.message || err);
    res.status(500).json({ message: 'Erro interno', detail: err?.message });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows]: any = await pool.query(`
      SELECT m.*,
        mc.name     AS category_name,
        mc.emoji    AS category_emoji,
        mr.name     AS room_name,
        mr.type     AS room_type,
        mr.capacity,
        mr.has_3d
      FROM movies m
      LEFT JOIN movie_categories mc ON m.category_id = mc.id
      LEFT JOIN movie_rooms      mr ON m.room_id     = mr.id
      WHERE m.id = ? AND m.is_active = 1
    `, [req.params.id]);
    if (rows.length === 0) { res.status(404).json({ message: 'Filme não encontrado.' }); return; }
    const [sessions] = await pool.query(`
      SELECT ms.*, mr.name AS room_name, mr.type AS room_type
      FROM movie_sessions ms
      JOIN movie_rooms mr ON ms.room_id = mr.id
      WHERE ms.movie_id = ? AND ms.is_active = 1
      ORDER BY ms.session_date, ms.session_time
    `, [req.params.id]);
    res.json({ ...rows[0], sessions });
  } catch (err: any) {
    console.error('❌ [movies.getById]', err?.message || err);
    res.status(500).json({ message: 'Erro interno', detail: err?.message });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title, description, category_id, genre, duration_minutes,
      director, cast_info, rating, poster_url, trailer_url,
      session_date, session_time, room, room_id,
      price, premiere_date, on_display_until, status,
    } = req.body;

    if (!title) { res.status(400).json({ message: 'Título obrigatório.' }); return; }

    const [result]: any = await pool.query(
      `INSERT INTO movies
        (title, description, category_id, genre, duration_minutes,
         director, cast_info, rating, poster_url, trailer_url,
         session_date, session_time, room, room_id,
         price, premiere_date, on_display_until, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description      || null,
        category_id      || null,
        genre            || null,
        duration_minutes || null,
        director         || null,
        cast_info        || null,
        rating           || null,
        poster_url       || null,
        trailer_url      || null,
        normalizeDateForSql(session_date),
        session_time     || null,
        room             || null,
        room_id          || null,
        price            ?? 0,
        normalizeDateForSql(premiere_date),
        normalizeDateForSql(on_display_until),
        status           || 'coming_soon',
      ]
    );
    await syncPrimaryMovieSession(result.insertId, room_id, session_date, session_time);
    res.status(201).json({ message: 'Filme criado!', id: result.insertId });
  } catch (err: any) {
    console.error('❌ [movies.create]', err?.message || err);
    res.status(500).json({ message: 'Erro interno', detail: err?.message });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title, description, category_id, genre, duration_minutes,
      director, cast_info, rating, poster_url, trailer_url,
      session_date, session_time, room, room_id,
      price, premiere_date, on_display_until, status, is_active,
    } = req.body;

    if (!title) { res.status(400).json({ message: 'Título obrigatório.' }); return; }

    const [result]: any = await pool.query(
      `UPDATE movies SET
        title=?, description=?, category_id=?, genre=?, duration_minutes=?,
        director=?, cast_info=?, rating=?, poster_url=?, trailer_url=?,
        session_date=?, session_time=?, room=?, room_id=?,
        price=?, premiere_date=?, on_display_until=?, status=?, is_active=?
       WHERE id=?`,
      [
        title,
        description      || null,
        category_id      || null,
        genre            || null,
        duration_minutes || null,
        director         || null,
        cast_info        || null,
        rating           || null,
        poster_url       || null,
        trailer_url      || null,
        normalizeDateForSql(session_date),
        session_time     || null,
        room             || null,
        room_id          || null,
        price            ?? 0,
        normalizeDateForSql(premiere_date),
        normalizeDateForSql(on_display_until),
        status           || 'now_playing',
        is_active        ?? 1,
        req.params.id,
      ]
    );
    if (result.affectedRows === 0) { res.status(404).json({ message: 'Filme não encontrado.' }); return; }
    await syncPrimaryMovieSession(Number(req.params.id), room_id, session_date, session_time);
    res.json({ message: 'Filme atualizado!' });
  } catch (err: any) {
    console.error('❌ [movies.update]', err?.message || err);
    res.status(500).json({ message: 'Erro interno', detail: err?.message });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('UPDATE movies SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Filme removido.' });
  } catch (err: any) {
    console.error('❌ [movies.remove]', err?.message || err);
    res.status(500).json({ message: 'Erro interno', detail: err?.message });
  }
};
