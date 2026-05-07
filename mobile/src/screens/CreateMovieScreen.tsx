import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Image, ActivityIndicator, Alert, Switch,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  createMovie, updateMovie,
  getMovieCategories, getMovieRooms,
  createMovieSession,
  uploadImage,
} from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW } from '../types/theme';

// ─── Tipos ──────────────────────────────────────────────────────────────────

type Category = { id: number; name: string; emoji: string };
type Room     = { id: number; name: string; type: string; capacity: number };
type Session  = { date: string; time: string; room_id: number | null; language: 'dublado' | 'legendado' | 'original'; seats: string };

const RATINGS   = ['Livre', '10+', '12+', '14+', '16+', '18+'];
const LANGUAGES = ['dublado', 'legendado', 'original'] as const;
const STATUSES  = [
  { value: 'now_playing', label: '🎬 Em cartaz',  color: COLORS.success },
  { value: 'coming_soon', label: '📅 Em breve',   color: COLORS.primary },
  { value: 'ended',       label: '🔚 Encerrado',  color: COLORS.textMuted },
];

const EMPTY_SESSION: Session = {
  date: '', time: '', room_id: null, language: 'dublado', seats: '100',
};

// ─── Componente de Seção ─────────────────────────────────────────────────────
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={sectionStyles.wrapper}>
    <Text style={sectionStyles.title}>{title}</Text>
    {children}
  </View>
);

const Field = ({
  label, value, onChangeText, placeholder, keyboard = 'default', multiline = false, hint,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboard?: any; multiline?: boolean; hint?: string;
}) => (
  <View style={fieldStyles.wrapper}>
    <Text style={fieldStyles.label}>{label}</Text>
    {hint ? <Text style={fieldStyles.hint}>{hint}</Text> : null}
    <TextInput
      style={[fieldStyles.input, multiline && fieldStyles.multiline]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textMuted}
      keyboardType={keyboard}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      autoCapitalize={keyboard === 'url' ? 'none' : 'sentences'}
    />
  </View>
);

// ─── Tela Principal ──────────────────────────────────────────────────────────

export default function CreateMovieScreen({ navigation, route }: any) {
  const editingMovie = route?.params?.movie ?? null;
  const isEditing = !!editingMovie;

  // Dados principais do filme
  const [title,           setTitle]           = useState(editingMovie?.title || '');
  const [description,     setDescription]     = useState(editingMovie?.description || '');
  const [genre,           setGenre]           = useState(editingMovie?.genre || '');
  const [duration,        setDuration]        = useState(editingMovie?.duration_minutes?.toString() || '');
  const [director,        setDirector]        = useState(editingMovie?.director || '');
  const [castInfo,        setCastInfo]        = useState(editingMovie?.cast_info || '');
  const [selectedRating,  setSelectedRating]  = useState(editingMovie?.rating || '');
  const [status,          setStatus]          = useState(editingMovie?.status || 'now_playing');
  const [price,           setPrice]           = useState(editingMovie?.price?.toString() || '');
  const [premiereDate,    setPremiereDate]    = useState(editingMovie?.premiere_date?.slice(0,10) || '');
  const [displayUntil,    setDisplayUntil]    = useState(editingMovie?.on_display_until?.slice(0,10) || '');
  const [trailerUrl,      setTrailerUrl]      = useState(editingMovie?.trailer_url || '');

  // Poster
  const [posterUrl,       setPosterUrl]       = useState(editingMovie?.poster_url || '');
  const [localPosterUri,  setLocalPosterUri]  = useState<string | null>(null);
  const [uploadingPoster, setUploadingPoster] = useState(false);

  // Categoria e sala
  const [categories,      setCategories]      = useState<Category[]>([]);
  const [rooms,           setRooms]           = useState<Room[]>([]);
  const [categoryId,      setCategoryId]      = useState<number | null>(editingMovie?.category_id || null);
  const [roomId,          setRoomId]          = useState<number | null>(editingMovie?.room_id || null);

  // Sessões
  const [sessions,        setSessions]        = useState<Session[]>([{ ...EMPTY_SESSION }]);

  // UI
  const [saving,          setSaving]          = useState(false);
  const [loadingOptions,  setLoadingOptions]  = useState(true);
  const [previewMode,     setPreviewMode]     = useState(false);

  // ── Carrega categorias e salas ────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [catRes, roomRes] = await Promise.all([getMovieCategories(), getMovieRooms()]);
        setCategories(catRes.data);
        setRooms(roomRes.data);
        // se editando, pré-preenche room nas sessões
        if (isEditing && editingMovie?.room_id) {
          setSessions([{ ...EMPTY_SESSION, room_id: editingMovie.room_id }]);
        }
      } catch {
        Alert.alert('Aviso', 'Não foi possível carregar categorias e salas. Verifique a conexão com o backend.');
      } finally {
        setLoadingOptions(false);
      }
    })();
  }, []);

  // ── Poster ────────────────────────────────────────────
  const handlePickPoster = () => {
    Alert.alert('📸 Poster do Filme', 'Escolha a origem:', [
      { text: '📷 Câmera',  onPress: () => pickImage('camera') },
      { text: '🖼 Galeria', onPress: () => pickImage('gallery') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permissão negada'); return; }
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [2, 3], quality: 0.85 });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permissão negada'); return; }
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [2, 3], quality: 0.85 });
      }
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setLocalPosterUri(asset.uri);
        setUploadingPoster(true);
        try {
          const url = await uploadImage(asset.uri, `poster-${Date.now()}.jpg`);
          setPosterUrl(url);
          Alert.alert('✅ Sucesso', 'Imagem do poster enviada!');
        } catch {
          Alert.alert('Erro', 'Falha ao enviar imagem. Tente novamente.');
          setLocalPosterUri(null);
        } finally {
          setUploadingPoster(false);
        }
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o seletor de imagem.');
    }
  };

  // ── Sessões ───────────────────────────────────────────
  const addSession = () => {
    if (sessions.length >= 10) { Alert.alert('Máximo de 10 sessões por anúncio.'); return; }
    setSessions(prev => [...prev, { ...EMPTY_SESSION, room_id: roomId }]);
  };

  const removeSession = (index: number) => {
    if (sessions.length === 1) { Alert.alert('É necessário pelo menos uma sessão.'); return; }
    setSessions(prev => prev.filter((_, i) => i !== index));
  };

  const updateSession = (index: number, field: keyof Session, value: any) => {
    setSessions(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  // ── Validação ─────────────────────────────────────────
  const validate = (): string | null => {
    if (!title.trim())            return 'O título do filme é obrigatório.';
    if (!description.trim())      return 'A sinopse é obrigatória.';
    if (!categoryId)              return 'Selecione uma categoria.';
    if (!selectedRating)          return 'Selecione a classificação indicativa.';
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0)
                                  return 'Informe um preço válido (ex: 25.00).';
    if (!displayUntil)            return 'Informe até quando o filme ficará em cartaz.';

    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      if (!s.date)    return `Sessão ${i + 1}: Data obrigatória (AAAA-MM-DD).`;
      if (!s.time)    return `Sessão ${i + 1}: Horário obrigatório (HH:MM).`;
      if (!s.room_id) return `Sessão ${i + 1}: Selecione uma sala.`;
    }

    return null;
  };

  // ── Salvar ────────────────────────────────────────────
  const handleSave = async () => {
    if (uploadingPoster) { Alert.alert('Aguarde', 'Upload do poster em andamento...'); return; }

    const error = validate();
    if (error) { Alert.alert('⚠️ Campo inválido', error); return; }

    setSaving(true);
    try {
      const selectedRoom = rooms.find(r => r.id === roomId);
      const firstSession = sessions[0];

      const payload = {
        title:            title.trim(),
        description:      description.trim(),
        genre:            genre.trim() || null,
        duration_minutes: duration ? parseInt(duration) : null,
        director:         director.trim() || null,
        cast_info:        castInfo.trim() || null,
        rating:           selectedRating,
        poster_url:       posterUrl || null,
        trailer_url:      trailerUrl || null,
        session_date:     firstSession.date,
        session_time:     firstSession.time,
        room:             selectedRoom?.name || null,
        room_id:          roomId,
        category_id:      categoryId,
        price:            parseFloat(price),
        premiere_date:    premiereDate || null,
        on_display_until: displayUntil,
        status,
      };

      let movieId: number;
      if (isEditing) {
        await updateMovie(editingMovie.id, payload);
        movieId = editingMovie.id;
      } else {
        const res = await createMovie(payload);
        movieId = res.data.id;
      }

      // Cria sessões extras (da 2ª em diante, ou todas se for novo)
      const sessionsToCreate = isEditing ? sessions : sessions.slice(1);
      for (const s of sessionsToCreate) {
        await createMovieSession({
          movie_id:        movieId,
          room_id:         s.room_id,
          session_date:    s.date,
          session_time:    s.time,
          available_seats: parseInt(s.seats) || 100,
          language:        s.language,
        });
      }

      Alert.alert(
        '🎬 Sucesso!',
        isEditing ? 'Filme atualizado com sucesso!' : 'Filme publicado! Ele já aparece na tela inicial.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.message || 'Não foi possível salvar o filme.');
    } finally {
      setSaving(false);
    }
  };

  // ── Preview do poster ─────────────────────────────────
  const posterSource = localPosterUri
    ? { uri: localPosterUri }
    : posterUrl
      ? { uri: posterUrl }
      : null;

  if (loadingOptions) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando opções...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>

        {/* ── Header ─────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? '✏️ Editar Filme' : '🎬 Anunciar Filme'}</Text>
          <TouchableOpacity onPress={() => setPreviewMode(p => !p)} style={styles.previewBtn}>
            <Text style={styles.previewBtnText}>{previewMode ? 'Editar' : '👁 Preview'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ─────────── PREVIEW MODE ─────────── */}
          {previewMode ? (
            <View style={styles.previewCard}>
              <Text style={styles.previewHint}>👇 Assim vai aparecer para os clientes</Text>
              <View style={styles.previewInner}>
                {posterSource ? (
                  <Image source={posterSource} style={styles.previewPoster} resizeMode="cover" />
                ) : (
                  <View style={styles.previewPosterEmpty}>
                    <Text style={{ fontSize: 40 }}>🎬</Text>
                    <Text style={styles.previewPosterEmptyText}>Sem poster</Text>
                  </View>
                )}
                <View style={styles.previewBody}>
                  <Text style={styles.previewTitle}>{title || 'Título do Filme'}</Text>
                  {genre ? <Text style={styles.previewGenre}>{genre}</Text> : null}
                  <View style={styles.previewRow}>
                    {selectedRating ? <View style={styles.previewBadge}><Text style={styles.previewBadgeText}>{selectedRating}</Text></View> : null}
                    {duration ? <Text style={styles.previewMeta}>⏱ {duration} min</Text> : null}
                  </View>
                  {price ? <Text style={styles.previewPrice}>R$ {parseFloat(price || '0').toFixed(2)}</Text> : null}
                  {displayUntil ? <Text style={styles.previewUntil}>📅 Em cartaz até {displayUntil}</Text> : null}
                  {sessions.length > 0 && sessions[0].date ? (
                    <Text style={styles.previewSession}>🕐 {sessions[0].date} às {sessions[0].time} ({sessions[0].language})</Text>
                  ) : null}
                  {description ? (
                    <Text style={styles.previewDescription} numberOfLines={4}>{description}</Text>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity style={styles.previewEditBtn} onPress={() => setPreviewMode(false)}>
                <Text style={styles.previewEditBtnText}>✏️ Voltar a editar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* ─── 1. POSTER ─────────────────────────── */}
              <Section title="📸 Poster do Filme">
                <TouchableOpacity style={styles.posterPicker} onPress={handlePickPoster} disabled={uploadingPoster} activeOpacity={0.8}>
                  {uploadingPoster ? (
                    <View style={styles.posterCenter}>
                      <ActivityIndicator color={COLORS.primary} size="large" />
                      <Text style={styles.posterHint}>Enviando imagem...</Text>
                    </View>
                  ) : posterSource ? (
                    <>
                      <Image source={posterSource} style={styles.posterPreview} resizeMode="cover" />
                      <View style={styles.posterOverlay}>
                        <Text style={styles.posterOverlayText}>📷 Trocar poster</Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.posterCenter}>
                      <Text style={{ fontSize: 48 }}>🎞️</Text>
                      <Text style={styles.posterLabel}>Toque para adicionar o poster</Text>
                      <Text style={styles.posterHint}>Câmera ou galeria • Proporção 2:3</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.orText}>— ou cole uma URL —</Text>
                <TextInput
                  style={styles.urlInput}
                  placeholder="https://imagem.com/poster.jpg"
                  placeholderTextColor={COLORS.textMuted}
                  value={posterUrl}
                  onChangeText={v => { setPosterUrl(v); if (v) setLocalPosterUri(null); }}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </Section>

              {/* ─── 2. INFORMAÇÕES BÁSICAS ─────────────── */}
              <Section title="🎬 Informações do Filme">
                <Field label="Título *" value={title} onChangeText={setTitle} placeholder="Ex: Duna: Parte Três" />
                <Field label="Sinopse *" value={description} onChangeText={setDescription} placeholder="Conte do que trata o filme..." multiline />
                <Field label="Gênero" value={genre} onChangeText={setGenre} placeholder="Ex: Ficção Científica / Ação" />
                <Field label="Duração (minutos)" value={duration} onChangeText={setDuration} placeholder="Ex: 150" keyboard="numeric" />
                <Field label="Diretor" value={director} onChangeText={setDirector} placeholder="Ex: Denis Villeneuve" />
                <Field label="Elenco" value={castInfo} onChangeText={setCastInfo} placeholder="Ex: Timothée Chalamet, Zendaya..." multiline />
                <Field label="URL do Trailer (YouTube)" value={trailerUrl} onChangeText={setTrailerUrl} placeholder="https://youtube.com/watch?v=..." keyboard="url" />
              </Section>

              {/* ─── 3. CATEGORIA ───────────────────────── */}
              <Section title="📂 Categoria">
                <View style={styles.chipGrid}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.chip, categoryId === cat.id && styles.chipActive]}
                      onPress={() => setCategoryId(cat.id)}
                    >
                      <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                      <Text style={[styles.chipText, categoryId === cat.id && styles.chipTextActive]}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Section>

              {/* ─── 4. CLASSIFICAÇÃO ───────────────────── */}
              <Section title="🔞 Classificação Indicativa *">
                <View style={styles.ratingRow}>
                  {RATINGS.map(r => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.ratingBtn, selectedRating === r && styles.ratingBtnActive]}
                      onPress={() => setSelectedRating(r)}
                    >
                      <Text style={[styles.ratingText, selectedRating === r && styles.ratingTextActive]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Section>

              {/* ─── 5. STATUS ──────────────────────────── */}
              <Section title="📡 Status de Exibição">
                {STATUSES.map(s => (
                  <TouchableOpacity
                    key={s.value}
                    style={[styles.statusOption, status === s.value && { borderColor: s.color, backgroundColor: s.color + '22' }]}
                    onPress={() => setStatus(s.value)}
                  >
                    <View style={[styles.statusDot, { backgroundColor: status === s.value ? s.color : '#333' }]} />
                    <Text style={[styles.statusOptionText, status === s.value && { color: s.color }]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </Section>

              {/* ─── 6. INGRESSO E DATAS ────────────────── */}
              <Section title="🎟 Ingresso e Período">
                <Field
                  label="Preço do Ingresso (R$) *"
                  value={price}
                  onChangeText={setPrice}
                  placeholder="Ex: 28.00"
                  keyboard="decimal-pad"
                  hint="Valor cobrado por sessão"
                />
                <Field
                  label="Data de Estreia"
                  value={premiereDate}
                  onChangeText={setPremiereDate}
                  placeholder="AAAA-MM-DD"
                  hint="Opcional — quando o filme estreia"
                />
                <Field
                  label="Em cartaz até *"
                  value={displayUntil}
                  onChangeText={setDisplayUntil}
                  placeholder="AAAA-MM-DD"
                  hint="O sistema avisa o cliente quando estiver perto do fim"
                />
              </Section>

              {/* ─── 7. SESSÕES ─────────────────────────── */}
              <Section title={`🕐 Sessões (${sessions.length})`}>
                <Text style={styles.sessionHint}>
                  Adicione quantas sessões quiser. Cada uma pode ter uma sala, horário e idioma diferentes.
                </Text>

                {sessions.map((session, index) => (
                  <View key={index} style={styles.sessionCard}>
                    <View style={styles.sessionCardHeader}>
                      <Text style={styles.sessionCardTitle}>Sessão {index + 1}</Text>
                      {sessions.length > 1 && (
                        <TouchableOpacity onPress={() => removeSession(index)} style={styles.sessionRemoveBtn}>
                          <Text style={styles.sessionRemoveText}>✕ Remover</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Data */}
                    <Text style={fieldStyles.label}>Data *</Text>
                    <TextInput
                      style={fieldStyles.input}
                      value={session.date}
                      onChangeText={v => updateSession(index, 'date', v)}
                      placeholder="AAAA-MM-DD (ex: 2025-07-15)"
                      placeholderTextColor={COLORS.textMuted}
                    />

                    {/* Horário */}
                    <Text style={[fieldStyles.label, { marginTop: SPACING.sm }]}>Horário *</Text>
                    <TextInput
                      style={fieldStyles.input}
                      value={session.time}
                      onChangeText={v => updateSession(index, 'time', v)}
                      placeholder="HH:MM (ex: 19:30)"
                      placeholderTextColor={COLORS.textMuted}
                    />

                    {/* Sala */}
                    <Text style={[fieldStyles.label, { marginTop: SPACING.sm }]}>Sala *</Text>
                    {rooms.length === 0 ? (
                      <Text style={styles.noRoomsText}>⚠️ Nenhuma sala cadastrada no sistema.</Text>
                    ) : (
                      <View style={styles.chipGrid}>
                        {rooms.map(r => (
                          <TouchableOpacity
                            key={r.id}
                            style={[styles.chip, session.room_id === r.id && styles.chipActive]}
                            onPress={() => updateSession(index, 'room_id', r.id)}
                          >
                            <Text style={[styles.chipText, session.room_id === r.id && styles.chipTextActive]}>
                              {r.name}
                            </Text>
                            <Text style={styles.chipSubtext}>{r.capacity} lugares</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Idioma */}
                    <Text style={[fieldStyles.label, { marginTop: SPACING.sm }]}>Idioma</Text>
                    <View style={styles.langRow}>
                      {LANGUAGES.map(lang => (
                        <TouchableOpacity
                          key={lang}
                          style={[styles.langBtn, session.language === lang && styles.langBtnActive]}
                          onPress={() => updateSession(index, 'language', lang)}
                        >
                          <Text style={[styles.langText, session.language === lang && styles.langTextActive]}>
                            {lang.charAt(0).toUpperCase() + lang.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Lugares disponíveis */}
                    <Text style={[fieldStyles.label, { marginTop: SPACING.sm }]}>Lugares disponíveis</Text>
                    <TextInput
                      style={fieldStyles.input}
                      value={session.seats}
                      onChangeText={v => updateSession(index, 'seats', v)}
                      placeholder="100"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="number-pad"
                    />
                  </View>
                ))}

                <TouchableOpacity style={styles.addSessionBtn} onPress={addSession}>
                  <Text style={styles.addSessionText}>＋ Adicionar outra sessão</Text>
                </TouchableOpacity>
              </Section>

              {/* ─── RESUMO ANTES DE PUBLICAR ───────────── */}
              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>📋 Resumo do Anúncio</Text>
                <Text style={styles.summaryItem}>🎬 <Text style={styles.summaryValue}>{title || '(sem título)'}</Text></Text>
                <Text style={styles.summaryItem}>📂 <Text style={styles.summaryValue}>{categories.find(c => c.id === categoryId)?.name || '(sem categoria)'}</Text></Text>
                <Text style={styles.summaryItem}>🔞 <Text style={styles.summaryValue}>{selectedRating || '(sem classificação)'}</Text></Text>
                <Text style={styles.summaryItem}>💰 <Text style={styles.summaryValue}>{price ? `R$ ${parseFloat(price).toFixed(2)}` : '(sem preço)'}</Text></Text>
                <Text style={styles.summaryItem}>📅 <Text style={styles.summaryValue}>Em cartaz até: {displayUntil || '(indefinido)'}</Text></Text>
                <Text style={styles.summaryItem}>🕐 <Text style={styles.summaryValue}>{sessions.length} sessão(ões) cadastrada(s)</Text></Text>
              </View>

              {/* ─── BOTÃO PUBLICAR ─────────────────────── */}
              <TouchableOpacity
                style={[styles.publishBtn, (saving || uploadingPoster) && styles.publishBtnDisabled]}
                onPress={handleSave}
                disabled={saving || uploadingPoster}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.publishBtnText}>{isEditing ? '💾 Salvar Alterações' : '🚀 Publicar Filme'}</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const sectionStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    paddingBottom: SPACING.sm,
  },
});

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: SPACING.md },
  label:   { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, fontWeight: '600' },
  hint:    { fontSize: 11, color: COLORS.textMuted, marginBottom: 6 },
  input:   {
    backgroundColor: '#111',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  multiline: { height: 100, textAlignVertical: 'top' },
});

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.md },
  scroll:     { padding: SPACING.md, paddingBottom: SPACING.xxl },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, paddingTop: SPACING.xxl, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  backBtn:     { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backIcon:    { fontSize: 24, color: COLORS.text },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  previewBtn:  { backgroundColor: COLORS.surfaceLight, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.md },
  previewBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: 'bold' },

  // Poster
  posterPicker: { backgroundColor: '#0d0d0d', borderRadius: RADIUS.md, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.primary + '55', minHeight: 200, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: SPACING.sm },
  posterPreview: { width: '100%', height: 220 },
  posterOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', paddingVertical: SPACING.sm, alignItems: 'center' },
  posterOverlayText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  posterCenter: { alignItems: 'center', paddingVertical: SPACING.xl },
  posterLabel:  { color: COLORS.text, fontSize: 15, fontWeight: '600', marginTop: SPACING.sm },
  posterHint:   { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  orText:       { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginVertical: SPACING.sm },
  urlInput:     { backgroundColor: '#111', borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, color: COLORS.text, fontSize: 13, borderWidth: 1, borderColor: '#333' },

  // Chips (categoria / sala)
  chipGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1a1a1a', borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 8, borderWidth: 1, borderColor: '#333' },
  chipActive: { backgroundColor: COLORS.primary + '33', borderColor: COLORS.primary },
  chipEmoji:  { fontSize: 14 },
  chipText:   { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: COLORS.primary },
  chipSubtext: { color: COLORS.textMuted, fontSize: 10, marginLeft: 2 },

  // Rating
  ratingRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ratingBtn:       { width: 56, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#333' },
  ratingBtnActive: { backgroundColor: '#B71C1C33', borderColor: '#EF9A9A' },
  ratingText:      { color: COLORS.textSecondary, fontSize: 13, fontWeight: 'bold' },
  ratingTextActive: { color: '#EF9A9A' },

  // Status
  statusOption: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, backgroundColor: '#111', borderRadius: RADIUS.md, marginBottom: 8, borderWidth: 1.5, borderColor: '#333' },
  statusDot:    { width: 12, height: 12, borderRadius: 6 },
  statusOptionText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },

  // Sessões
  sessionHint:   { color: COLORS.textMuted, fontSize: 12, marginBottom: SPACING.md },
  sessionCard:   { backgroundColor: '#0d0d0d', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#2a2a2a' },
  sessionCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sessionCardTitle: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },
  sessionRemoveBtn: { backgroundColor: '#3B0000', borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 4 },
  sessionRemoveText: { color: '#FF6B6B', fontSize: 12, fontWeight: 'bold' },
  langRow:    { flexDirection: 'row', gap: 8, marginTop: 4 },
  langBtn:    { flex: 1, paddingVertical: 10, backgroundColor: '#1a1a1a', borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  langBtnActive: { backgroundColor: COLORS.primary + '33', borderColor: COLORS.primary },
  langText:   { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  langTextActive: { color: COLORS.primary },
  noRoomsText: { color: COLORS.warning, fontSize: 13, fontStyle: 'italic' },
  addSessionBtn: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: COLORS.primary + '77', borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  addSessionText: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },

  // Resumo
  summaryBox:   { backgroundColor: '#0d1117', borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#2a2a2a' },
  summaryTitle: { color: COLORS.text, fontSize: 15, fontWeight: 'bold', marginBottom: SPACING.md },
  summaryItem:  { color: COLORS.textSecondary, fontSize: 13, marginBottom: 6 },
  summaryValue: { color: COLORS.text, fontWeight: '600' },

  // Botões de ação
  publishBtn:  { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 16, alignItems: 'center', marginBottom: SPACING.sm, ...SHADOW.medium },
  publishBtnDisabled: { opacity: 0.6 },
  publishBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  cancelBtn:  { paddingVertical: 12, alignItems: 'center' },
  cancelText: { color: COLORS.textMuted, fontSize: 14 },

  // Preview
  previewCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  previewHint: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginBottom: SPACING.md },
  previewInner: { flexDirection: 'row', gap: SPACING.md },
  previewPoster: { width: 100, height: 150, borderRadius: RADIUS.md },
  previewPosterEmpty: { width: 100, height: 150, backgroundColor: '#111', borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  previewPosterEmptyText: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  previewBody: { flex: 1 },
  previewTitle: { color: COLORS.text, fontSize: 17, fontWeight: 'bold', marginBottom: 4 },
  previewGenre: { color: COLORS.primary, fontSize: 12, marginBottom: 6 },
  previewRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  previewBadge: { backgroundColor: '#B71C1C33', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  previewBadgeText: { color: '#EF9A9A', fontSize: 11, fontWeight: 'bold' },
  previewMeta: { color: COLORS.textSecondary, fontSize: 12 },
  previewPrice: { color: COLORS.gold, fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  previewUntil: { color: COLORS.textMuted, fontSize: 12, marginBottom: 4 },
  previewSession: { color: COLORS.success, fontSize: 12, marginBottom: 8 },
  previewDescription: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18 },
  previewEditBtn: { marginTop: SPACING.md, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, paddingVertical: 10, alignItems: 'center' },
  previewEditBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },
});
