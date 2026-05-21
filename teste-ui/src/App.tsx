import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Navbar } from './components/ui/Navbar';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Popcorn } from 'lucide-react';

// Pages
import Home from './pages/Home';
import Sessions from './pages/Sessions';
import Catalog from './pages/Catalog';
import MovieDetails from './pages/MovieDetails';
import SeatSelection from './pages/SeatSelection';
import Products from './pages/Products';
import Cart from './pages/Cart';
import CartReturn from './pages/CartReturn';
import About from './pages/About';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateMovie from './pages/admin/CreateMovie';
import CreateProduct from './pages/admin/CreateProduct';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <div key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/movies/:id" element={<MovieDetails />} />
          <Route path="/seats" element={<SeatSelection />} />
          <Route path="/products" element={<Products />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/cart/return" element={<CartReturn />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/movies/new" element={<CreateMovie />} />
          <Route path="/admin/movies/edit/:id" element={<CreateMovie />} />
          <Route path="/admin/products/new" element={<CreateProduct />} />
          <Route path="/admin/products/edit/:id" element={<CreateProduct />} />
        </Routes>
      </div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-cinema-black selection:bg-cinema-red/30 flex flex-col">
            <Navbar />

            <main className="flex-1">
              <AnimatedRoutes />
            </main>

            <footer className="border-t border-white/5 py-12 px-6 lg:px-12 bg-black/40">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-white/30">
                <div className="flex items-center gap-2 italic">
                  <Popcorn className="w-5 h-5 text-cinema-red" />
                  © 2026 Pipocalizando. Todos os direitos reservados.
                </div>
                <div className="flex items-center gap-8">
                  <a href="#" className="hover:text-cinema-red transition-colors">Termos</a>
                  <a href="#" className="hover:text-cinema-red transition-colors">Privacidade</a>
                  <a href="#" className="hover:text-cinema-red transition-colors">Trabalhe Conosco</a>
                </div>
              </div>
            </footer>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
