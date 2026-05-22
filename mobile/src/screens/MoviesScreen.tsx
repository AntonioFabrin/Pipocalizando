import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Modal, ScrollView,
  TextInput, Alert, Image, Animated, GestureResponderEvent, LayoutChangeEvent,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getMovies, createMovie, updateMovie, deleteMovie, uploadImage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOW } from '../types/theme';

const POSTER_PLACEHOLDER = require('../../assets/Image-not-found.png');

const isValidPosterUrl = (url?: string): boolean => {
  return !!(url && typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://')));
};

interface Movie {
  id: number;
  title: string;
  description: string;
  genre: string;
  duration_minutes: number;
  director: string;
  cast_info: string;
  rating: string;
  poster_url: string;
  session_date: string;
  session_time: string;
  room: string;
  price: number;
  premiere_date: string;
  on_display_until: string;
  status: string;
  is_active: number;
}

const RATING_COLOR: Record<string, string> = {
  'Livre': '#00C853', '10+': '#64B5F6', '12+': '#FFB300',
  '14+': '#FF7043', '16+': '#E53935', '18+': '#B71C1C',
};

const emptyForm = {
  title: '', description: '', genre: '', duration_minutes: '',
  director: '', cast_info: '', rating: '', poster_url: '',
  session_date: '', session_time: '', room: '', price: '',
  premiere_date: '', on_display_until: '', status: 'now_playing',
};

interface MovieCardProps {
  item: Movie;
  soon: boolean;
  leftDays: number | null;
  untilDays: number | null;
  isUrgent: boolean;
  isSeller: boolean;
  formatDate: (dateStr: string) => string;
  formatTime: (timeStr: string) => string;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function MovieCard({
  item,
  soon,
  leftDays,
  untilDays,
  isUrgent,
  isSeller,
  formatDate,
  formatTime,
  onPress,
  onEdit,
  onDelete,
}: MovieCardProps) {
  const tilt = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const cardSize = useRef({ width: 1, height: 1 });

  const rotateX = tilt.y.interpolate({
    inputRange: [-0.5, 0.5],
    outputRange: ['8deg', '-8deg'],
  });
  const rotateY = tilt.x.interpolate({
    inputRange: [-0.5, 0.5],
    outputRange: ['-8deg', '8deg'],
  });
  const glowOpacity = scale.interpolate({
    inputRange: [1, 1.02],
    outputRange: [0, 1],
  });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    cardSize.current = { width: Math.max(width, 1), height: Math.max(height, 1) };
  };

  const updateTilt = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    const { width, height } = cardSize.current;

    Animated.spring(tilt, {
      toValue: {
        x: locationX / width - 0.5,
        y: locationY / height - 0.5,
      },
      stiffness: 150,
      damping: 20,
      mass: 1,
      useNativeDriver: true,
    }).start();
  };

  const resetTilt = () => {
    Animated.parallel([
      Animated.spring(tilt, {
        toValue: { x: 0, y: 0 },
        stiffness: 150,
        damping: 20,
        mass: 1,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        stiffness: 150,
        damping: 20,
        mass: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const pressIn = (event: GestureResponderEvent) => {
    updateTilt(event);
    Animated.spring(scale, {
      toValue: 1.02,
      stiffness: 150,
      damping: 20,
      mass: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      onLayout={handleLayout}
      onTouchStart={pressIn}
      onTouchMove={updateTilt}
      onTouchEnd={resetTilt}
      onTouchCancel={resetTilt}
      style={[
        styles.cardTilt,
        {
          transform: [
            { perspective: 900 },
            { rotateX },
            { rotateY },
            { scale },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.card, isUrgent && !soon && styles.cardUrgent]}
        onPress={onPress}
        activeOpacity={0.9}
      >
<View style={styles.posterContainer}>
          <Image
            source={isValidPosterUrl(item.poster_url) ? { uri: item.poster_url } : POSTER_PLACEHOLDER}
            style={styles.posterImage}
            resizeMode="cover"
          />
          {item.rating ? (
            <View style={[styles.ratingBadge, { backgroundColor: RATING_COLOR[item.rating] || '#666' }]}>
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          ) : null}
          {soon && (
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>EM BREVE</Text>
            </View>
          )}
          {!soon && isUrgent && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>
                {leftDays === 0 ? 'ÚLTIMO DIA' : `${leftDays}d`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          {item.genre ? <Text style={styles.cardGenre}>{item.genre}</Text> : null}

          {item.session_date ? (
            <View style={styles.sessionRow}>
              <Text style={styles.sessionDate}>📅 {formatDate(item.session_date)}</Text>
              {item.session_time ? (
                <View style={styles.sessionTimeBadge}>
                  <Text style={styles.sessionTime}>{formatTime(item.session_time)}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.infoTagsRow}>
            {!soon && leftDays !== null && (
              <View style={[styles.infoTag, isUrgent && { backgroundColor: COLORS.primary + '33' }]}>
                <Text style={[styles.infoTagText, isUrgent && { color: COLORS.primary }]}>
                  ⏳ {leftDays === 0 ? 'Último dia!' : `${leftDays}d restantes`}
                </Text>
              </View>
            )}
            {soon && untilDays !== null && (
              <View style={[styles.infoTag, { backgroundColor: '#CE93D822' }]}>
                <Text style={[styles.infoTagText, { color: '#CE93D8' }]}>🌟 Em {untilDays}d</Text>
              </View>
            )}
          </View>

          <View style={styles.cardFooter}>
            {item.room ? <Text style={styles.roomText}>🏛 {item.room}</Text> : null}
            {item.duration_minutes ? <Text style={styles.durationText}>⏱ {item.duration_minutes}min</Text> : null}
          </View>

          <TouchableOpacity style={styles.selectButton} onPress={onPress}>
            <Text style={styles.selectButtonText}>
              {soon ? '🌟 Ver detalhes' : '🎟 Ver sessões'}
            </Text>
          </TouchableOpacity>

          {isSeller && (
            <View style={styles.sellerQuickActions}>
              <TouchableOpacity style={styles.quickEditBtn} onPress={onEdit}>
                <Text style={styles.quickEditText}>✏️ Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickDeleteBtn} onPress={onDelete}>
                <Text style={styles.quickDeleteText}>🗑</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <Animated.View style={[styles.cardGlow, { opacity: glowOpacity }]} />
    </Animated.View>
  );
}

export default function MoviesScreen({ navigation }: any) {
  const { canManageCatalog } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Movie | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'now' | 'soon'>('now');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [localPosterUri, setLocalPosterUri] = useState<string | null>(null);

  const nowPlaying = (m: Movie) => m.status === 'now_playing' || Boolean(!m.status && m.session_date && new Date(m.session_date) <= new Date());
  const comingSoon = (m: Movie) => m.status === 'coming_soon' || Boolean(!m.status && m.session_date && new Date(m.session_date) > new Date());

  const daysLeft = (d: string) => d ? Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)) : null;
  const daysUntilPremiere = (d: string) => d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null;

  const fetchMovies = async () => {
    try {
      const res = await getMovies();
      setMovies(res.data);
    } catch (e) {
      console.log('Erro ao buscar filmes:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchMovies(); }, []);

  // ── Picker de imagem ─────────────────────────────────────
  const handlePickImage = () => {
    Alert.alert(
      '📸 Adicionar Poster',
      'Escolha a origem da imagem:',
      [
        { text: '📷 Câmera', onPress: () => openPicker('camera') },
        { text: '🖼 Galeria', onPress: () => openPicker('gallery') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const openPicker = async (source: 'camera' | 'gallery') => {
    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão negada', 'Permita o acesso à câmera nas configurações.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [2, 3],
          quality: 0.85,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão negada', 'Permita o acesso à galeria nas configurações.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [2, 3],
          quality: 0.85,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setLocalPosterUri(asset.uri);
        setUploadingImage(true);

        try {
          const url = await uploadImage(asset.uri, `poster-${Date.now()}.jpg`);
          setForm(f => ({ ...f, poster_url: url }));
          Alert.alert('✅ Sucesso', 'Imagem enviada com sucesso!');
        } catch (err: any) {
          Alert.alert('Erro no upload', err?.response?.data?.message || 'Falha ao enviar a imagem.');
          setLocalPosterUri(null);
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível abrir o seletor de imagem.');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setLocalPosterUri(null);
    setModalVisible(true);
  };

  const openEdit = (movie: Movie) => {
    setEditing(movie);
    setForm({
      title: movie.title,
      description: movie.description || '',
      genre: movie.genre || '',
      duration_minutes: movie.duration_minutes?.toString() || '',
      director: movie.director || '',
      cast_info: movie.cast_info || '',
      rating: movie.rating || '',
      poster_url: movie.poster_url || '',
      session_date: movie.session_date?.slice(0, 10) || '',
      session_time: movie.session_time || '',
      room: movie.room || '',
      price: movie.price?.toString() || '0',
      premiere_date: movie.premiere_date?.slice(0, 10) || '',
      on_display_until: movie.on_display_until?.slice(0, 10) || '',
      status: movie.status || 'now_playing',
    });
    setLocalPosterUri(null);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.title) {
      Alert.alert('Atenção', 'Título é obrigatório.');
      return;
    }
    if (uploadingImage) {
      Alert.alert('Aguarde', 'O upload da imagem ainda está em andamento...');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
        price: form.price ? parseFloat(form.price) : 0,
      };
      if (editing) {
        await updateMovie(editing.id, payload);
      } else {
        await createMovie(payload);
      }
      setModalVisible(false);
      fetchMovies();
      Alert.alert('✅ Sucesso', editing ? 'Filme atualizado!' : 'Filme criado com sucesso!');
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (movie: Movie) => {
    Alert.alert(
      'Remover filme',
      `Deseja remover "${movie.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover', style: 'destructive',
          onPress: async () => {
            try {
              await deleteMovie(movie.id);
              fetchMovies();
            } catch {
              Alert.alert('Erro', 'Não foi possível remover.');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
  };

  const posterSource = localPosterUri
    ? { uri: localPosterUri }
    : form.poster_url
      ? { uri: form.poster_url }
      : null;

  const nowMovies = movies.filter(m => nowPlaying(m));
  const soonMovies = movies.filter(m => comingSoon(m));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>🎬</Text>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.md }} />
        <Text style={styles.loadingText}>Carregando sessões...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🎬 Sessões</Text>
          <Text style={styles.headerSub}>Escolha seu filme</Text>
        </View>
        {canManageCatalog && (
          <TouchableOpacity style={styles.addButton} onPress={openCreate}>
            <Text style={styles.addButtonText}>+ Novo Filme</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Luzes decorativas */}
      <View style={styles.lightsRow}>
        {[...Array(12)].map((_, i) => (
          <View key={i} style={[styles.light, i % 2 === 0 && styles.lightGold]} />
        ))}
      </View>

      {/* Abas */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'now' && styles.tabBtnActive]}
          onPress={() => setTab('now')}
        >
          <Text style={[styles.tabLabel, tab === 'now' && styles.tabLabelActive]}>
            🎬 Em Cartaz ({nowMovies.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'soon' && styles.tabBtnActive]}
          onPress={() => setTab('soon')}
        >
          <Text style={[styles.tabLabel, tab === 'soon' && styles.tabLabelActive]}>
            🌟 Em Breve ({soonMovies.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de filmes */}
      <FlatList
        data={tab === 'now' ? nowMovies : soonMovies}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchMovies(); }}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎭</Text>
            <Text style={styles.emptyText}>
              {tab === 'now' ? 'Nenhum filme em cartaz.' : 'Nenhuma estreia em breve.'}
            </Text>
            {canManageCatalog && <Text style={styles.emptyHint}>Toque em "+ Novo Filme" para adicionar.</Text>}
          </View>
        }
        renderItem={({ item }) => {
          const soon = comingSoon(item);
          const leftDays = daysLeft(item.on_display_until);
          const untilDays = daysUntilPremiere(item.session_date);
          const isUrgent = leftDays !== null && leftDays <= 7;

          return (
            <MovieCard
              item={item}
              soon={soon}
              leftDays={leftDays}
              untilDays={untilDays}
              isUrgent={isUrgent}
              isSeller={canManageCatalog}
              formatDate={formatDate}
              formatTime={formatTime}
              onPress={() => navigation.navigate('MovieDetail', { movieId: item.id })}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          );
        }}
      />

      {/* ── Modal criar/editar filme ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => !saving && setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formModal}>
            <Text style={styles.formTitle}>{editing ? '✏️ Editar Filme' : '🎬 Novo Filme'}</Text>
            <Text style={styles.formSubtitle}>
              {editing ? 'Atualize as informações do filme' : 'Preencha os dados e o filme terá sua própria página automaticamente'}
            </Text>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

              {/* ── Seção de Poster ── */}
              <View style={styles.posterSection}>
                <Text style={styles.posterSectionTitle}>🖼 Poster do Filme</Text>

                <TouchableOpacity
                  style={styles.posterPicker}
                  onPress={handlePickImage}
                  disabled={uploadingImage || saving}
                  activeOpacity={0.75}
                >
                  {uploadingImage ? (
                    <View style={styles.posterPickerInner}>
                      <ActivityIndicator color={COLORS.primary} size="large" />
                      <Text style={styles.posterUploadingText}>Enviando imagem...</Text>
                    </View>
                  ) : posterSource ? (
                    <View style={styles.posterPreviewWrapper}>
                      <Image source={posterSource} style={styles.posterPreview} resizeMode="cover" />
                      <View style={styles.posterChangeOverlay}>
                        <Text style={styles.posterChangeText}>📷 Trocar</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.posterPickerInner}>
                      <Text style={styles.posterPickerIcon}>📷</Text>
                      <Text style={styles.posterPickerText}>Toque para adicionar poster</Text>
                      <Text style={styles.posterPickerHint}>Câmera ou galeria • Máx 5MB</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.posterUrlRow}>
                  <Text style={styles.posterUrlLabel}>ou cole uma URL:</Text>
                  <TextInput
                    style={styles.posterUrlInput}
                    placeholder="https://..."
                    placeholderTextColor={COLORS.textMuted}
                    value={form.poster_url}
                    onChangeText={v => {
                      setForm(f => ({ ...f, poster_url: v }));
                      if (v) setLocalPosterUri(null);
                    }}
                    keyboardType="url"
                    editable={!saving && !uploadingImage}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* ── Campos principais ── */}
              {([
                { label: 'Título *', key: 'title', placeholder: 'Ex: Duna: Parte Dois' },
                { label: 'Descrição / Sinopse', key: 'description', placeholder: 'Sinopse do filme', multi: true },
                { label: 'Gênero', key: 'genre', placeholder: 'Ex: Ficção Científica' },
                { label: 'Duração (min)', key: 'duration_minutes', placeholder: 'Ex: 150', keyboard: 'numeric' },
                { label: 'Diretor', key: 'director', placeholder: 'Ex: Denis Villeneuve' },
                { label: 'Elenco', key: 'cast_info', placeholder: 'Ex: Timothée Chalamet, Zendaya', multi: true },
                { label: 'Classificação Indicativa', key: 'rating', placeholder: 'Livre, 10+, 12+, 14+, 16+, 18+' },
                { label: 'Data da Sessão Principal', key: 'session_date', placeholder: 'AAAA-MM-DD' },
                { label: 'Horário da Sessão', key: 'session_time', placeholder: 'HH:MM' },
                { label: 'Sala', key: 'room', placeholder: 'Ex: Sala 1, Sala VIP' },
                { label: 'Preço do Ingresso (R$)', key: 'price', placeholder: '0.00', keyboard: 'numeric' },
                { label: 'Data de Estreia', key: 'premiere_date', placeholder: 'AAAA-MM-DD' },
                { label: 'Em cartaz até', key: 'on_display_until', placeholder: 'AAAA-MM-DD' },
              ] as const).map(field => (
                <View key={field.key} style={styles.formField}>
                  <Text style={styles.formLabel}>{field.label}</Text>
                  <TextInput
                    style={[styles.formInput, (field as any).multi ? styles.formInputMulti : null]}
                    placeholder={field.placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    value={(form as any)[field.key]}
                    onChangeText={v => setForm(f => ({ ...f, [field.key]: v }))}
                    keyboardType={(field as any).keyboard || 'default'}
                    multiline={(field as any).multi}
                    numberOfLines={(field as any).multi ? 3 : 1}
                    editable={!saving}
                  />
                </View>
              ))}

              {/* Status */}
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Status do Filme</Text>
                <View style={styles.statusRow}>
                  {[
                    { value: 'coming_soon', label: '🌟 Em Breve' },
                    { value: 'now_playing', label: '🎬 Em Cartaz' },
                    { value: 'ended', label: '📼 Encerrado' },
                  ].map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.statusOption, form.status === opt.value && styles.statusOptionActive]}
                      onPress={() => setForm(f => ({ ...f, status: opt.value }))}
                    >
                      <Text style={[styles.statusOptionText, form.status === opt.value && styles.statusOptionTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ height: SPACING.xl }} />
            </ScrollView>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={saving || uploadingImage}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (saving || uploadingImage) && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving || uploadingImage}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>💾 Salvar Filme</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingEmoji: { fontSize: 60 },
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.sm, fontSize: 15 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.lg, paddingTop: SPACING.xxl, backgroundColor: COLORS.surface,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  addButton: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  lightsRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 6,
    paddingVertical: SPACING.sm, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: '#222',
  },
  light: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  lightGold: { backgroundColor: '#FFD700' },

  tabRow: {
    flexDirection: 'row', marginHorizontal: SPACING.md, marginTop: SPACING.md,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 4, gap: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: RADIUS.sm },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabLabel: { color: COLORS.textMuted, fontSize: 13, fontWeight: '700' },
  tabLabelActive: { color: '#fff' },

  list: { padding: SPACING.md, paddingTop: SPACING.sm },

  // Cards
  cardTilt: {
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    flexDirection: 'row', overflow: 'hidden',
    borderWidth: 1, borderColor: '#2a2a2a', ...SHADOW.small,
  },
  cardGlow: {
    position: 'absolute',
    left: 26,
    right: 26,
    bottom: -1,
    height: 2,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },
  cardUrgent: {
    borderColor: COLORS.primary + '66',
  },
  posterContainer: { width: 105, position: 'relative' },
  posterImage: { width: 105, height: '100%', minHeight: 160 },
  comingSoonBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(206,147,216,0.9)', paddingVertical: 4, alignItems: 'center',
  },
  comingSoonText: { color: '#fff', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  urgentBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.primary + 'dd', paddingVertical: 4, alignItems: 'center',
  },
  urgentText: { color: '#fff', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  ratingBadge: {
    position: 'absolute', top: 8, left: 8,
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
  },
  ratingText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  cardInfo: { flex: 1, padding: SPACING.md },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  cardGenre: { fontSize: 12, color: COLORS.primary, marginTop: 2, fontWeight: '600' },

  sessionRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: SPACING.sm,
  },
  sessionDate: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  sessionTimeBadge: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  sessionTime: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  infoTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  infoTag: { backgroundColor: COLORS.surface, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 },
  infoTagText: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '600' },

  cardFooter: { flexDirection: 'row', gap: SPACING.md, marginTop: 4 },
  roomText: { fontSize: 11, color: COLORS.textMuted },
  durationText: { fontSize: 11, color: COLORS.textMuted },

  selectButton: {
    backgroundColor: COLORS.primary + '18', borderRadius: RADIUS.sm,
    paddingVertical: 8, alignItems: 'center', marginTop: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.primary + '66',
  },
  selectButtonText: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold' },

  // Ações rápidas do vendedor
  sellerQuickActions: {
    flexDirection: 'row', gap: SPACING.sm, marginTop: 6,
  },
  quickEditBtn: {
    flex: 1, backgroundColor: '#1a3a5c22', borderRadius: RADIUS.sm,
    paddingVertical: 6, alignItems: 'center',
    borderWidth: 1, borderColor: '#64B5F633',
  },
  quickEditText: { color: '#64B5F6', fontSize: 11, fontWeight: 'bold' },
  quickDeleteBtn: {
    backgroundColor: '#3a1a1a', borderRadius: RADIUS.sm,
    paddingVertical: 6, paddingHorizontal: 10, alignItems: 'center',
    borderWidth: 1, borderColor: '#FF6B6B33',
  },
  quickDeleteText: { color: '#FF6B6B', fontSize: 11 },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 60 },
  emptyText: { color: COLORS.textSecondary, fontSize: 16, marginTop: SPACING.md },
  emptyHint: { color: COLORS.textMuted, fontSize: 13, marginTop: SPACING.sm },

  // Modal form
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  formModal: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '95%', padding: SPACING.lg, flex: 1,
  },
  formTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  formSubtitle: { fontSize: 12, color: COLORS.textMuted, marginBottom: SPACING.md },

  // Poster section
  posterSection: {
    marginBottom: SPACING.lg, backgroundColor: '#111',
    borderRadius: RADIUS.md, padding: SPACING.md,
    borderWidth: 1, borderColor: '#333',
  },
  posterSectionTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: SPACING.md },
  posterPicker: {
    borderRadius: RADIUS.md, overflow: 'hidden',
    borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.primary + '66',
    backgroundColor: '#0a0a0a', minHeight: 160,
    justifyContent: 'center', alignItems: 'center',
  },
  posterPickerInner: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xl },
  posterPickerIcon: { fontSize: 40, marginBottom: SPACING.sm },
  posterPickerText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  posterPickerHint: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  posterPreviewWrapper: { width: '100%', position: 'relative' },
  posterPreview: { width: '100%', height: 220, borderRadius: RADIUS.md },
  posterChangeOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)', paddingVertical: SPACING.sm,
    alignItems: 'center', borderBottomLeftRadius: RADIUS.md, borderBottomRightRadius: RADIUS.md,
  },
  posterChangeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  posterUploadingText: { color: COLORS.textSecondary, marginTop: SPACING.sm, fontSize: 14 },
  posterUrlRow: { marginTop: SPACING.md },
  posterUrlLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6 },
  posterUrlInput: {
    backgroundColor: '#1a1a1a', borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    color: COLORS.text, fontSize: 13, borderWidth: 1, borderColor: '#333',
  },

  formField: { marginBottom: SPACING.md },
  formLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  formInput: {
    backgroundColor: '#111', borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 12,
    color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: '#333',
  },
  formInputMulti: { height: 80, textAlignVertical: 'top' },

  // Status selector
  statusRow: { flexDirection: 'row', gap: SPACING.sm },
  statusOption: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#333',
    backgroundColor: '#111',
  },
  statusOptionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '22' },
  statusOptionText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  statusOptionTextActive: { color: COLORS.primary },

  formActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  cancelBtn: {
    flex: 1, borderRadius: RADIUS.md, paddingVertical: 13,
    alignItems: 'center', borderWidth: 1, borderColor: '#444',
  },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: 'bold' },
  saveBtn: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingVertical: 13, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
