import * as CategoryModel from '../models/Category';
import { Category } from '../types';

export const getAllCategories = async () => {
  return await CategoryModel.findAll();
};

export const getCategoryById = async (id: number) => {
  const category = await CategoryModel.findById(id);
  if (!category) throw new Error('Categoria não encontrada.');
  return category;
};

export const createCategory = async (data: Omit<Category, 'id'>) => {
  if (!data.name) throw new Error('Nome é obrigatório.');
  const id = await CategoryModel.createCategory(data);
  return { id, ...data };
};

export const updateCategory = async (id: number, data: Partial<Category>) => {
  const exists = await CategoryModel.findById(id);
  if (!exists) throw new Error('Categoria não encontrada.');
  if (!data.name) throw new Error('Nome é obrigatório.');
  await CategoryModel.updateCategory(id, data);
};

export const deleteCategory = async (id: number) => {
  const exists = await CategoryModel.findById(id);
  if (!exists) throw new Error('Categoria não encontrada.');
  await CategoryModel.deleteCategory(id);
};
