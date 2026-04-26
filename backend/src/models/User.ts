import pool from '../config/db';
import { User } from '../types';
import bcrypt from 'bcryptjs';

export const findAll = async (): Promise<User[]> => {
  const [rows]: any = await pool.query(
    'SELECT id, name, email, role, phone, created_at FROM users ORDER BY created_at DESC'
  );
  return rows;
};

export const findById = async (id: number): Promise<User | null> => {
  const [rows]: any = await pool.query(
    'SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?', [id]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const findByEmail = async (email: string): Promise<User | null> => {
  const [rows]: any = await pool.query(
    'SELECT * FROM users WHERE email = ?', [email]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const createUser = async (data: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const [result]: any = await pool.query(
    'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
    [data.name, data.email, hashedPassword, data.role, data.phone || null]
  );
  return result.insertId;
};

export const updateUser = async (id: number, data: Partial<User>): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name) { fields.push('name = ?'); values.push(data.name); }
  if (data.email) { fields.push('email = ?'); values.push(data.email); }
  if (data.password) { fields.push('password = ?'); values.push(await bcrypt.hash(data.password, 10)); }
  if (data.phone) { fields.push('phone = ?'); values.push(data.phone); }
  if (data.role) { fields.push('role = ?'); values.push(data.role); }

  if (fields.length === 0) return false;

  values.push(id);
  const [result]: any = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values
  );
  return result.affectedRows > 0;
};

export const deleteUser = async (id: number): Promise<boolean> => {
  const [result]: any = await pool.query('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows > 0;
};
