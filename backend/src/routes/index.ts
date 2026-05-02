import { Router } from 'express';
import * as auth       from '../controllers/authController';
import * as products   from '../controllers/productController';
import * as categories from '../controllers/categoryController';
import * as orders     from '../controllers/orderController';
import * as payments   from '../controllers/paymentController';
import * as users      from '../controllers/userController';
import * as movies     from '../controllers/movieController';
import { authMiddleware, roleMiddleware } from '../middlewares/auth';

const router = Router();

const STAFF = ['super_admin', 'manager', 'seller'];
const ADMIN = ['super_admin', 'manager'];

// ── AUTH ─────────────────────────────────────────────────
router.post('/auth/register', auth.register);
router.post('/auth/login',    auth.login);
router.get('/auth/profile',   authMiddleware, auth.getProfile);

// ── USUÁRIOS ─────────────────────────────────────────────
router.get   ('/users',     authMiddleware, roleMiddleware(...ADMIN), users.getAll);
router.get   ('/users/:id', authMiddleware, users.getById);
router.post  ('/users',     authMiddleware, roleMiddleware(...ADMIN), users.create);
router.put   ('/users/:id', authMiddleware, roleMiddleware(...ADMIN), users.update);
router.delete('/users/:id', authMiddleware, roleMiddleware(...ADMIN), users.remove);

// ── CATEGORIAS DE PRODUTO ────────────────────────────────
router.get   ('/categories',     categories.getAll);
router.get   ('/categories/:id', categories.getById);
router.post  ('/categories',     authMiddleware, roleMiddleware(...ADMIN), categories.create);
router.put   ('/categories/:id', authMiddleware, roleMiddleware(...ADMIN), categories.update);
router.delete('/categories/:id', authMiddleware, roleMiddleware(...ADMIN), categories.remove);

// ── PRODUTOS ─────────────────────────────────────────────
router.get   ('/products',     products.getAll);
router.get   ('/products/:id', products.getById);
router.post  ('/products',     authMiddleware, roleMiddleware(...STAFF), products.create);
router.put   ('/products/:id', authMiddleware, roleMiddleware(...STAFF), products.update);
router.delete('/products/:id', authMiddleware, roleMiddleware(...ADMIN), products.remove);

// ── FILMES ───────────────────────────────────────────────
router.get   ('/movies',     movies.getAll);
router.get   ('/movies/:id', movies.getById);
router.post  ('/movies',     authMiddleware, roleMiddleware(...STAFF), movies.create);
router.put   ('/movies/:id', authMiddleware, roleMiddleware(...STAFF), movies.update);
router.delete('/movies/:id', authMiddleware, roleMiddleware(...STAFF), movies.remove);

// ── CATEGORIAS DE FILMES ─────────────────────────────────
router.get   ('/movie-categories',     movies.getCategories);
router.post  ('/movie-categories',     authMiddleware, roleMiddleware(...STAFF), movies.createCategory);
router.put   ('/movie-categories/:id', authMiddleware, roleMiddleware(...STAFF), movies.updateCategory);
router.delete('/movie-categories/:id', authMiddleware, roleMiddleware(...ADMIN), movies.deleteCategory);

// ── SALAS ────────────────────────────────────────────────
router.get   ('/movie-rooms',     movies.getRooms);
router.post  ('/movie-rooms',     authMiddleware, roleMiddleware(...STAFF), movies.createRoom);
router.put   ('/movie-rooms/:id', authMiddleware, roleMiddleware(...STAFF), movies.updateRoom);
router.delete('/movie-rooms/:id', authMiddleware, roleMiddleware(...ADMIN), movies.deleteRoom);

// ── SESSÕES DE FILMES ────────────────────────────────────
router.get   ('/movie-sessions',     movies.getSessions);
router.post  ('/movie-sessions',     authMiddleware, roleMiddleware(...STAFF), movies.createSession);
router.put   ('/movie-sessions/:id', authMiddleware, roleMiddleware(...STAFF), movies.updateSession);
router.delete('/movie-sessions/:id', authMiddleware, roleMiddleware(...STAFF), movies.deleteSession);

// ── PEDIDOS ──────────────────────────────────────────────
router.post ('/orders',            authMiddleware, orders.createOrder);
router.get  ('/orders',            authMiddleware, orders.getOrders);
router.patch('/orders/:id/status', authMiddleware, roleMiddleware(...STAFF), orders.updateOrderStatus);

// ── TICKETS ──────────────────────────────────────────────
router.get('/tickets/validate/:ticket_code', authMiddleware, roleMiddleware(...STAFF), orders.validateTicket);

// ── PAGAMENTOS ───────────────────────────────────────────
router.get  ('/payments',            authMiddleware, roleMiddleware(...ADMIN), payments.getAll);
router.get  ('/payments/:id',        authMiddleware, roleMiddleware(...ADMIN), payments.getById);
router.patch('/payments/:id/approve',authMiddleware, roleMiddleware(...ADMIN), payments.approve);
router.patch('/payments/:id/reject', authMiddleware, roleMiddleware(...ADMIN), payments.reject);

export default router;
