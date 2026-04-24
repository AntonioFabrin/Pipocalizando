import { Router } from 'express';
import * as auth from '../controllers/authController';
import * as products from '../controllers/productController';
import * as categories from '../controllers/categoryController';
import * as orders from '../controllers/orderController';
import * as payments from '../controllers/paymentController';
import * as users from '../controllers/userController';
import { authMiddleware, roleMiddleware } from '../middlewares/auth';

const router = Router();

// ==========================================
// AUTH — público
// ==========================================
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/profile', authMiddleware, auth.getProfile);

// ==========================================
// USUÁRIOS
// super_admin: tudo
// manager: criar/editar/deletar seller e customer
// ==========================================
router.get('/users', authMiddleware, roleMiddleware('super_admin', 'manager'), users.getAll);
router.get('/users/:id', authMiddleware, users.getById);
router.post('/users', authMiddleware, roleMiddleware('super_admin', 'manager'), users.create);
router.put('/users/:id', authMiddleware, roleMiddleware('super_admin', 'manager'), users.update);
router.delete('/users/:id', authMiddleware, roleMiddleware('super_admin', 'manager'), users.remove);

// ==========================================
// CATEGORIAS
// super_admin e manager gerenciam categorias
// ==========================================
router.get('/categories', categories.getAll);
router.get('/categories/:id', categories.getById);
router.post('/categories', authMiddleware, roleMiddleware('super_admin', 'manager'), categories.create);
router.put('/categories/:id', authMiddleware, roleMiddleware('super_admin', 'manager'), categories.update);
router.delete('/categories/:id', authMiddleware, roleMiddleware('super_admin', 'manager'), categories.remove);

// ==========================================
// PRODUTOS
// super_admin e manager gerenciam produtos
// seller pode criar e editar
// ==========================================
router.get('/products', products.getAll);
router.get('/products/:id', products.getById);
router.post('/products', authMiddleware, roleMiddleware('super_admin', 'manager', 'seller'), products.create);
router.put('/products/:id', authMiddleware, roleMiddleware('super_admin', 'manager', 'seller'), products.update);
router.delete('/products/:id', authMiddleware, roleMiddleware('super_admin', 'manager'), products.remove);

// ==========================================
// PEDIDOS
// qualquer logado pode criar pedido
// seller e manager atualizam status
// ==========================================
router.post('/orders', authMiddleware, orders.createOrder);
router.get('/orders', authMiddleware, orders.getOrders);
router.patch('/orders/:id/status', authMiddleware, roleMiddleware('super_admin', 'manager', 'seller'), orders.updateOrderStatus);

// ==========================================
// TICKETS
// seller e manager validam tickets
// ==========================================
router.get('/tickets/validate/:ticket_code', authMiddleware, roleMiddleware('super_admin', 'manager', 'seller'), orders.validateTicket);

// ==========================================
// PAGAMENTOS
// manager e super_admin gerenciam pagamentos
// ==========================================
router.get('/payments', authMiddleware, roleMiddleware('super_admin', 'manager'), payments.getAll);
router.get('/payments/:id', authMiddleware, roleMiddleware('super_admin', 'manager'), payments.getById);
router.patch('/payments/:id/approve', authMiddleware, roleMiddleware('super_admin', 'manager'), payments.approve);
router.patch('/payments/:id/reject', authMiddleware, roleMiddleware('super_admin', 'manager'), payments.reject);

export default router;
