import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.0.2.2:3333/api'; // Android emulator -> localhost

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@pipocalizando:token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const register = (data: object) =>
  api.post('/auth/register', data);

export const getProfile = () =>
  api.get('/auth/profile');

// Produtos
export const getProducts = () =>
  api.get('/products');

export const getProductById = (id: number) =>
  api.get(`/products/${id}`);

// Pedidos
export const createOrder = (data: object) =>
  api.post('/orders', data);

export const getOrders = () =>
  api.get('/orders');

export const updateOrderStatus = (id: number, status: string) =>
  api.patch(`/orders/${id}/status`, { status });

// Ticket
export const validateTicket = (ticket_code: string) =>
  api.get(`/tickets/validate/${ticket_code}`);

export default api;
