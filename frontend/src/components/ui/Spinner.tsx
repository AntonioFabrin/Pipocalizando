/**
 * Spinner.tsx — Componente de loading do Pipocalizando
 *
 * Agente responsável: Designer UI/UX + Desenvolvedor Frontend
 *
 * Componente de carregamento visual elegante usando animação suave.
 */

import { motion } from 'motion/react';
import { Popcorn } from 'lucide-react';

interface SpinnerProps {
  message?: string;
}

export function Spinner({ message = 'Carregando...' }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <Popcorn className="w-10 h-10 text-cinema-red" />
      </motion.div>
      <p className="text-white/40 text-sm font-bold uppercase tracking-widest">{message}</p>
    </div>
  );
}
