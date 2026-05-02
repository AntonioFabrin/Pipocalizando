import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Modal, ScrollView, TextInput, Alert, Image
} from 'react-native';
import { getMovies, createMovie, updateMovie, deleteMovie } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOW } from '../types/theme';

const POSTER_PLACEHOLDER = require('../assets/Image-not-found.png');

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
  is_active: number;
}

const GENRE_EMOJI: Record<string, string> = {
  'Ação': '💥', 'Aventura': '🗺️', 'Comédia': '😂', 'Drama': '🎭',
  'Ficção Científica': '🚀', 'Terror': '👻', 'Romance': '❤️',
  'Animação': '🎨', 'Suspense': '🔍', 'Fantasia': '🧙',
  'Ação / Comédia': '💥', 'default': '🎬',
};

const RATING_COLOR: Record<string, string> = {
  'Livre': '#00C853', '10+': '#64B5F6', '12+': '#FFB300',
  '14+': '#FF7043', '16+': '#E53935', '18+': '#B71C1C',
};

const emptyForm = {
  title: '', description: '', genre: '', duration_minutes: '',
  director: '', cast_info: '', rating: '', poster_url: '',
  session_date: '', session_time: '', room: '', price: '',
  premiere_date: '', on_display_until: '',
};

export default function MoviesScreen({ navigation }: any) {
  const { isSeller } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Movie | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [tab, setTab] = useState<'now' | 'soon'>('now');

  const isComingSoon = (m: Movie) => m.session_date && new Date(m.session_date) > new Date();
  const daysInTheaters = (d: string) => d ? Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000)) : null;
  const daysUntilPremiere = (d: string) => d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null;
  const daysLeft = (d: string) => d ? Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)) : null;

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

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
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
    });
    setSelectedMovie(null);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.session_date || !form.session_time) {
      Alert.alert('Atenção', 'Título, data e horário são obrigatórios.');
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
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (movie: Movie) => {
    Alert.alert(
      'Remover sessão',
      `Deseja remover "${movie.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover', style: 'destructive',
          onPress: async () => {
            try {
              await deleteMovie(movie.id);
              setSelectedMovie(null);
              fetchMovies();
            } catch (e: any) {
              Alert.alert('Erro', 'Não foi possível remover.');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
  };

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
        {isSeller && (
          <TouchableOpacity style={styles.addButton} onPress={openCreate}>
            <Text style={styles.addButtonText}>+ Nova</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Luzes decorativas */}
      <View style={styles.lightsRow}>
        {[...Array(12)].map((_, i) => (
          <View key={i} style={[styles.light, i % 2 === 0 && styles.lightGold]} />
        ))}
      </View>

      {/* Abas Em Cartaz / Em Breve */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'now' && styles.tabBtnActive]}
          onPress={() => setTab('now')}
        >
          <Text style={[styles.tabLabel, tab === 'now' && styles.tabLabelActive]}>
            🎬 Em Cartaz ({movies.filter(m => !isComingSoon(m)).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'soon' && styles.tabBtnActive]}
          onPress={() => setTab('soon')}
        >
          <Text style={[styles.tabLabel, tab === 'soon' && styles.tabLabelActive]}>
            🌟 Em Breve ({movies.filter(m => isComingSoon(m)).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de filmes */}
      <FlatList
        data={tab === 'now' ? movies.filter(m => !isComingSoon(m)) : movies.filter(m => isComingSoon(m))}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMovies(); }} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎭</Text>
            <Text style={styles.emptyText}>
              {tab === 'now' ? 'Nenhum filme em cartaz.' : 'Nenhuma estreia em breve.'}
            </Text>
            {isSeller && <Text style={styles.emptyHint}>Toque em "+ Nova" para adicionar.</Text>}
          </View>
        }
        renderItem={({ item }) => {
          const soon = isComingSoon(item);
          const inDays = daysInTheaters(item.premiere_date);
          const untilDays = daysUntilPremiere(item.session_date);
          const leftDays = daysLeft(item.on_display_until);
          return (
            <TouchableOpacity style={styles.card} onPress={() => setSelectedMovie(item)} activeOpacity={0.85}>
              {/* Poster */}
              <View style={styles.posterContainer}>
                <Image
                  source={item.poster_url ? { uri: item.poster_url } : POSTER_PLACEHOLDER}
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
              </View>

              {/* Info */}
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                {item.genre ? <Text style={styles.cardGenre}>{item.genre}</Text> : null}

                <View style={styles.sessionRow}>
                  <Text style={styles.sessionDate}>📅 {formatDate(item.session_date)}</Text>
                  <View style={styles.sessionTimeBadge}>
                    <Text style={styles.sessionTime}>{formatTime(item.session_time)}</Text>
                  </View>
                </View>

                {/* Estreia / Tempo em cartaz */}
                <View style={styles.infoTagsRow}>
                  {!soon && inDays !== null && (
                    <View style={styles.infoTag}>
                      <Text style={styles.infoTagText}>🎉 {inDays === 0 ? 'Estreia hoje' : `${inDays}d em cartaz`}</Text>
                    </View>
                  )}
                  {!soon && leftDays !== null && (
                    <View style={[styles.infoTag, leftDays <= 7 && { backgroundColor: COLORS.primary + '33' }]}>
                      <Text style={[styles.infoTagText, leftDays <= 7 && { color: COLORS.primary }]}>
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

                {!soon && (
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => navigation.navigate('Cardapio')}
                  >
                    <Text style={styles.selectButtonText}>🍿 Ver cardápio</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Modal detalhe do filme */}
      <Modal visible={!!selectedMovie} animationType="slide" transparent onRequestClose={() => setSelectedMovie(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            <ScrollView>
              {selectedMovie && (
                <>
                  <View style={styles.detailPoster}>
                    <Image source={selectedMovie?.poster_url ? { uri: selectedMovie.poster_url } : POSTER_PLACEHOLDER} style={styles.detailPosterImage} resizeMode="cover" />
                  </View>

                  <View style={styles.detailBody}>
                    <Text style={styles.detailTitle}>{selectedMovie.title}</Text>

                    <View style={styles.detailBadgesRow}>
                      {selectedMovie.rating && (
                        <View style={[styles.detailBadge, { backgroundColor: RATING_COLOR[selectedMovie.rating] || '#666' }]}>
                          <Text style={styles.detailBadgeText}>{selectedMovie.rating}</Text>
                        </View>
                      )}
                      {selectedMovie.genre && (
                        <View style={styles.detailGenreBadge}>
                          <Text style={styles.detailGenreText}>{selectedMovie.genre}</Text>
                        </View>
                      )}
                      {selectedMovie.duration_minutes && (
                        <View style={styles.detailGenreBadge}>
                          <Text style={styles.detailGenreText}>⏱ {selectedMovie.duration_minutes}min</Text>
                        </View>
                      )}
                    </View>

                    {selectedMovie.description ? (
                      <Text style={styles.detailDesc}>{selectedMovie.description}</Text>
                    ) : null}

                    <View style={styles.detailInfoBox}>
                      <Text style={styles.detailInfoRow}>📅 {formatDate(selectedMovie.session_date)}</Text>
                      <Text style={styles.detailInfoRow}>🕐 {formatTime(selectedMovie.session_time)}</Text>
                      {selectedMovie.room && <Text style={styles.detailInfoRow}>🏛 {selectedMovie.room}</Text>}
                      {selectedMovie.director && <Text style={styles.detailInfoRow}>🎥 Dir: {selectedMovie.director}</Text>}
                    </View>

                    <TouchableOpacity style={styles.ctaButton} onPress={() => { setSelectedMovie(null); navigation.navigate('Home'); }}>
                      <Text style={styles.ctaButtonText}>🍿 Escolher pipoca</Text>
                    </TouchableOpacity>

                    {isSeller && (
                      <View style={styles.sellerActions}>
                        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(selectedMovie)}>
                          <Text style={styles.editBtnText}>✏️ Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(selectedMovie)}>
                          <Text style={styles.deleteBtnText}>🗑 Remover</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedMovie(null)}>
                      <Text style={styles.closeBtnText}>Fechar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal criar/editar filme */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.formModal}>
            <Text style={styles.formTitle}>{editing ? '✏️ Editar Sessão' : '🎬 Nova Sessão'}</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              {[
                { label: 'Título *', key: 'title', placeholder: 'Ex: Duna: Parte Dois' },
                { label: 'Descrição', key: 'description', placeholder: 'Sinopse do filme' },
                { label: 'Gênero', key: 'genre', placeholder: 'Ex: Ficção Científica' },
                { label: 'Duração (minutos)', key: 'duration_minutes', placeholder: 'Ex: 150', keyboard: 'numeric' },
                { label: 'Diretor', key: 'director', placeholder: 'Ex: Denis Villeneuve' },
                { label: 'Elenco', key: 'cast_info', placeholder: 'Ex: Timothée Chalamet, Zendaya' },
                { label: 'Classificação', key: 'rating', placeholder: 'Livre, 10+, 12+, 14+, 16+, 18+' },
                { label: 'URL do Poster', key: 'poster_url', placeholder: 'https://...' },
                { label: 'Data da Sessão *', key: 'session_date', placeholder: 'AAAA-MM-DD' },
                { label: 'Horário *', key: 'session_time', placeholder: 'HH:MM' },
                { label: 'Sala', key: 'room', placeholder: 'Ex: Sala 1' },
                { label: 'Preço', key: 'price', placeholder: '0.00', keyboard: 'numeric' },
              ].map(field => (
                <View key={field.key} style={styles.formField}>
                  <Text style={styles.formLabel}>{field.label}</Text>
                  <TextInput
                    style={[styles.formInput, field.key === 'description' || field.key === 'cast_info' ? styles.formInputMulti : null]}
                    placeholder={field.placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    value={(form as any)[field.key]}
                    onChangeText={v => setForm(f => ({ ...f, [field.key]: v }))}
                    keyboardType={(field as any).keyboard || 'default'}
                    multiline={field.key === 'description' || field.key === 'cast_info'}
                    numberOfLines={field.key === 'description' || field.key === 'cast_info' ? 3 : 1}
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={saving}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>💾 Salvar</Text>
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
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  lightsRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 6,
    paddingVertical: SPACING.sm, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: '#222',
  },
  light: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  lightGold: { backgroundColor: '#FFD700' },

  list: { padding: SPACING.md },

  // Tabs
  tabRow: { flexDirection: 'row', marginHorizontal: SPACING.md, marginTop: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 4, gap: 4 },
  tabBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: RADIUS.sm },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabLabel: { color: COLORS.textMuted, fontSize: 13, fontWeight: '700' },
  tabLabelActive: { color: '#fff' },

  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    flexDirection: 'row', overflow: 'hidden',
    borderWidth: 1, borderColor: '#2a2a2a', ...SHADOW.small,
    marginBottom: SPACING.sm,
  },
  posterContainer: { width: 100, position: 'relative' },
  posterImage: { width: 100, height: 150 },
  comingSoonBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(206,147,216,0.85)', paddingVertical: 4, alignItems: 'center',
  },
  comingSoonText: { color: '#fff', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  infoTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  infoTag: { backgroundColor: COLORS.surface, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 },
  infoTagText: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '600' },
  ratingBadge: {
    position: 'absolute', top: 8, left: 8,
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
  },
  ratingText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  cardInfo: { flex: 1, padding: SPACING.md },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  cardGenre: { fontSize: 12, color: COLORS.primary, marginTop: 2, fontWeight: '600' },
  sessionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.sm },
  sessionDate: { fontSize: 12, color: COLORS.textSecondary },
  sessionTimeBadge: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  sessionTime: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  cardFooter: { flexDirection: 'row', gap: SPACING.md, marginTop: 4 },
  roomText: { fontSize: 11, color: COLORS.textMuted },
  durationText: { fontSize: 11, color: COLORS.textMuted },
  selectButton: {
    backgroundColor: '#1a1a1a', borderRadius: RADIUS.sm,
    paddingVertical: 7, alignItems: 'center', marginTop: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.primary,
  },
  selectButtonText: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold' },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 60 },
  emptyText: { color: COLORS.textSecondary, fontSize: 16, marginTop: SPACING.md },
  emptyHint: { color: COLORS.textMuted, fontSize: 13, marginTop: SPACING.sm },

  // Modal detalhe
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  detailModal: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  detailPoster: {
    height: 220, backgroundColor: '#111',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  detailPosterImage: { width: '100%', height: 220 },
  detailBody: { padding: SPACING.lg },
  detailTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  detailBadgesRow: { flexDirection: 'row', gap: 8, marginTop: SPACING.sm, flexWrap: 'wrap' },
  detailBadge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  detailBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  detailGenreBadge: { backgroundColor: '#2a2a2a', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  detailGenreText: { color: COLORS.textSecondary, fontSize: 12 },
  detailDesc: { color: COLORS.textSecondary, fontSize: 14, marginTop: SPACING.md, lineHeight: 22 },
  detailInfoBox: {
    backgroundColor: '#111', borderRadius: RADIUS.md,
    padding: SPACING.md, marginTop: SPACING.md, gap: 6,
  },
  detailInfoRow: { color: COLORS.text, fontSize: 14 },
  ctaButton: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingVertical: 14, alignItems: 'center', marginTop: SPACING.lg,
  },
  ctaButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sellerActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md },
  editBtn: {
    flex: 1, backgroundColor: '#1a3a5c', borderRadius: RADIUS.md,
    paddingVertical: 12, alignItems: 'center',
  },
  editBtnText: { color: '#64B5F6', fontWeight: 'bold' },
  deleteBtn: {
    flex: 1, backgroundColor: '#3a1a1a', borderRadius: RADIUS.md,
    paddingVertical: 12, alignItems: 'center',
  },
  deleteBtnText: { color: '#FF6B6B', fontWeight: 'bold' },
  closeBtn: { marginTop: SPACING.md, paddingVertical: 12, alignItems: 'center' },
  closeBtnText: { color: COLORS.textMuted, fontSize: 15 },

  // Modal form
  formModal: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '92%', padding: SPACING.lg,
  },
  formTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  formField: { marginBottom: SPACING.md },
  formLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  formInput: {
    backgroundColor: '#111', borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 12,
    color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: '#333',
  },
  formInputMulti: { height: 80, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md },
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
