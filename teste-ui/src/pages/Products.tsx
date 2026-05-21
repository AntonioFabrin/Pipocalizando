import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Coffee, CupSoda, PackagePlus, Pencil, Plus, Popcorn, Search, ShoppingCart, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { cn } from '@/src/lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  image_url?: string | null;
  category_name?: string | null;
}

const CATEGORY_IMAGES: Record<string, string> = {
  pipoca: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=1600&auto=format&fit=crop',
  doces: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=1600&auto=format&fit=crop',
  bebidas: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=1600&auto=format&fit=crop',
  combos: 'https://images.unsplash.com/photo-1627222295124-f8b3fc09e47f?q=80&w=1600&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1549421263-549463996f6e?q=80&w=1600&auto=format&fit=crop',
};

const normalizeCategory = (value?: string | null) => (
  value || 'Outros'
).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const getCategoryImage = (product: Product) => {
  if (product.image_url?.startsWith('http')) return product.image_url;

  const category = normalizeCategory(product.category_name);
  if (category.includes('pipoca')) return CATEGORY_IMAGES.pipoca;
  if (category.includes('doce')) return CATEGORY_IMAGES.doces;
  if (category.includes('bebida') || category.includes('refrigerante')) return CATEGORY_IMAGES.bebidas;
  if (category.includes('combo')) return CATEGORY_IMAGES.combos;
  return CATEGORY_IMAGES.default;
};

const getCategoryIcon = (category?: string | null) => {
  const normalized = normalizeCategory(category);
  if (normalized.includes('pipoca') || normalized.includes('doce')) return Popcorn;
  if (normalized.includes('bebida') || normalized.includes('refrigerante')) return CupSoda;
  if (normalized.includes('combo')) return PackagePlus;
  return Coffee;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(price || 0));

export default function Products() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addItem, getItemQuantity } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.get<Product[]>('/products');
        setProducts(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar produtos.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const unique = new Set(products.map((product) => product.category_name || 'Outros'));
    return ['Todos', ...Array.from(unique)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = !search.trim()
        || product.name.toLowerCase().includes(search.toLowerCase())
        || product.description?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = activeCategory === 'Todos'
        || (product.category_name || 'Outros') === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [activeCategory, products, search]);

  const featuredProduct = products.find((product) => normalizeCategory(product.category_name).includes('combo')) || products[0];
  const isSeller = user?.role === 'admin' || user?.role === 'seller' || user?.role === 'super_admin';

  const handleAddToCart = (product: Product) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    addItem(product, 1);
    setNotice(`${product.name} adicionado ao carrinho.`);
    window.setTimeout(() => setNotice(null), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-6 lg:px-12 pt-32 pb-24 space-y-14"
    >
      <section className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-end">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-0.5 bg-cinema-red" />
            <span className="text-cinema-red font-bold uppercase tracking-[0.3em] text-xs">
              Bomboniere
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.9]">
              Cardápio <span className="text-cinema-red text-glow">Pipoca</span>
            </h1>
            <p className="text-white/55 max-w-xl leading-relaxed">
              Pipocas, bebidas e combos para completar a sessão sem quebrar o clima.
            </p>
          </div>
        </div>

        {featuredProduct && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative min-h-[260px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03]"
          >
            <img
              src={getCategoryImage(featuredProduct)}
              alt={featuredProduct.name}
              className="absolute inset-0 h-full w-full object-cover brightness-[0.55]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-cinema-black via-cinema-black/70 to-transparent" />
            <div className="relative z-10 flex h-full min-h-[260px] flex-col justify-end p-8">
              <div className="mb-4 flex w-fit items-center gap-2 rounded-full border border-cinema-red/40 bg-cinema-red/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cinema-red">
                <Sparkles className="h-3.5 w-3.5" />
                Destaque
              </div>
              <h2 className="font-display text-3xl font-black uppercase italic tracking-tight">
                {featuredProduct.name}
              </h2>
              <p className="mt-2 max-w-sm text-sm text-white/65">{featuredProduct.description}</p>
              <div className="mt-5 text-3xl font-display font-black text-cinema-gold">
                {formatPrice(featuredProduct.price)}
              </div>
            </div>
          </motion.div>
        )}
      </section>

      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category);
            return (
              <Button
                key={category}
                variant={activeCategory === category ? 'primary' : 'secondary'}
                size="sm"
                className="rounded-xl whitespace-nowrap px-5"
                onClick={() => setActiveCategory(category)}
              >
                <Icon className="h-4 w-4" />
                {category}
              </Button>
            );
          })}
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          {isSeller && (
            <Link to="/admin/products/new">
              <Button variant="primary" className="w-full rounded-xl sm:w-auto">
                <Plus className="h-4 w-4" />
                Novo Produto
              </Button>
            </Link>
          )}
          <div className="relative w-full lg:w-[320px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm transition-colors focus:border-cinema-red/50 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {notice && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          {notice}
          <Link to="/cart" className="ml-2 font-black uppercase tracking-widest text-white hover:text-cinema-red">
            Ver carrinho
          </Link>
        </div>
      )}

      {isLoading && <Spinner message="Carregando produtos..." />}
      {error && <ErrorMessage message={error} onRetry={() => window.location.reload()} />}

      {!isLoading && !error && (
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product, index) => {
            const Icon = getCategoryIcon(product.category_name);
            const isLowStock = Number(product.stock) > 0 && Number(product.stock) <= 10;
            const isOutOfStock = Number(product.stock) <= 0;

            return (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: index * 0.04 }}
                className="group glass-card flex h-full flex-col overflow-hidden"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={getCategoryImage(product)}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-transparent to-transparent opacity-70" />
                  <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                    <Icon className="h-3.5 w-3.5 text-cinema-red" />
                    {product.category_name || 'Outros'}
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div className="space-y-2">
                    <h3 className="font-display text-xl font-black uppercase italic leading-tight tracking-tight line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="min-h-[40px] text-xs leading-relaxed text-white/55 line-clamp-2">
                      {product.description || 'Produto disponível na bomboniere.'}
                    </p>
                  </div>

                  <div className="mt-auto flex items-end justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">Preço</span>
                      <div className="font-display text-2xl font-black text-cinema-gold">
                        {formatPrice(product.price)}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest',
                        isOutOfStock && 'border-white/10 bg-white/5 text-white/35',
                        isLowStock && 'border-cinema-gold/40 bg-cinema-gold/10 text-cinema-gold',
                        !isOutOfStock && !isLowStock && 'border-cinema-red/30 bg-cinema-red/10 text-cinema-red'
                      )}
                    >
                      {isOutOfStock ? 'Esgotado' : `${product.stock} un.`}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {isSeller && (
                      <Link to={`/admin/products/edit/${product.id}`} className="shrink-0">
                        <Button
                          variant="glass"
                          className="h-full rounded-xl border border-white/10 px-3"
                          aria-label={`Editar ${product.name}`}
                          title="Editar produto"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    <Button
                      className="w-full rounded-xl"
                      disabled={isOutOfStock}
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {!isAuthenticated
                        ? 'Entrar para comprar'
                        : getItemQuantity(product.id) > 0
                        ? `Adicionar mais (${getItemQuantity(product.id)})`
                        : 'Adicionar'}
                    </Button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </section>
      )}

      {!isLoading && !error && filteredProducts.length === 0 && (
        <div className="glass-card py-16 text-center">
          <p className="font-display text-2xl font-black uppercase italic">Nenhum produto encontrado</p>
          <p className="mt-2 text-sm text-white/45">Tente outra busca ou categoria.</p>
        </div>
      )}
    </motion.div>
  );
}
