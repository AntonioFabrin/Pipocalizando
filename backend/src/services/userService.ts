import * as UserModel from '../models/User';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET!;

export const loginUser = async (email: string, password: string) => {
  const user = await UserModel.findByEmail(email);
  if (!user) throw new Error('Credenciais inválidas.');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Credenciais inválidas.');

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone } };
};

export const registerUser = async (data: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
  const existing = await UserModel.findByEmail(data.email);
  if (existing) throw new Error('Email já cadastrado.');

  const id = await UserModel.createUser(data);
  return { id, name: data.name, email: data.email, role: data.role, phone: data.phone };
};

export const getUserById = async (id: number) => {
  const user = await UserModel.findById(id);
  if (!user) throw new Error('Usuário não encontrado.');
  return user;
};

export const getAllUsers = async () => {
  return await UserModel.findAll();
};

export const updateUser = async (id: number, data: Partial<User>) => {
  const exists = await UserModel.findById(id);
  if (!exists) throw new Error('Usuário não encontrado.');

  if (data.email && data.email !== exists.email) {
    const emailInUse = await UserModel.findByEmail(data.email);
    if (emailInUse) throw new Error('Email já em uso por outro usuário.');
  }

  await UserModel.updateUser(id, data);
};

export const deleteUser = async (id: number, requestingUserId: number) => {
  if (id === requestingUserId) throw new Error('Você não pode deletar sua própria conta.');
  const exists = await UserModel.findById(id);
  if (!exists) throw new Error('Usuário não encontrado.');
  if (exists.role === 'super_admin') throw new Error('Não é permitido deletar o super_admin.');
  await UserModel.deleteUser(id);
};
