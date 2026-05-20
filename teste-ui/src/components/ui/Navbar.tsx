/**
 * Navbar.tsx — Barra de navegação com estado de autenticação
 *
 * Agente responsável: Desenvolvedor Frontend
 *
 * Exibe botões de Login/Logout baseados no AuthContext.
 */

import { motion } from 'motion/react';
import { Popcorn, ShoppingCart, User, Search, Menu, LogOut } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from './Button';
import { cn } from '@/src/lib/utils';
import { useAuth } from '../../contexts/AuthContext';

const NAV_LINKS = [
  { label: 'Sessões', path: '/sessions' },
  { label: 'Filmes', path: '/catalog' },
  { label: 'Preços', path: '/pricing' },
  { label: 'Sobre', path: '/about' },
];

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 inset-x-0 z-50 h-20 flex items-center px-6 lg:px-12 glass border-b-0"
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="bg-cinema-red p-2 rounded-xl transition-transform group-hover:rotate-12 duration-300">
            <Popcorn className="w-6 h-6 text-white" />
          </div>
          <span className="font-display text-2xl font-black tracking-tighter uppercase italic">
            Pipoca<span className="text-cinema-red">lizando</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-white/50">
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "hover:text-white transition-colors relative group",
                isActive && "text-cinema-red hover:text-cinema-red"
              )}
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  <span className={cn(
                    "absolute -bottom-1 left-0 h-0.5 bg-cinema-red transition-all group-hover:w-full",
                    isActive ? "w-full" : "w-0"
                  )} />
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Search className="w-4 h-4" />
          </Button>
          
          <div className="h-6 w-px bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="relative p-2">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-cinema-red rounded-full text-[8px] flex items-center justify-center border-2 border-cinema-black">3</span>
            </Button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
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
