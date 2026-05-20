/**
 * ErrorMessage.tsx — Componente de mensagem de erro do Pipocalizando
 *
 * Agente responsável: Designer UI/UX + Analista QA
 *
 * Exibição amigável de erros de rede ou da API para o usuário final.
 */

import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorMessage({
  message = 'Algo deu errado. Tente novamente.',
  onRetry,
}: ErrorMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 gap-6 text-center"
    >
      <div className="bg-red-500/10 p-4 rounded-2xl">
        <AlertTriangle className="w-10 h-10 text-red-400" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-display font-bold">Ops!</h3>
        <p className="text-white/50 text-sm max-w-md">{message}</p>
      </div>
      {onRetry && (
        <Button variant="glass" size="sm" onClick={onRetry}>
          Tentar Novamente
        </Button>
      )}
    </motion.div>
  );
}
