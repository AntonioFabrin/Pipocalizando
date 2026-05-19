import { motion } from 'motion/react';
import { Popcorn, Award, Users, Globe, Camera, MessageCircle, Share2 } from 'lucide-react';

export default function About() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-6 lg:px-12 pt-32 pb-24 space-y-32"
    >
      {/* Brand Story */}
      <section className="grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
             <div className="w-12 h-0.5 bg-cinema-red" />
             <span className="text-cinema-red font-bold uppercase tracking-[0.3em] text-xs">Nossa História</span>
          </div>
          <h1 className="font-display text-6xl font-black uppercase leading-[0.9] tracking-tighter italic">
            Passião por <br />
            <span className="text-cinema-red text-glow">Cinema</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            O Pipocalizando nasceu do desejo de transformar o simples ato de ver um filme em uma jornada sensorial inesquecível. Fundado em 2026, somos pioneiros na integração de tecnologia de ponta com conforto absoluto.
          </p>
          <div className="grid grid-cols-2 gap-8 pt-4">
             <div className="space-y-2">
                <span className="text-3xl font-display font-black text-cinema-red">12+</span>
                <p className="text-xs uppercase font-bold tracking-widest text-white/30">Salas Premium</p>
             </div>
             <div className="space-y-2">
                <span className="text-3xl font-display font-black text-cinema-red">500k+</span>
                <p className="text-xs uppercase font-bold tracking-widest text-white/30">Visitantes/Ano</p>
             </div>
          </div>
        </div>

        <div className="relative aspect-square">
           <div className="absolute inset-0 bg-cinema-red/20 blur-[100px] rounded-full" />
           <motion.img 
             whileHover={{ scale: 1.02 }}
             src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop" 
             className="w-full h-full object-cover rounded-[3rem] border border-white/10 shadow-2xl relative z-10"
             alt="Cinema Interior"
           />
        </div>
      </section>

      {/* Values (Bento style) */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
           <h2 className="font-display text-4xl font-bold uppercase tracking-tight italic">Por que <span className="text-cinema-red">Pipocalizar</span>?</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
           {[
             { title: 'Tecnologia IMAX', desc: 'Sistemas de som e imagem que transportam você para dentro da ação.', icon: <Globe className="w-8 h-8" /> },
             { title: 'Conforto VIP', desc: 'Poltronas reclináveis e atendimento exclusivo diretamente na sala.', icon: <Users className="w-8 h-8" /> },
             { title: 'Pipoca Gourmet', desc: 'Nossa famosa pipoca artesanal com milho selecionado e manteiga real.', icon: <Popcorn className="w-8 h-8" /> },
           ].map((item, i) => (
             <motion.div
               key={item.title}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className="p-10 glass-card space-y-6 text-center group"
             >
                <div className="bg-white/5 p-4 rounded-2xl w-fit mx-auto group-hover:bg-cinema-red group-hover:text-white transition-colors duration-500">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight">{item.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
             </motion.div>
           ))}
        </div>
      </section>

      {/* Contact & Location */}
      <section className="glass rounded-[3rem] p-12 md:p-20 overflow-hidden relative border-cinema-red/10">
         <div className="grid md:grid-cols-2 gap-16 relative z-10">
            <div className="space-y-8">
               <h2 className="font-display text-4xl font-bold uppercase tracking-tighter">Onde <span className="italic text-glow">Estamos</span></h2>
               <div className="space-y-6 text-white/60">
                  <div className="space-y-1">
                     <p className="text-white font-bold uppercase text-xs tracking-widest">Endereço</p>
                     <p>Av. das Estrelas, 1000 - Galáxia Center, 5º Andar</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-white font-bold uppercase text-xs tracking-widest">Contato</p>
                     <p>ouea@pipocalizando.com.br</p>
                     <p>(11) 98765-4321</p>
                  </div>
               </div>
               
               <div className="flex gap-4 pt-4">
                  <motion.a href="#" whileHover={{ scale: 1.2 }} className="p-3 bg-white/5 rounded-xl hover:text-cinema-red"><Camera className="w-5 h-5" /></motion.a>
                  <motion.a href="#" whileHover={{ scale: 1.2 }} className="p-3 bg-white/5 rounded-xl hover:text-cinema-red"><MessageCircle className="w-5 h-5" /></motion.a>
                  <motion.a href="#" whileHover={{ scale: 1.2 }} className="p-3 bg-white/5 rounded-xl hover:text-cinema-red"><Share2 className="w-5 h-5" /></motion.a>
               </div>
            </div>

            <div className="h-[300px] bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/10 italic text-white/20">
               [ Mapa Pipocalizando Integrado ]
            </div>
         </div>
      </section>
    </motion.div>
  );
}
