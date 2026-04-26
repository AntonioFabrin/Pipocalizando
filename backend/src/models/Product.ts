import pool from '../config/db';
import { Product } from '../types';

export const findAll = async (onlyActive = true): Promise<Product[]> => {
  const [rows]: any = await pool.query(
    `SELECT p.*, c.name as category_name 
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     ${onlyActive ? 'WHERE p.is_active = 1' : ''}
     ORDER BY p.name`
  );
  return rows;
};

export const findById = async (id: number): Promise<Product | null> => {
  const [rows]: any = await pool.query(
    `SELECT p.*, c.name as category_name 
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = ?`, [id]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const findByCategory = async (categoryId: number): Promise<Product[]> => {
  const [rows]: any = await pool.query(
    `SELECT p.*, c.name as category_name 
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.category_id = ? AND p.is_active = 1`, [categoryId]
  );
  return rows;
};

export const createProduct = async (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
  const [result]: any = await pool.query(
    'INSERT INTO products (name, description, price, stock, category_id, image_url) VALUES (?, ?, ?, ?, ?, ?)',
    [data.name, data.description || null, data.price, data.stock || 0, data.category_id || null, data.image_url || null]
  );
  return result.insertId;
};

export const updateProduct = async (id: number, data: Partial<Product>): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price); }
  if (data.stock !== undefined) { fields.push('stock = ?'); values.push(data.stock); }
  if (data.category_id !== undefined) { fields.push('category_id = ?'); values.push(data.category_id); }
  if (data.image_url !== undefined) { fields.push('image_url = ?'); values.push(data.image_url); }
  if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }

  if (fields.length === 0) return false;

  values.push(id);
  const [result]: any = await pool.query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values
  );
  return result.affectedRows > 0;
};

export const deleteProduct = async (id: number): Promise<boolean> => {
  const [result]: any = await pool.query(
    'UPDATE products SET is_active = 0 WHERE id = ?', [id]
  );
  return result.affectedRows > 0;
};

export const updateStock = async (id: number, quantity: number): Promise<boolean> => {
  const [result]: any = await pool.query(
    'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
    [quantity, id, quantity]
  );
  return result.affectedRows > 0;
};
