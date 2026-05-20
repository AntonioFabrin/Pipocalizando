/**
 * CreateMovie.tsx — Tela Administrativa para Cadastro de Filmes
 *
 * Agente responsável: Desenvolvedor Frontend e Designer UI/UX
 *
 * Formulário completo com upload de imagem e validações visuais.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { UploadCloud, Film, Calendar, DollarSign, ArrowLeft, Loader2, UserRound } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function CreateMovie() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  // Estados do formulário
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [rating, setRating] = useState('Livre');
  const [duration, setDuration] = useState('');
  const [premiereDate, setPremiereDate] = useState('');
  const [onDisplayUntil, setOnDisplayUntil] = useState('');
  const [director, setDirector] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  
  // Estado do arquivo de imagem
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Estados de controle
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [movieDetails, setMovieDetails] = useState<any>(null);

  // Carrega as categorias gerenciáveis do banco
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const list = await api.get<any[]>('/movie-categories');
        console.log('[CreateMovie] Categorias carregadas:', list);
        setCategoriesList(list);
      } catch (err) {
        console.error('[CreateMovie] Erro ao buscar categorias:', err);
      }
    };
    fetchCategories();
  }, []);

  // Carrega os dados do filme para edição
  useEffect(() => {
    if (isEditMode && id) {
      console.log('[CreateMovie] Modo de edição ativo. Carregando filme ID:', id);
      const fetchMovie = async () => {
        try {
          const m = await api.get<any>(`/movies/${id}`);
          console.log('[CreateMovie] Filme carregado do backend:', m);
          setMovieDetails(m);
          setTitle(m.title || '');
          setGenre(m.genre || '');
          setCategoryId(m.category_id || '');
          setRating(m.rating || 'Livre');
          setDuration(m.duration_minutes ? String(m.duration_minutes) : '');
          
          if (m.premiere_date) {
            setPremiereDate(m.premiere_date.split('T')[0]);
          }
          if (m.on_display_until) {
            setOnDisplayUntil(m.on_display_until.split('T')[0]);
          }
          
          setDirector(m.director || '');
          setDescription(m.description || '');
          setPrice(m.price ? String(m.price) : '');
          if (m.poster_url) {
            setImagePreview(m.poster_url);
          }
        } catch (err: any) {
          console.error('[CreateMovie] Erro ao carregar filme:', err);
          setErrorMsg('Erro ao carregar dados do filme: ' + (err.message || err));
        }
      };
      fetchMovie();
    }
  }, [isEditMode, id]);

  const hasAccess = user && (user.role === 'admin' || user.role === 'seller' || user.role === 'super_admin');
  if (!hasAccess) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-3xl font-display font-bold text-cinema-red uppercase italic">Acesso Negado</h2>
        <p className="text-white/50 mt-4">Você não tem permissão para acessar esta página.</p>
        <Button className="mt-8" onClick={() => navigate('/catalog')}>Voltar ao Catálogo</Button>
      </div>
    );
  }

  // Lida com a seleção de imagem
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('[CreateMovie] Arquivo selecionado:', file?.name, file?.type, file?.size);
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor, selecione apenas arquivos de imagem (JPG/PNG).');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('A imagem deve ter no máximo 5MB.');
      return;
    }
    
    setImageFile(file);
    setErrorMsg('');
    
    const reader = new FileReader();
    reader.onload = () => {
      console.log('[CreateMovie] Preview gerado com sucesso');
      setImagePreview(reader.result as string);
    };
    reader.onerror = () => {
      console.error('[CreateMovie] Erro ao ler arquivo');
      setErrorMsg('Erro ao ler a imagem. Tente novamente.');
      setImageFile(null);
      setImagePreview(null);
    };
    reader.readAsDataURL(file);
  };

  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      let poster_url: string | null = null;

      // 1. Fazer upload da imagem primeiro (se existir)
      if (imageFile) {
        console.log('[CreateMovie] Iniciando upload da imagem...', imageFile.name, imageFile.type, imageFile.size);
        setUploadingImage(true);
        const formData = new FormData();
        
        // Anexar o arquivo diretamente (o browser define o Content-Type automaticamente com boundary)
        formData.append('image', imageFile);
        
        console.log('[CreateMovie] FormData criado, arquivo anexado');
        
        try {
          const uploadResult = await api.upload<{ url: string }>('/upload/image', formData);
          console.log('[CreateMovie] Upload retornou:', uploadResult);
          poster_url = uploadResult.url;
          console.log('[CreateMovie] poster_url definido:', poster_url);
        } catch (uploadError: any) {
          console.error('[CreateMovie] Erro no upload:', uploadError);
          setUploadingImage(false);
          throw new Error(`Falha ao subir a imagem de capa: ${uploadError.message || 'Formato não suportado ou arquivo muito grande.'}`);
        }
        setUploadingImage(false);
      } else {
        console.log('[CreateMovie] Nenhuma imagem selecionada');
      }

      // 2. Criar ou editar o filme com a URL da imagem retornada
      const movieData = {
        ...(isEditMode ? movieDetails : {}),
        title,
        genre,
        category_id: categoryId || null,
        rating,
        duration_minutes: duration ? parseInt(duration, 10) : null,
        director: director.trim() || null,
        premiere_date: premiereDate || null,
        on_display_until: onDisplayUntil || null,
        description,
        price: price ? parseFloat(price) : 0,
        poster_url: poster_url || imagePreview,
        status: isEditMode ? (movieDetails?.status || 'now_playing') : 'now_playing'
      };

      console.log('[CreateMovie] Enviando movieData:', movieData);
      
      if (isEditMode) {
        await api.put(`/movies/${id}`, movieData);
        console.log('[CreateMovie] Filme editado com sucesso');
      } else {
        const response = await api.post<{ id: number }>('/movies', movieData);
        console.log('[CreateMovie] Filme criado com sucesso, ID:', response.id);
      }
      
      // Sucesso! Redirecionar para o catálogo
      navigate('/catalog');
    } catch (error: any) {
      console.error('[CreateMovie] Erro ao salvar:', error);
      setErrorMsg(error.message || 'Erro ao salvar o filme. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-6 lg:px-12 pt-32 pb-24"
    >
      <button 
        onClick={() => navigate('/catalog')}
        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao Catálogo
      </button>

      <div className="space-y-4 mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-black uppercase italic tracking-tighter">
          {isEditMode ? 'Editar' : 'Adicionar Novo'} <span className="text-cinema-red text-glow">Filme</span>
        </h1>
        <p className="text-white/50">
          {isEditMode ? 'Altere as informações do filme cadastrado no sistema.' : 'Preencha os dados abaixo para disponibilizar um novo título no sistema.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        
        {errorMsg && (
          <div className="bg-cinema-red/10 border border-cinema-red/50 text-cinema-red px-6 py-4 rounded-2xl text-sm font-bold">
            {errorMsg}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-12">
          {/* Coluna Esquerda: Upload de Imagem */}
          <div className="col-span-1 space-y-4">
            <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
              Capa do Filme
            </label>
            <div className="relative group aspect-[2/3] rounded-3xl overflow-hidden glass border-2 border-dashed border-white/20 hover:border-cinema-red/50 transition-colors flex flex-col items-center justify-center cursor-pointer">
              <input 
                type="file" 
                accept="image/jpeg, image/jpg, image/png, image/webp, image/gif" 
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                disabled={uploadingImage}
              />
              
              {uploadingImage ? (
                <div className="flex flex-col items-center text-cinema-gold p-6 text-center space-y-4">
                  <div className="w-10 h-10 border-2 border-cinema-gold border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Enviando imagem...
                  </span>
                </div>
              ) : imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-white/30 group-hover:text-cinema-red transition-colors p-6 text-center space-y-4">
                  <UploadCloud className="w-10 h-10" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Arraste ou Clique para Upload (JPG, PNG, WEBP, GIF)
                  </span>
                  <span className="text-[10px] text-white/20">
                    Máximo 5MB
                  </span>
                </div>
              )}
              
              {/* Overlay on hover when image exists */}
              {imagePreview && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  <span className="text-xs font-bold uppercase tracking-widest text-white">Alterar Imagem</span>
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita: Campos de Texto */}
          <div className="col-span-2 space-y-6">
            
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
                Título do Filme *
              </label>
              <div className="relative">
                <Film className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Vingadores: Ultimato"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-cinema-red/50 transition-colors text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
                  Diretor do Filme
                </label>
                <div className="relative">
                  <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    placeholder="Ex: Denis Villeneuve"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-cinema-red/50 transition-colors text-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
                  Gênero (Tags de busca) *
                </label>
                <input 
                  type="text" 
                  required
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Ex: Ação, Ficção"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cinema-red/50 transition-colors text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
                  Categoria Principal *
                </label>
                <select 
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-[#151515] border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cinema-red/50 transition-colors text-white appearance-none"
                >
                  <option value="">Selecione uma categoria...</option>
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
                  Classificação Indicativa *
                </label>
                <select 
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full bg-[#151515] border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cinema-red/50 transition-colors text-white appearance-none"
                >
                  <option value="Livre">Livre</option>
                  <option value="10">10 anos</option>
                  <option value="12">12 anos</option>
                  <option value="14">14 anos</option>
                  <option value="16">16 anos</option>
                  <option value="18">18 anos</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
                  Duração (Minutos)
                </label>
                <input 
                  type="number" 
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Ex: 120"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cinema-red/50 transition-colors text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
                  Preço Base (R$) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="25.50"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-cinema-red/50 transition-colors text-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
                  Data de Estreia
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input 
                    type="date" 
                    value={premiereDate}
                    onChange={(e) => setPremiereDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-cinema-red/50 transition-colors text-white"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
                  Saída de Cartaz
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input 
                    type="date" 
                    value={onDisplayUntil}
                    onChange={(e) => setOnDisplayUntil(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-cinema-red/50 transition-colors text-white"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
                Sinopse *
              </label>
              <textarea 
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Digite um resumo sobre o filme..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cinema-red/50 transition-colors text-white resize-none"
              />
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-8 border-t border-white/10">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => navigate('/catalog')}
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
            {uploadingImage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                Enviando imagem...
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                Salvando...
              </>
            ) : isEditMode ? 'Atualizar Filme' : 'Salvar Filme'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
