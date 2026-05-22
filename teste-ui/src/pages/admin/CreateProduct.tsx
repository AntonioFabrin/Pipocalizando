import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, DollarSign, ImagePlus, Loader2, Package, PackageCheck, UploadCloud } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { hasRole, STAFF_ROLES } from '../../lib/roles';

interface Category {
  id: number;
  name: string;
  description?: string | null;
}

export default function CreateProduct() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [errorMsg, setErrorMsg] = useState('');

  const hasAccess = hasRole(user?.role, STAFF_ROLES);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await api.get<Category[]>('/categories');
        setCategories(data);
      } catch (error: any) {
        setErrorMsg(error.message || 'Erro ao carregar categorias.');
      }
    }

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!isEditMode || !id) return;

    async function fetchProduct() {
      try {
        setIsLoading(true);
        const product = await api.get<any>(`/products/${id}`);
        setName(product.name || '');
        setDescription(product.description || '');
        setPrice(product.price ? String(product.price) : '');
        setStock(product.stock !== undefined && product.stock !== null ? String(product.stock) : '');
        setCategoryId(product.category_id || '');
        setImagePreview(product.image_url || null);
      } catch (error: any) {
        setErrorMsg(error.message || 'Erro ao carregar produto.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProduct();
  }, [id, isEditMode]);

  if (!hasAccess) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-3xl font-display font-bold text-cinema-red uppercase italic">Acesso Negado</h2>
        <p className="text-white/50 mt-4">Você não tem permissão para acessar esta página.</p>
        <Button className="mt-8" onClick={() => navigate('/products')}>Voltar aos Produtos</Button>
      </div>
    );
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Selecione apenas arquivos de imagem.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('A imagem deve ter no máximo 5MB.');
      return;
    }

    setImageFile(file);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.onerror = () => {
      setErrorMsg('Erro ao ler a imagem. Tente novamente.');
      setImageFile(null);
      setImagePreview(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      let imageUrl = imagePreview;

      if (imageFile) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadResult = await api.upload<{ url: string }>('/upload/image', formData);
        imageUrl = uploadResult.url;
        setUploadingImage(false);
      }

      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        price: price ? Number(price) : 0,
        stock: stock ? Number(stock) : 0,
        category_id: categoryId || null,
        image_url: imageUrl || null,
        is_active: 1,
      };

      if (!payload.name) {
        throw new Error('O nome do produto é obrigatório.');
      }

      if (payload.price <= 0) {
        throw new Error('Informe um preço maior que zero.');
      }

      if (isEditMode) {
        await api.put(`/products/${id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      navigate('/products');
    } catch (error: any) {
      setErrorMsg(error.message || 'Erro ao salvar produto.');
    } finally {
      setUploadingImage(false);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cinema-red" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-6 lg:px-12 pt-32 pb-24"
    >
      <button
        onClick={() => navigate('/products')}
        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar aos Produtos
      </button>

      <div className="space-y-4 mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-black uppercase italic tracking-tighter">
          {isEditMode ? 'Editar' : 'Adicionar'} <span className="text-cinema-red text-glow">Produto</span>
        </h1>
        <p className="text-white/50">
          Atualize pipocas, bebidas, doces e combos da bomboniere.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {errorMsg && (
          <div className="bg-cinema-red/10 border border-cinema-red/50 text-cinema-red px-6 py-4 rounded-2xl text-sm font-bold">
            {errorMsg}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-12">
          <div className="col-span-1 space-y-4">
            <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
              Imagem do Produto
            </label>
            <div className="relative group aspect-[4/5] rounded-3xl overflow-hidden glass border-2 border-dashed border-white/20 hover:border-cinema-red/50 transition-colors flex flex-col items-center justify-center cursor-pointer">
              <input
                type="file"
                accept="image/jpeg, image/jpg, image/png, image/webp, image/gif"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                disabled={uploadingImage || isSubmitting}
              />

              {uploadingImage ? (
                <div className="flex flex-col items-center text-cinema-gold p-6 text-center space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest">Enviando imagem...</span>
                </div>
              ) : imagePreview ? (
                <img src={imagePreview} alt="Preview do produto" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-white/30 group-hover:text-cinema-red transition-colors p-6 text-center space-y-4">
                  <UploadCloud className="w-10 h-10" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Clique para enviar imagem
                  </span>
                  <span className="text-[10px] text-white/20">JPG, PNG, WEBP ou GIF até 5MB</span>
                </div>
              )}

              {imagePreview && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  <span className="text-xs font-bold uppercase tracking-widest text-white">Alterar Imagem</span>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-2 space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
                Nome do Produto *
              </label>
              <div className="relative">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex: Combo Premium"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-cinema-red/50 transition-colors text-white"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
                  Classificação *
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value ? Number(event.target.value) : '')}
                  className="w-full bg-[#151515] border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cinema-red/50 transition-colors text-white appearance-none"
                >
                  <option value="">Selecione...</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
                  Quantidade em Estoque *
                </label>
                <div className="relative">
                  <PackageCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={stock}
                    onChange={(event) => setStock(event.target.value)}
                    placeholder="Ex: 80"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-cinema-red/50 transition-colors text-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
                Valor *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="Ex: 22.00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-cinema-red/50 transition-colors text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
                Descrição *
              </label>
              <div className="relative">
                <ImagePlus className="absolute left-4 top-4 w-4 h-4 text-white/30" />
                <textarea
                  required
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Ex: Pipoca M + Refrigerante"
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-cinema-red/50 transition-colors text-white resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-8 border-t border-white/10">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/products')}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="px-10"
            disabled={isSubmitting || uploadingImage}
          >
            {isSubmitting || uploadingImage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : isEditMode ? 'Atualizar Produto' : 'Salvar Produto'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
