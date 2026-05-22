import { motion } from 'motion/react';
import { Popcorn, ShoppingCart, User, Search, Menu, LogOut, LayoutDashboard, Ticket } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
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
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems } = useCart();
  const isStaff = hasRole(user?.role, ADMIN_ROLES);

  return (
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

          <Button variant="ghost" size="sm" className="md:hidden p-2">
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
