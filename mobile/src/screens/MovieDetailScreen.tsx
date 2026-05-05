import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, ActivityIndicator, Alert,
  Dimensions, Animated,
} from 'react-native';
import { getMovieById } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOW } from '../types/theme';

const POSTER_PLACEHOLDER = require('../../assets/Image-not-found.png');
const { width: SCREEN_W } = Dimensions.get('window');
const POSTER_H = Math.round(SCREEN_W * 1.35);

const RATING_COLOR: Record<string, string> = {
  'Livre': '#00C853', '10+': '#64B5F6', '12+': '#FFB300',
  '14+': '#FF7043', '16+': '#E53935', '18+': '#B71C1C',
};

const STATUS_LABEL: Record<string, { label: string; color: string; icon: string }> = {
  now_playing:  { label: 'Em Cartaz',  color: COLORS.success,  icon: '🎬' },
  coming_soon:  { label: 'Em Breve',   color: '#CE93D8',        icon: '🌟' },
  ended:        { label: 'Encerrado',  color: COLORS.textMuted, icon: '📼' },
};

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.icon}>{icon}</Text>
      <View style={rowStyles.content}>
        <Text style={rowStyles.label}>{label}</Text>
        <Text style={rowStyles.value}>{value}</Text>
      </View>
    </View>
  );
}
const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#222' },
  icon: { fontSize: 20, width: 34 },
  content: { flex: 1 },
  label: { fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  value: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
});

export default function MovieDetailScreen({ route, navigation }: any) {
  const { movieId } = route.params as { movieId: number };
  const { isSeller } = useAuth();
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scrollY] = useState(new Animated.Value(0));

  const fetchMovie = async () => {
    try {
      const res = await getMovieById(movieId);
      setMovie(res.data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os dados do filme.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMovie(); }, [movieId]);

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando filme...</Text>
      </View>
    );
  }

  if (!movie) return null;

  // ── Dados derivados ──────────────────────────────────
  const sessionDate = movie.session_date
    ? new Date(movie.session_date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : null;
  const sessionTime = movie.session_time?.slice(0, 5) ?? null;
  const premiereDate = movie.premiere_date
    ? new Date(movie.premiere_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;
  const untilDate = movie.on_display_until
    ? new Date(movie.on_display_until).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  const daysLeft = movie.on_display_until
    ? Math.max(0, Math.ceil((new Date(movie.on_display_until).getTime() - Date.now()) / 86400000))
    : null;
  const isLastWeek = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
  const isLastDay = daysLeft === 0;

  const statusInfo = STATUS_LABEL[movie.status] || STATUS_LABEL['now_playing'];
  const ratingColor = RATING_COLOR[movie.rating] || '#666';

  // Parallax do poster
  const posterTranslate = scrollY.interpolate({
    inputRange: [-POSTER_H, 0, POSTER_H],
    outputRange: [POSTER_H * 0.5, 0, -POSTER_H * 0.3],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Botão voltar flutuante */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>←</Text>
      </TouchableOpacity>

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Poster com parallax ── */}
        <View style={[styles.posterWrap, { height: POSTER_H }]}>
          <Animated.Image
            source={movie.poster_url ? { uri: movie.poster_url } : POSTER_PLACEHOLDER}
            style={[styles.posterImg, { transform: [{ translateY: posterTranslate }] }]}
            resizeMode="cover"
          />
          {/* Gradiente escuro na base */}
          <View style={styles.posterGradient} />

          {/* Badge de classificação */}
          {movie.rating ? (
            <View style={[styles.ratingBadge, { backgroundColor: ratingColor }]}>
              <Text style={styles.ratingText}>{movie.rating}</Text>
            </View>
          ) : null}

          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '22', borderColor: statusInfo.color + '55' }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.icon} {statusInfo.label}</Text>
          </View>

          {/* Título sobre o poster */}
          <View style={styles.posterTitleBox}>
            {movie.genre ? <Text style={styles.genreOver}>{movie.genre}</Text> : null}
            <Text style={styles.titleOver} numberOfLines={3}>{movie.title}</Text>
            {movie.duration_minutes ? (
              <Text style={styles.durationOver}>⏱ {movie.duration_minutes} min</Text>
            ) : null}
          </View>
        </View>

        {/* ── Corpo do card ── */}
        <View style={styles.body}>

          {/* ── Alerta de últimos dias ── */}
          {(isLastWeek || isLastDay) && (
            <View style={[styles.alertBanner, { backgroundColor: isLastDay ? COLORS.primary + '22' : COLORS.warning + '1a', borderColor: isLastDay ? COLORS.primary : COLORS.warning }]}>
              <Text style={[styles.alertText, { color: isLastDay ? COLORS.primary : COLORS.warning }]}>
                {isLastDay ? '🚨 Último dia em cartaz!' : `⚠️ Apenas ${daysLeft} dia${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}!`}
              </Text>
            </View>
          )}

          {/* ── Sessão em destaque ── */}
          {(sessionDate || sessionTime) && (
            <View style={styles.sessionHighlight}>
              <Text style={styles.sessionHighlightTitle}>📅 Próxima Sessão</Text>
              <View style={styles.sessionHighlightRow}>
                {sessionDate ? (
                  <View style={styles.sessionHighlightItem}>
                    <Text style={styles.sessionHighlightValue}>{sessionDate}</Text>
                  </View>
                ) : null}
                {sessionTime ? (
                  <View style={styles.sessionTimePill}>
                    <Text style={styles.sessionTimePillText}>{sessionTime}</Text>
                  </View>
                ) : null}
              </View>
              {movie.room ? (
                <Text style={styles.sessionRoom}>🏛 {movie.room}</Text>
              ) : null}
            </View>
          )}

          {/* ── Preço / CTA ── */}
          {movie.price > 0 && (
            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>Ingresso a partir de</Text>
                <Text style={styles.priceValue}>R$ {Number(movie.price).toFixed(2)}</Text>
              </View>
              <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate('Cardapio')}>
                <Text style={styles.ctaBtnText}>🍿 Pedir agora</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Sinopse ── */}
          {movie.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📖 Sinopse</Text>
              <Text style={styles.synopsis}>{movie.description}</Text>
            </View>
          ) : null}

          {/* ── Informações técnicas ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎬 Informações</Text>
            <View style={styles.infoCard}>
              <InfoRow icon="🎥" label="Direção"       value={movie.director} />
              <InfoRow icon="🎭" label="Elenco"        value={movie.cast_info} />
              <InfoRow icon="🎞" label="Gênero"        value={movie.genre} />
              <InfoRow icon="⏱" label="Duração"       value={movie.duration_minutes ? `${movie.duration_minutes} minutos` : ''} />
              <InfoRow icon="🔞" label="Classificação" value={movie.rating} />
              <InfoRow icon="🌟" label="Estreia"       value={premiereDate || ''} />
              <InfoRow icon="📅" label="Em cartaz até" value={untilDate || ''} />
              <InfoRow icon="🏛" label="Sala"          value={movie.room} />
            </View>
          </View>

          {/* ── Sessões adicionais (se existirem) ── */}
          {movie.sessions && movie.sessions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🕐 Outras Sessões</Text>
              <View style={styles.sessionsGrid}>
                {movie.sessions.map((s: any) => (
                  <View key={s.id} style={styles.sessionChip}>
                    <Text style={styles.sessionChipDate}>
                      {new Date(s.session_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </Text>
                    <Text style={styles.sessionChipTime}>{s.session_time?.slice(0, 5)}</Text>
                    {s.language ? (
                      <View style={styles.sessionLangBadge}>
                        <Text style={styles.sessionLangText}>{s.language === 'dublado' ? 'DUB' : s.language === 'legendado' ? 'LEG' : s.language.toUpperCase()}</Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Ações do vendedor ── */}
          {isSeller && (
            <View style={styles.sellerBox}>
              <Text style={styles.sellerBoxTitle}>⚙️ Painel do vendedor</Text>
              <TouchableOpacity
                style={styles.sellerEditBtn}
                onPress={() => navigation.navigate('Main', { screen: 'Painel', params: { openMovieEdit: movie.id } })}
              >
                <Text style={styles.sellerEditBtnText}>✏️ Editar este filme</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: SPACING.xxl }} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, gap: SPACING.md },
  loadingText: { color: COLORS.textSecondary, fontSize: 15 },

  // Voltar
  backBtn: {
    position: 'absolute', top: 52, left: 16, zIndex: 100,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#ffffff22',
  },
  backBtnText: { color: '#fff', fontSize: 22, lineHeight: 26, marginLeft: -2 },

  // Poster
  posterWrap: { width: '100%', overflow: 'hidden', position: 'relative' },
  posterImg: { width: '100%', height: '130%', position: 'absolute', top: 0 },
  posterGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
    // Gradiente manual em camadas
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 0,
  },
  ratingBadge: {
    position: 'absolute', top: 56, right: 16,
    borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 4,
  },
  ratingText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  statusBadge: {
    position: 'absolute', top: 56, right: 70,
    borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1,
  },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  posterTitleBox: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: SPACING.lg, paddingBottom: SPACING.xl,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  genreOver: { color: COLORS.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  titleOver: { color: '#fff', fontSize: 28, fontWeight: 'bold', lineHeight: 34 },
  durationOver: { color: COLORS.textSecondary, fontSize: 13, marginTop: 8 },

  // Corpo
  body: { backgroundColor: COLORS.background, paddingHorizontal: SPACING.md, paddingTop: SPACING.lg },

  // Alerta últimos dias
  alertBanner: {
    borderRadius: RADIUS.md, borderWidth: 1,
    paddingVertical: 10, paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md, alignItems: 'center',
  },
  alertText: { fontWeight: 'bold', fontSize: 14 },

  // Sessão em destaque
  sessionHighlight: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.primary + '44',
    ...SHADOW.small,
  },
  sessionHighlightTitle: { color: COLORS.primary, fontWeight: 'bold', fontSize: 13, marginBottom: SPACING.sm },
  sessionHighlightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: SPACING.sm },
  sessionHighlightItem: { flex: 1 },
  sessionHighlightValue: { color: COLORS.text, fontSize: 16, fontWeight: '700', textTransform: 'capitalize' },
  sessionTimePill: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 6,
  },
  sessionTimePillText: { color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
  sessionRoom: { color: COLORS.textSecondary, fontSize: 13, marginTop: SPACING.sm },

  // Preço
  priceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  priceLabel: { color: COLORS.textMuted, fontSize: 12 },
  priceValue: { color: COLORS.gold, fontSize: 26, fontWeight: 'bold', marginTop: 2 },
  ctaBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg, paddingVertical: 14,
  },
  ctaBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  // Seções
  section: { marginBottom: SPACING.lg },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: 'bold', marginBottom: SPACING.sm },
  synopsis: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 24 },

  // Info card
  infoCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, borderWidth: 1, borderColor: '#2a2a2a' },

  // Grid de sessões extras
  sessionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  sessionChip: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    padding: SPACING.sm, borderWidth: 1, borderColor: '#333',
    alignItems: 'center', minWidth: 90,
  },
  sessionChipDate: { color: COLORS.textSecondary, fontSize: 12 },
  sessionChipTime: { color: COLORS.text, fontWeight: 'bold', fontSize: 16, marginTop: 2 },
  sessionLangBadge: { backgroundColor: COLORS.primary + '22', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  sessionLangText: { color: COLORS.primary, fontSize: 10, fontWeight: 'bold' },

  // Painel vendedor
  sellerBox: {
    backgroundColor: '#1a2a1a', borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: '#2a4a2a',
  },
  sellerBoxTitle: { color: COLORS.success, fontSize: 13, fontWeight: 'bold', marginBottom: SPACING.sm },
  sellerEditBtn: {
    backgroundColor: '#1a3a5c', borderRadius: RADIUS.md,
    paddingVertical: 12, alignItems: 'center',
  },
  sellerEditBtnText: { color: '#64B5F6', fontWeight: 'bold', fontSize: 14 },
});
