import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, ActivityIndicator, Alert,
  Dimensions, StatusBar,
} from 'react-native';
import { getMovieById } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOW } from '../types/theme';

const POSTER_PLACEHOLDER = require('../../assets/Image-not-found.png');

const isValidPosterUrl = (url?: string): boolean => {
  return !!(url && typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://')));
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Poster: tamanho fixo estilo ingresso.com
const POSTER_W = Math.round(SCREEN_W * 0.30);
const POSTER_H = Math.round(POSTER_W * 1.48);

// Hero banner: altura compacta como ingresso.com
const HERO_H = Math.round(SCREEN_H * 0.26);

const RATING_COLOR: Record<string, string> = {
  'Livre': '#00C853', '10+': '#64B5F6', '12+': '#FFB300',
  '14+':   '#FF7043', '16+': '#E53935', '18+': '#B71C1C',
};

const STATUS_CFG: Record<string, { label: string; color: string; icon: string }> = {
  now_playing: { label: 'Em Cartaz',  color: COLORS.success,  icon: '🎬' },
  coming_soon: { label: 'Em Breve',   color: '#CE93D8',        icon: '🌟' },
  ended:       { label: 'Encerrado',  color: COLORS.textMuted, icon: '📼' },
};

// ─── Linha de metadado ────────────────────────────────────────────────────────
function MetaRow({ icon, text }: { icon: string; text: string }) {
  if (!text) return null;
  return (
    <View style={metaStyles.row}>
      <Text style={metaStyles.icon}>{icon}</Text>
      <Text style={metaStyles.text} numberOfLines={1}>{text}</Text>
    </View>
  );
}
const metaStyles = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  icon: { fontSize: 13, width: 18 },
  text: { color: COLORS.textSecondary, fontSize: 13, flex: 1 },
});

// ─── Linha expandida (seção de detalhes) ─────────────────────────────────────
function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.icon}>{icon}</Text>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={detailStyles.value} numberOfLines={2}>{value}</Text>
    </View>
  );
}
const detailStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e1e1e' },
  icon:  { fontSize: 16, width: 26 },
  label: { fontSize: 12, color: COLORS.textMuted, width: 90, paddingTop: 1 },
  value: { fontSize: 13, color: COLORS.text, flex: 1, fontWeight: '500' },
});

// ─── Tela ─────────────────────────────────────────────────────────────────────
export default function MovieDetailScreen({ route, navigation }: any) {
  const { movieId } = route.params as { movieId: number };
  const { isSeller } = useAuth();
  const [movie,   setMovie]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMovieById(movieId);
        setMovie(res.data);
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar os dados do filme.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [movieId]);

  if (loading) return (
    <View style={styles.loadingBox}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Carregando...</Text>
    </View>
  );
  if (!movie) return null;

  // ── Formatações ───────────────────────────────────────
  const fmtDate = (iso: string | null, opts: Intl.DateTimeFormatOptions) =>
    iso ? new Date(iso).toLocaleDateString('pt-BR', opts) : null;

  const sessionDateFmt  = fmtDate(movie.session_date,     { weekday: 'short', day: '2-digit', month: 'short' });
  const sessionTime     = movie.session_time?.slice(0, 5) ?? null;
  const premiereDate    = fmtDate(movie.premiere_date,    { day: '2-digit', month: 'short', year: 'numeric' });
  const untilDate       = fmtDate(movie.on_display_until, { day: '2-digit', month: 'short', year: 'numeric' });

  const daysLeft   = movie.on_display_until
    ? Math.max(0, Math.ceil((new Date(movie.on_display_until).getTime() - Date.now()) / 86400000))
    : null;
  const isUrgent   = daysLeft !== null && daysLeft <= 7;

  const statusCfg   = STATUS_CFG[movie.status] || STATUS_CFG['now_playing'];
  const ratingColor = RATING_COLOR[movie.rating] || '#666';
  const priceVal    = Number(movie.price ?? 0);
  const priceFmt    = priceVal === 0 ? 'Gratuito' : `R$ ${priceVal.toFixed(2)}`;

  const goToSeats = () => {
    const s = movie.sessions?.[0];
    const sessionId = s?.id ?? null;
    if (!sessionId) {
      Alert.alert('Sessao indisponivel', 'Este filme ainda nao tem uma sessao ativa para venda de ingressos.');
      return;
    }

    navigation.navigate('SeatSelection', {
      movieId:      movie.id,
      sessionId,
      movieTitle:   movie.title,
      sessionDate:  movie.session_date ?? s?.session_date ?? null,
      sessionTime:  movie.session_time ?? s?.session_time ?? null,
      roomName:     movie.room_name ?? movie.room ?? null,
      pricePerSeat: priceVal,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Botão voltar ── */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ════════════════════════════════════════
            HERO — banner borrado + poster lateral
            ════════════════════════════════════════ */}
        <View style={[styles.hero, { height: HERO_H }]}>
          {/* Banner de fundo (borrado via sobreposição) */}
          <Image
            source={isValidPosterUrl(movie.poster_url) ? { uri: movie.poster_url } : POSTER_PLACEHOLDER}
            style={styles.heroBg}
            resizeMode="cover"
            blurRadius={18}
          />
          {/* Escurecimento sobre o banner */}
          <View style={styles.heroDim} />

          {/* Conteúdo do hero: poster esquerda + info direita */}
          <View style={styles.heroContent}>
            {/* Poster com borda */}
            <View style={styles.posterWrapper}>
              <Image
                source={isValidPosterUrl(movie.poster_url) ? { uri: movie.poster_url } : POSTER_PLACEHOLDER}
                style={[styles.poster, { width: POSTER_W, height: POSTER_H }]}
                resizeMode="cover"
              />
              {/* Badge classificação embaixo do poster */}
              {movie.rating ? (
                <View style={[styles.ratingBadge, { backgroundColor: ratingColor }]}>
                  <Text style={styles.ratingBadgeText}>PARA MAIORES DE {movie.rating === 'Livre' ? '0' : movie.rating.replace('+', '')} ANOS</Text>
                </View>
              ) : null}
            </View>

            {/* Info à direita */}
            <View style={styles.heroInfo}>
              <Text style={styles.title} numberOfLines={3}>{movie.title}</Text>

              {/* Linha: classificação + duração + gênero */}
              <View style={styles.heroMeta}>
                {movie.rating ? (
                  <View style={[styles.heroRatingBox, { borderColor: ratingColor }]}>
                    <Text style={[styles.heroRatingText, { color: ratingColor }]}>{movie.rating}</Text>
                  </View>
                ) : null}
                {movie.duration_minutes ? (
                  <Text style={styles.heroMetaText}>{Math.floor(movie.duration_minutes / 60)}h{String(movie.duration_minutes % 60).padStart(2, '0')}m</Text>
                ) : null}
                {movie.genre ? <Text style={styles.heroMetaText}>| {movie.genre}</Text> : null}
              </View>

              {/* Sinopse curta */}
              {movie.description ? (
                <Text style={styles.heroSynopsis} numberOfLines={3}>{movie.description}</Text>
              ) : null}

              {/* Status badge */}
              <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '22', borderColor: statusCfg.color + '55' }]}>
                <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>{statusCfg.icon} {statusCfg.label}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ════════════════════════════════════════
            CORPO
            ════════════════════════════════════════ */}
        <View style={styles.body}>

          {/* Urgência */}
          {isUrgent && daysLeft !== null && (
            <View style={[styles.urgentBanner, { borderColor: daysLeft === 0 ? COLORS.primary : COLORS.warning }]}>
              <Text style={[styles.urgentText, { color: daysLeft === 0 ? COLORS.primary : COLORS.warning }]}>
                {daysLeft === 0 ? '🚨 Último dia em cartaz!' : `⚠️ Últimos ${daysLeft} dia${daysLeft > 1 ? 's' : ''} em cartaz`}
              </Text>
            </View>
          )}

          {/* ── Ingresso + CTA ── */}
          <View style={styles.ticketCard}>
            <View>
              <Text style={styles.ticketLabel}>Ingresso</Text>
              <Text style={styles.ticketPrice}>{priceFmt}</Text>
            </View>
            {movie.status !== 'ended' ? (
              <TouchableOpacity style={styles.ctaBtn} onPress={goToSeats} activeOpacity={0.85}>
                <Text style={styles.ctaIcon}>🎟</Text>
                <Text style={styles.ctaText}>Escolher assentos</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.endedBadge}>
                <Text style={styles.endedText}>Sessão encerrada</Text>
              </View>
            )}
          </View>

          {/* ── Sinopse ── */}
          {movie.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sinopse</Text>
              <Text style={styles.synopsis}>{movie.description}</Text>
            </View>
          ) : null}

          {/* ── Sessões ── */}
          {(sessionDateFmt || (movie.sessions?.length > 0)) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sessões</Text>
              {/* Linha: card(s) de sessão + info do filme ao lado */}
              <View style={styles.sessionsWithInfo}>
                {/* Cards de sessão */}
                <View style={styles.sessionsCardsCol}>
                  {sessionDateFmt && sessionTime && (
                    <TouchableOpacity style={[styles.sessionCard, styles.sessionCardActive]} onPress={goToSeats} activeOpacity={0.8}>
                      <Text style={styles.sessionCardDate}>{sessionDateFmt}</Text>
                      <Text style={styles.sessionCardTime}>{sessionTime}</Text>
                      {movie.room ? <Text style={styles.sessionCardRoom}>{movie.room}</Text> : null}
                      <View style={styles.sessionCardBuyBtn}>
                        <Text style={styles.sessionCardBuyText}>🎟</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  {movie.sessions?.map((s: any) => (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.sessionCard}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('SeatSelection', {
                        movieId:      movie.id,
                        sessionId:    s.id,
                        movieTitle:   movie.title,
                        sessionDate:  s.session_date,
                        sessionTime:  s.session_time,
                        roomName:     s.room_name,
                        pricePerSeat: priceVal,
                      })}
                    >
                      <Text style={styles.sessionCardDate}>
                        {fmtDate(s.session_date, { day: '2-digit', month: 'short' })}
                      </Text>
                      <Text style={styles.sessionCardTime}>{s.session_time?.slice(0, 5)}</Text>
                      {s.room_name ? <Text style={styles.sessionCardRoom}>{s.room_name}</Text> : null}
                      {s.language ? (
                        <View style={styles.langPill}>
                          <Text style={styles.langPillText}>
                            {s.language === 'dublado' ? 'DUB' : s.language === 'legendado' ? 'LEG' : 'ORI'}
                          </Text>
                        </View>
                      ) : null}
                      <View style={styles.sessionCardBuyBtn}>
                        <Text style={styles.sessionCardBuyText}>🎟</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Info do filme ao lado */}
                <View style={styles.sessionInfoCol}>
                  <Text style={styles.sessionInfoTitle} numberOfLines={2}>{movie.title}</Text>
                  {movie.genre ? <Text style={styles.sessionInfoGenre}>{movie.genre}</Text> : null}
                  <View style={styles.sessionInfoBadges}>
                    {movie.rating ? (
                      <View style={[styles.sessionInfoBadge, { backgroundColor: ratingColor + '33', borderColor: ratingColor }]}>
                        <Text style={[styles.sessionInfoBadgeText, { color: ratingColor }]}>{movie.rating}</Text>
                      </View>
                    ) : null}
                    <View style={[styles.sessionInfoBadge, { backgroundColor: statusCfg.color + '22', borderColor: statusCfg.color + '55' }]}>
                      <Text style={[styles.sessionInfoBadgeText, { color: statusCfg.color }]}>{statusCfg.icon} {statusCfg.label}</Text>
                    </View>
                  </View>
                  {movie.duration_minutes ? (
                    <Text style={styles.sessionInfoMeta}>⏱ {movie.duration_minutes} min</Text>
                  ) : null}
                </View>
              </View>
            </View>
          )}

          {/* ── Ficha técnica ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ficha técnica</Text>
            <View style={styles.detailCard}>
              <DetailRow icon="🎥" label="Direção"        value={movie.director} />
              <DetailRow icon="🎭" label="Elenco"         value={movie.cast_info} />
              <DetailRow icon="🎞" label="Gênero"         value={movie.genre} />
              <DetailRow icon="⏱" label="Duração"        value={movie.duration_minutes ? `${movie.duration_minutes} min` : ''} />
              <DetailRow icon="🔞" label="Classificação"  value={movie.rating} />
              <DetailRow icon="🌟" label="Estreia"        value={premiereDate || ''} />
              <DetailRow icon="📅" label="Em cartaz até"  value={untilDate || ''} />
            </View>
          </View>

          {/* ── Painel vendedor ── */}
          {isSeller && (
            <TouchableOpacity
              style={styles.sellerBtn}
              onPress={() => navigation.navigate('Main', { screen: 'Painel', params: { openMovieEdit: movie.id } })}
              activeOpacity={0.8}
            >
              <Text style={styles.sellerBtnText}>✏️ Editar este filme</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.background },
  loadingBox:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, gap: SPACING.sm },
  loadingText: { color: COLORS.textSecondary, fontSize: 14 },
  scroll:      { paddingBottom: 0 },

  // Voltar
  backBtn:  {
    position: 'absolute', top: 44, left: 14, zIndex: 100,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { color: '#fff', fontSize: 28, lineHeight: 32, marginTop: -2 },

  // ── Hero ──
  hero:       { position: 'relative', overflow: 'hidden' },
  heroBg:     { position: 'absolute', width: '100%', height: '100%' },
  heroDim:    { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.60)' },
  heroContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    paddingTop: 56,
    gap: SPACING.md,
  },

  // Poster
  posterWrapper: { alignItems: 'center' },
  poster: {
    borderRadius: RADIUS.sm,
    ...SHADOW.medium,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ratingBadge: {
    marginTop: 6,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6, paddingVertical: 3,
    alignItems: 'center',
  },
  ratingBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold', letterSpacing: 0.3 },

  // Info ao lado
  heroInfo: { flex: 1, paddingBottom: 4, gap: 6 },
  title:    { color: '#fff', fontSize: 20, fontWeight: 'bold', lineHeight: 26 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  heroRatingBox: { borderWidth: 1.5, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  heroRatingText: { fontSize: 11, fontWeight: 'bold' },
  heroMetaText: { color: COLORS.textSecondary, fontSize: 13 },
  heroSynopsis: { color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 18 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  statusBadgeText: { fontSize: 12, fontWeight: 'bold' },

  // ── Body ──
  body: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },

  // (compat) esses estilos não são mais usados no hero mas ficam para não quebrar referências
  genre:     { color: COLORS.primary, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  badgeRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  badge:     { borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },

  // Urgência
  urgentBanner: {
    borderRadius: RADIUS.md, borderWidth: 1,
    paddingVertical: 8, paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md, alignItems: 'center',
    backgroundColor: 'rgba(255,100,0,0.08)',
  },
  urgentText: { fontWeight: 'bold', fontSize: 13 },

  // Ingresso / CTA
  ticketCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: '#2a2a2a',
    ...SHADOW.small,
  },
  ticketLabel: { color: COLORS.textMuted, fontSize: 11, marginBottom: 2 },
  ticketPrice: { color: COLORS.gold, fontSize: 22, fontWeight: 'bold' },
  ctaBtn:      {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 12,
  },
  ctaIcon:     { fontSize: 16 },
  ctaText:     { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  endedBadge:  { backgroundColor: '#1e1e1e', borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12 },
  endedText:   { color: COLORS.textMuted, fontSize: 13 },

  // Seções
  section:      { marginBottom: SPACING.lg },
  sectionTitle: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: SPACING.sm },
  synopsis:     { color: COLORS.text, fontSize: 14, lineHeight: 22 },

  // Sessões — layout horizontal (cards + info)
  sessionsWithInfo:  { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  sessionsCardsCol:  { gap: SPACING.sm },
  sessionInfoCol:    { flex: 1, justifyContent: 'center', paddingTop: 4 },
  sessionInfoTitle:  { color: '#fff', fontSize: 15, fontWeight: 'bold', lineHeight: 20, marginBottom: 4 },
  sessionInfoGenre:  { color: COLORS.primary, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  sessionInfoBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 6 },
  sessionInfoBadge:  { borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1 },
  sessionInfoBadgeText: { fontSize: 10, fontWeight: 'bold' },
  sessionInfoMeta:   { color: COLORS.textSecondary, fontSize: 12 },

  sessionsRow: { gap: SPACING.sm, paddingRight: SPACING.md },
  sessionCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    padding: SPACING.sm, borderWidth: 1, borderColor: '#2a2a2a',
    alignItems: 'center', minWidth: 92,
  },
  sessionCardActive: { borderColor: COLORS.primary + '66', backgroundColor: COLORS.primary + '0d' },
  sessionCardDate:   { color: COLORS.textSecondary, fontSize: 11 },
  sessionCardTime:   { color: COLORS.text, fontWeight: 'bold', fontSize: 18, marginVertical: 2 },
  sessionCardRoom:   { color: COLORS.textMuted, fontSize: 10, marginBottom: 4 },
  langPill:          { backgroundColor: '#333', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 4 },
  langPillText:      { color: COLORS.textSecondary, fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
  sessionCardBuyBtn: { marginTop: 4 },
  sessionCardBuyText:{ fontSize: 16 },

  // Ficha técnica
  detailCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, borderWidth: 1, borderColor: '#222' },

  // Botão vendedor
  sellerBtn:     {
    borderWidth: 1, borderColor: '#2a4a2a', borderRadius: RADIUS.md,
    paddingVertical: 13, alignItems: 'center',
    backgroundColor: '#0d1a0d', marginBottom: SPACING.md,
  },
  sellerBtnText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 14 },
});
