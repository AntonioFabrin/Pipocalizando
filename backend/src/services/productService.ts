import * as ProductModel from '../models/Product';
import { Product } from '../types';

export const getAllProducts = async (onlyActive = true) => {
  return await ProductModel.findAll(onlyActive);
};

export const getProductById = async (id: number) => {
  const product = await ProductModel.findById(id);
  if (!product) throw new Error('Produto não encontrado.');
  return product;
};

export const getProductsByCategory = async (categoryId: number) => {
  return await ProductModel.findByCategory(categoryId);
};

export const createProduct = async (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
  if (!data.name || !data.price) throw new Error('Nome e preço são obrigatórios.');
  const id = await ProductModel.createProduct(data);
  return { id, ...data };
};

export const updateProduct = async (id: number, data: Partial<Product>) => {
  const exists = await ProductModel.findById(id);
  if (!exists) throw new Error('Produto não encontrado.');
  await ProductModel.updateProduct(id, data);
};

export const deleteProduct = async (id: number) => {
  const exists = await ProductModel.findById(id);
  if (!exists) throw new Error('Produto não encontrado.');
  await ProductModel.deleteProduct(id);
};
