import { motion } from 'motion/react';
import { Ticket, Popcorn as PopcornIcon, Beer, Star, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';

const TICKETS = [
  { name: 'Inteira', price: 32.00, features: ['Acesso a qualquer sala', 'Assento padrão'] },
  { name: 'Meia-Entrada', price: 16.00, features: ['Estudantes e idosos', 'Acesso a qualquer sala'] },
  { name: 'IMAX 3D', price: 45.00, features: ['Som e imagem premium', 'Óculos inclusos', 'Melhor imersão'], highlight: true },
  { name: 'VIP Deck', price: 68.00, features: ['Assento reclinável', 'Garçom na sala', 'Welcome drink'] },
];

const COMBOS = [
  { name: 'Combo Clássico', price: 28.00, desc: 'Pipoca M + Refrigerante 500ml', icon: <PopcornIcon className="w-6 h-6" /> },
  { name: 'Combo Mega', price: 42.00, desc: 'Pipoca G (Refil) + 2 Refrigerantes 700ml', icon: <Star className="w-6 h-6" />, highlight: true },
  { name: 'Combo Casal VIP', price: 55.00, desc: '2 Pipocas M + 2 Refris 700ml + Bombom', icon: <Beer className="w-6 h-6" /> },
];

export default function Pricing() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-6 lg:px-12 pt-32 pb-24 space-y-24"
    >
      <div className="text-center space-y-4">
        <h1 className="font-display text-6xl font-black uppercase italic tracking-tighter">
          Tabela de <span className="text-cinema-red text-glow">Preços</span>
        </h1>
        <p className="text-white/50 max-w-xl mx-auto">
          Escolha a melhor opção para sua experiência. Temos condições especiais para grupos e fidelidade.
        </p>
      </div>

      {/* Tickets Section */}
      <section className="space-y-12">
        <div className="flex items-center gap-3">
          <Ticket className="w-6 h-6 text-cinema-red px-0.5" />
          <h2 className="font-display text-3xl font-bold uppercase tracking-tight">Ingressos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TICKETS.map((ticket, i) => (
            <motion.div
              key={ticket.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-8 rounded-[2rem] glass-card flex flex-col gap-8 transition-transform hover:scale-105 ${ticket.highlight ? 'border-cinema-red/50 shadow-[0_0_40px_-10px_rgba(229,9,20,0.3)]' : ''}`}
            >
              <div className="space-y-2">
                <h3 className="text-lg font-bold uppercase tracking-widest text-white/80">{ticket.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm opacity-50">R$</span>
                  <span className="text-5xl font-display font-black text-glow">{ticket.price.toFixed(0)}</span>
                  <span className="text-lg opacity-50">,{(ticket.price % 1).toFixed(2).split('.')[1] || '00'}</span>
                </div>
              </div>

              <ul className="space-y-4 flex-1">
                {ticket.features.map(f => (
                  <li key={f} className="flex items-start gap-3 text-xs text-white/60">
                    <Check className="w-4 h-4 text-cinema-red shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button variant={ticket.highlight ? 'primary' : 'glass'} className="w-full">
                Selecionar
              </Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Combos Section */}
      <section className="space-y-12">
        <div className="flex items-center gap-3">
          <PopcornIcon className="w-6 h-6 text-cinema-red" />
          <h2 className="font-display text-3xl font-bold uppercase tracking-tight">Combos & Snacks</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {COMBOS.map((combo, i) => (
            <motion.div
              key={combo.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`relative overflow-hidden group rounded-[2.5rem] p-10 glass-card flex items-center justify-between gap-8 ${combo.highlight ? 'bg-cinema-red/10 border-cinema-red/20' : ''}`}
            >
               <div className="space-y-4 flex-1">
                  <div className="bg-white/5 p-3 rounded-2xl w-fit group-hover:rotate-12 transition-transform">
                    {combo.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-black uppercase tracking-tight">{combo.name}</h3>
                    <p className="text-sm text-white/50">{combo.desc}</p>
                  </div>
                  <div className="text-3xl font-display font-black text-cinema-gold">
                    R$ {combo.price.toFixed(2)}
                  </div>
               </div>
               
               <Button variant="primary" size="sm" className="rounded-2xl p-4 shrink-0">
                  <Check className="w-5 h-5" />
               </Button>

               {combo.highlight && (
                 <div className="absolute -top-2 -right-8 bg-cinema-red text-white text-[10px] font-black uppercase tracking-[0.2em] py-4 px-12 rotate-45 shadow-xl">
                   Popular
                 </div>
               )}
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
