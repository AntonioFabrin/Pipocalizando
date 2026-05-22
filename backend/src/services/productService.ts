import * as ProductModel from '../models/Product';
import { Product } from '../types';
import { isValidProductDraft } from '../utils/flowRules';

export const getAllProducts = async (onlyActive = true) => {
  return await ProductModel.findAll(onlyActive);
};

export const getProductById = async (id: number) => {
  const product = await ProductModel.findById(id);
  if (!product) throw new Error('Produto nao encontrado.');
  return product;
};

export const getProductsByCategory = async (categoryId: number) => {
  return await ProductModel.findByCategory(categoryId);
};

export const createProduct = async (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
  if (!isValidProductDraft(data)) throw new Error('Nome e preco sao obrigatorios e o preco precisa ser maior que zero.');
  const id = await ProductModel.createProduct(data);
  return { id, ...data };
};

export const updateProduct = async (id: number, data: Partial<Product>) => {
  const exists = await ProductModel.findById(id);
  if (!exists) throw new Error('Produto nao encontrado.');
  if (data.name !== undefined || data.price !== undefined) {
    if (!isValidProductDraft({ name: data.name ?? exists.name, price: data.price ?? exists.price })) {
      throw new Error('Nome e preco sao obrigatorios e o preco precisa ser maior que zero.');
    }
  }
  await ProductModel.updateProduct(id, data);
};

export const deleteProduct = async (id: number) => {
  const exists = await ProductModel.findById(id);
  if (!exists) throw new Error('Produto nao encontrado.');
  await ProductModel.deleteProduct(id);
};
