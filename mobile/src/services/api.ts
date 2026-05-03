import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getBaseURL = () => {
  if (Platform.OS === 'web') return 'http://localhost:3333/api';
  if (Platform.OS === 'android') return 'http://10.0.2.2:3333/api';  // emulador Android
  if (Platform.OS === 'ios') return 'http://localhost:3333/api';       // simulador iOS
  // ATENÇÃO: em dispositivo físico, substitua pelo IP da sua máquina:
  // return 'http://192.168.X.X:3333/api';
  return 'http://localhost:3333/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@pipocalizando:token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('🔴 [API] Erro:', error?.message, '| Status:', error?.response?.status);
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });
export const register = (data: object) =>
  api.post('/auth/register', data);
export const getProfile = () =>
  api.get('/auth/profile');
export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email });
export const verifyResetCode = (email: string, code: string) =>
  api.post('/auth/verify-reset-code', { email, code });
export const resetPassword = (email: string, code: string, new_password: string) =>
  api.post('/auth/reset-password', { email, code, new_password });

// ── Filmes ───────────────────────────────────────────────
export const getMovies = (params?: any) =>
  api.get('/movies', { params });
export const getMovieById = (id: number) =>
  api.get(`/movies/${id}`);
export const createMovie = (data: object) =>
  api.post('/movies', data);
export const updateMovie = (id: number, data: object) =>
  api.put(`/movies/${id}`, data);
export const deleteMovie = (id: number) =>
  api.delete(`/movies/${id}`);

// ── Categorias de filmes ─────────────────────────────────
export const getMovieCategories = () =>
  api.get('/movie-categories');
export const createMovieCategory = (data: object) =>
  api.post('/movie-categories', data);
export const updateMovieCategory = (id: number, data: object) =>
  api.put(`/movie-categories/${id}`, data);
export const deleteMovieCategory = (id: number) =>
  api.delete(`/movie-categories/${id}`);

// ── Salas ────────────────────────────────────────────────
export const getMovieRooms = () =>
  api.get('/movie-rooms');
export const createMovieRoom = (data: object) =>
  api.post('/movie-rooms', data);
export const updateMovieRoom = (id: number, data: object) =>
  api.put(`/movie-rooms/${id}`, data);
export const deleteMovieRoom = (id: number) =>
  api.delete(`/movie-rooms/${id}`);

// ── Sessões de filmes ────────────────────────────────────
export const getMovieSessions = () =>
  api.get('/movie-sessions');
export const createMovieSession = (data: object) =>
  api.post('/movie-sessions', data);
export const updateMovieSession = (id: number, data: object) =>
  api.put(`/movie-sessions/${id}`, data);
export const deleteMovieSession = (id: number) =>
  api.delete(`/movie-sessions/${id}`);

// ── Produtos ─────────────────────────────────────────────
export const getProducts = () =>
  api.get('/products');
export const getProductById = (id: number) =>
  api.get(`/products/${id}`);
export const createProduct = (data: object) =>
  api.post('/products', data);
export const updateProduct = (id: number, data: object) =>
  api.put(`/products/${id}`, data);
export const deleteProduct = (id: number) =>
  api.delete(`/products/${id}`);

// ── Pedidos ──────────────────────────────────────────────
export const createOrder = (data: object) =>
  api.post('/orders', data);
export const getOrders = () =>
  api.get('/orders');
export const updateOrderStatus = (id: number, status: string) =>
  api.patch(`/orders/${id}/status`, { status });

// ── Ticket ───────────────────────────────────────────────
export const validateTicket = (ticket_code: string) =>
  api.get(`/tickets/validate/${ticket_code}`);

export default api;
