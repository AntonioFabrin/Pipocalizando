import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Popcorn,
  ShoppingCart,
  User,
  Search,
  Menu,
  LogOut,
  LayoutDashboard,
  Ticket,
  X,
} from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Button } from './Button';
import { cn } from '@/src/lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { hasRole, ADMIN_ROLES } from '../../lib/roles';

const NAV_LINKS = [
  { label: 'Sessões', path: '/sessions' },
  { label: 'Filmes', path: '/catalog' },
  { label: 'Produtos', path: '/products' },
  { label: 'Sobre', path: '/about' },
];

export function Navbar() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems } = useCart();
  const isStaff = hasRole(user?.role, ADMIN_ROLES);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 inset-x-0 z-50 h-20 flex items-center px-6 lg:px-12 glass border-b-0"
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-8">
          <Link to="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-cinema-red p-2 rounded-xl transition-transform group-hover:rotate-12 duration-300">
              <Popcorn className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-2xl font-black tracking-tighter uppercase italic">
              Pipoca<span className="text-cinema-red">lizando</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-white/50">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'hover:text-white transition-colors relative group',
                    isActive && 'text-cinema-red hover:text-cinema-red'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    <span
                      className={cn(
                        'absolute -bottom-1 left-0 h-0.5 bg-cinema-red transition-all group-hover:w-full',
                        isActive ? 'w-full' : 'w-0'
                      )}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Search className="w-4 h-4" />
            </Button>

            <div className="h-6 w-px bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <div className="flex items-center gap-2">
                  <Link to="/my-tickets">
                    <Button variant="glass" size="sm" className="hidden lg:flex p-2 gap-2">
                      <Ticket className="w-4 h-4" />
                      <span>Ingressos</span>
                    </Button>
                  </Link>
                  <Link to="/cart">
                    <Button variant="ghost" size="sm" className="relative p-2">
                      <ShoppingCart className="w-5 h-5" />
                      {totalItems > 0 && (
                        <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-cinema-red rounded-full text-[8px] flex items-center justify-center border-2 border-cinema-black">
                          {totalItems}
                        </span>
                      )}
                    </Button>
                  </Link>
                </div>
              )}

              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  {isStaff && (
                    <Link to="/admin">
                      <Button variant="glass" size="sm" className="hidden lg:flex p-2 gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Painel</span>
                      </Button>
                    </Link>
                  )}
                  <span className="hidden lg:inline text-white/50 text-xs font-bold uppercase tracking-widest">
                    {user?.name?.split(' ')[0]}
                  </span>
                  <Button variant="glass" size="sm" className="p-2 gap-2" onClick={logout}>
                    <LogOut className="w-4 h-4" />
                    <span className="hidden lg:inline">Sair</span>
                  </Button>
                </div>
              ) : (
                <Link to="/login">
                  <Button variant="glass" size="sm" className="p-2 gap-2">
                    <User className="w-5 h-5" />
                    <span className="hidden lg:inline">Entrar</span>
                  </Button>
                </Link>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2 relative z-50"
              aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((value) => !value)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </motion.nav>

      <motion.aside
        initial={false}
        animate={isMobileMenuOpen ? { x: 0, opacity: 1 } : { x: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="fixed top-20 right-0 z-50 w-[min(86vw,19rem)] h-[calc(100vh-5rem)] md:hidden glass border-l border-white/10 shadow-2xl"
      >
        <div className="h-full flex flex-col p-6 gap-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.35em] text-white/40">Menu</span>
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              aria-label="Fechar menu"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <nav className="flex flex-col gap-2">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-2xl px-4 py-3 text-sm font-bold uppercase tracking-widest transition-colors border border-white/5 bg-white/[0.02] hover:bg-white/[0.06]',
                    isActive ? 'text-cinema-red border-cinema-red/30' : 'text-white/80'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-3">
            {isAuthenticated ? (
              <>
                <Link to="/my-tickets" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="glass" className="w-full justify-start">
                    <Ticket className="w-4 h-4" />
                    Ingressos
                  </Button>
                </Link>

                {isStaff && (
                  <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="glass" className="w-full justify-start">
                      <LayoutDashboard className="w-4 h-4" />
                      Painel
                    </Button>
                  </Link>
                )}

                <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="glass" className="w-full justify-start">
                    <ShoppingCart className="w-4 h-4" />
                    Carrinho
                    {totalItems > 0 && (
                      <span className="ml-auto min-w-5 h-5 px-1 bg-cinema-red rounded-full text-[10px] flex items-center justify-center">
                        {totalItems}
                      </span>
                    )}
                  </Button>
                </Link>

                <Button variant="primary" className="w-full justify-start" onClick={logout}>
                  <LogOut className="w-4 h-4" />
                  Sair
                </Button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full justify-start">
                  <User className="w-4 h-4" />
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
