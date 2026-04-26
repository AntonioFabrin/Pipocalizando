import pool from '../config/db';
import { Category } from '../types';

export const findAll = async (): Promise<Category[]> => {
  const [rows]: any = await pool.query('SELECT * FROM categories ORDER BY name');
  return rows;
};

export const findById = async (id: number): Promise<Category | null> => {
  const [rows]: any = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
  return rows.length > 0 ? rows[0] : null;
};

export const createCategory = async (data: Omit<Category, 'id'>): Promise<number> => {
  const [result]: any = await pool.query(
    'INSERT INTO categories (name, description) VALUES (?, ?)',
    [data.name, data.description || null]
  );
  return result.insertId;
};

export const updateCategory = async (id: number, data: Partial<Category>): Promise<boolean> => {
  const [result]: any = await pool.query(
    'UPDATE categories SET name = ?, description = ? WHERE id = ?',
    [data.name, data.description || null, id]
  );
  return result.affectedRows > 0;
};

export const deleteCategory = async (id: number): Promise<boolean> => {
  const [result]: any = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  return result.affectedRows > 0;
};
