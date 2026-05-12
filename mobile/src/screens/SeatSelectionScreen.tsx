import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions, Modal, SafeAreaView,
  StatusBar, Platform,
} from 'react-native';
import { getOccupiedSeats, purchaseTickets } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW } from '../types/theme';

// ─── Medidas responsivas ──────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Margem lateral + label da fileira + corredor central + gaps entre assentos
const ROW_LABEL_W  = 14;
const AISLE_W      = 8;
const SEAT_GAP     = 3;
const H_PADDING    = SPACING.sm * 2;        // 16px total
const AVAILABLE_W  = SCREEN_W - H_PADDING - ROW_LABEL_W - AISLE_W - (SEAT_GAP * (COLS.length - 1));
const SEAT_SIZE    = Math.floor(AVAILABLE_W / COLS.length);  // ~28-32px em 390px
const SEAT_FONT    = Math.max(7, Math.floor(SEAT_SIZE * 0.28));

type SeatStatus = 'free' | 'occupied' | 'selected';
const seatId = (row: string, col: number) => `${row}${col}`;

// ─── Assento ──────────────────────────────────────────────────────────────────
const Seat = React.memo(function Seat({
  label, status, onPress,
}: { label: string; status: SeatStatus; onPress: () => void }) {
  const isOccupied = status === 'occupied';
  const isSelected = status === 'selected';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isOccupied}
      activeOpacity={0.65}
      hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
      style={[
        seatStyle.base,
        isOccupied && seatStyle.occupied,
        isSelected && seatStyle.selected,
      ]}
    >
      {/* ícone de cadeira simples */}
      <View style={[seatStyle.back, isOccupied && seatStyle.backOccupied, isSelected && seatStyle.backSelected]} />
      <View style={[seatStyle.seat, isOccupied && seatStyle.seatOccupied, isSelected && seatStyle.seatSelected]}>
        <Text style={[seatStyle.label, { fontSize: SEAT_FONT }, isSelected && { color: '#fff' }, isOccupied && { color: '#4a2020' }]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const seatStyle = StyleSheet.create({
  base:          { width: SEAT_SIZE, alignItems: 'center', justifyContent: 'flex-end' },
  occupied:      { opacity: 0.75 },
  selected:      { transform: [{ translateY: -1 }] },
  back:          { width: SEAT_SIZE - 4, height: Math.round(SEAT_SIZE * 0.35), borderRadius: 3, backgroundColor: '#2a2a2a', borderWidth: 1, borderColor: '#3a3a3a', marginBottom: 1 },
  seat:          { width: SEAT_SIZE - 2, height: Math.round(SEAT_SIZE * 0.55), borderRadius: 4, backgroundColor: '#2a2a2a', borderWidth: 1, borderColor: '#3a3a3a', justifyContent: 'center', alignItems: 'center' },
  // ocupado
  backOccupied:  { backgroundColor: '#2a1010', borderColor: '#3a1818' },
  seatOccupied:  { backgroundColor: '#2a1010', borderColor: '#3a1818' },
  // selecionado
  backSelected:  { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primary },
  seatSelected:  { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  label:         { color: '#666', fontWeight: '700' },
});

// ─── Tela ─────────────────────────────────────────────────────────────────────
export default function SeatSelectionScreen({ route, navigation }: any) {
  const {
    movieId, sessionId, movieTitle,
    sessionDate, sessionTime, roomName, pricePerSeat,
  } = route.params as {
    movieId: number; sessionId: number; movieTitle: string;
    sessionDate?: string; sessionTime?: string; roomName?: string; pricePerSeat: number;
  };

  const [occupied,     setOccupied]     = useState<string[]>([]);
  const [selected,     setSelected]     = useState<string[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [buying,       setBuying]       = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  const loadOccupied = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getOccupiedSeats(sessionId);
      setOccupied(data.occupied ?? []);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Erro desconhecido';
      alert(`Não foi possível carregar os assentos.\n${msg}`);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { loadOccupied(); }, [loadOccupied]);

  const toggleSeat = useCallback((label: string) => {
    setSelected(prev =>
      prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]
    );
  }, []);

  const statusOf = (label: string): SeatStatus => {
    if (occupied.includes(label)) return 'occupied';
    if (selected.includes(label)) return 'selected';
    return 'free';
  };

  const total    = selected.length * pricePerSeat;
  const totalFmt = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleBuy = async () => {
    setShowConfirm(false);
    setBuying(true);
    try {
      const { data } = await purchaseTickets({
        movie_id: movieId, session_id: sessionId,
        seats: selected,
      });
      navigation.replace('OrderSuccess', {
        order: {
          order_id: data.order_id,
          ticket_code: data.tickets?.[0]?.ticket_code,
          tickets: data.tickets,
          total: data.total,
          payment_method: 'pix',
          movieTitle,
        },
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Não foi possível finalizar a compra.';
      alert(msg);
      loadOccupied();
    } finally {
      setBuying(false);
    }
  };

  // ── Info da sessão formatada ──────────────────────────
  const sessionInfo = [
    sessionDate ? new Date(sessionDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : null,
    sessionTime ? sessionTime.slice(0, 5) : null,
    roomName ?? null,
  ].filter(Boolean).join('  ·  ');

  // ── Quantos disponíveis ───────────────────────────────
  const totalSeats = ROWS.length * COLS.length;
  const freeCount  = totalSeats - occupied.length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* ── Header compacto ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{movieTitle}</Text>
          {sessionInfo ? <Text style={styles.headerSub} numberOfLines={1}>{sessionInfo}</Text> : null}
        </View>
        <View style={styles.freeCount}>
          <Text style={styles.freeCountNum}>{freeCount}</Text>
          <Text style={styles.freeCountLabel}>livres</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Tela do cinema ── */}
        <View style={styles.screenWrap}>
          <View style={styles.screenGlow} />
          <View style={styles.screenBar} />
          <Text style={styles.screenLabel}>T  E  L  A</Text>
        </View>

        {/* ── Mapa ── */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.loadingText}>Carregando assentos...</Text>
          </View>
        ) : (
          <View style={styles.mapWrap}>
            {ROWS.map((row, rowIdx) => (
              <View key={row} style={[styles.row, rowIdx === 0 && { marginTop: 0 }]}>
                {/* Label da fileira */}
                <Text style={styles.rowLabel}>{row}</Text>

                {/* Assentos */}
                {COLS.map((col, colIdx) => {
                  const label  = seatId(row, col);
                  const status = statusOf(label);
                  return (
                    <React.Fragment key={label}>
                      {/* Corredor fino entre col 5 e 6 */}
                      {col === 6 && <View style={styles.aisle} />}
                      <View style={{ marginHorizontal: SEAT_GAP / 2 }}>
                        <Seat label={label} status={status} onPress={() => toggleSeat(label)} />
                      </View>
                    </React.Fragment>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* ── Legenda ── */}
        <View style={styles.legend}>
          {[
            { bg: '#2a2a2a', border: '#3a3a3a', label: 'Livre' },
            { bg: COLORS.primary, border: COLORS.primary, label: 'Selecionado' },
            { bg: '#2a1010', border: '#3a1818', label: 'Ocupado' },
          ].map(item => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.bg, borderColor: item.border }]} />
              <Text style={styles.legendLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Chips dos selecionados ── */}
        {selected.length > 0 && (
          <View style={styles.selectedBox}>
            <Text style={styles.selectedBoxTitle}>
              {selected.length} assento{selected.length > 1 ? 's' : ''} selecionado{selected.length > 1 ? 's' : ''}
              <Text style={styles.selectedBoxHint}>  —  toque para remover</Text>
            </Text>
            <View style={styles.chipsRow}>
              {[...selected].sort().map(s => (
                <TouchableOpacity key={s} onPress={() => toggleSeat(s)} style={styles.chip}>
                  <Text style={styles.chipText}>{s}</Text>
                  <Text style={styles.chipX}>✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Footer fixo ── */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerLabel}>
            {selected.length === 0 ? 'Selecione os assentos' : `${selected.length} ingresso${selected.length > 1 ? 's' : ''}`}
          </Text>
          {selected.length > 0 && <Text style={styles.footerTotal}>{totalFmt}</Text>}
        </View>
        <TouchableOpacity
          style={[styles.buyBtn, (selected.length === 0 || buying) && styles.buyBtnOff]}
          onPress={() => selected.length > 0 && setShowConfirm(true)}
          disabled={selected.length === 0 || buying}
          activeOpacity={0.8}
        >
          {buying
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.buyBtnText}>Continuar  →</Text>
          }
        </TouchableOpacity>
      </View>

      {/* ── Modal bottom-sheet de confirmação ── */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfirm(false)}
      >
        <TouchableOpacity
          style={modalS.backdrop}
          activeOpacity={1}
          onPress={() => setShowConfirm(false)}
        />
        <View style={modalS.sheet}>
          {/* Handle */}
          <View style={modalS.handle} />

          <Text style={modalS.sheetTitle}>🎟 Confirmar compra</Text>
          <Text style={modalS.sheetMovie} numberOfLines={1}>{movieTitle}</Text>
          {sessionInfo ? <Text style={modalS.sheetSession}>{sessionInfo}</Text> : null}

          {/* Linha de assentos */}
          <View style={modalS.seatsRow}>
            {[...selected].sort().map(s => (
              <View key={s} style={modalS.seatBadge}>
                <Text style={modalS.seatBadgeText}>{s}</Text>
              </View>
            ))}
          </View>

          {/* Sumário */}
          <View style={modalS.summaryBox}>
            <View style={modalS.summaryRow}>
              <Text style={modalS.summaryLabel}>Ingressos</Text>
              <Text style={modalS.summaryValue}>
                {selected.length} × {pricePerSeat.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </Text>
            </View>
            <View style={[modalS.summaryRow, modalS.totalRow]}>
              <Text style={modalS.totalLabel}>Total</Text>
              <Text style={modalS.totalValue}>{totalFmt}</Text>
            </View>
          </View>

          {/* Botões */}
          <View style={modalS.btnRow}>
            <TouchableOpacity style={modalS.cancelBtn} onPress={() => setShowConfirm(false)}>
              <Text style={modalS.cancelText}>Voltar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modalS.confirmBtn} onPress={handleBuy}>
              <Text style={modalS.confirmText}>Comprar agora</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.sm },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.sm, paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: '#222',
    gap: SPACING.sm,
  },
  backBtn:       { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  backIcon:      { fontSize: 22, color: COLORS.text },
  headerCenter:  { flex: 1 },
  headerTitle:   { color: COLORS.text, fontSize: 15, fontWeight: 'bold' },
  headerSub:     { color: COLORS.textSecondary, fontSize: 11, marginTop: 1 },
  freeCount:     { alignItems: 'center', backgroundColor: '#1a2a1a', borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4 },
  freeCountNum:  { color: COLORS.success, fontSize: 16, fontWeight: 'bold', lineHeight: 18 },
  freeCountLabel:{ color: COLORS.success, fontSize: 9, opacity: 0.7 },

  // Tela do cinema
  screenWrap:  { alignItems: 'center', paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  screenGlow:  { width: '65%', height: 4, borderRadius: 2, backgroundColor: COLORS.primary + '33', marginBottom: 3 },
  screenBar:   { width: '70%', height: 5, borderRadius: 3, backgroundColor: COLORS.primary + '99' },
  screenLabel: { color: COLORS.textMuted, fontSize: 9, letterSpacing: 5, marginTop: 5 },

  // Loading
  loadingWrap: { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.md },
  loadingText: { color: COLORS.textSecondary, fontSize: 14 },

  // Mapa
  mapWrap: { alignItems: 'center', paddingVertical: SPACING.sm },
  row:     { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  rowLabel:{ width: ROW_LABEL_W, color: COLORS.textMuted, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  aisle:   { width: AISLE_W },

  // Legenda
  legend:     { flexDirection: 'row', justifyContent: 'center', gap: SPACING.lg, paddingVertical: SPACING.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 14, height: 14, borderRadius: 3, borderWidth: 1.5 },
  legendLabel:{ color: COLORS.textSecondary, fontSize: 12 },

  // Selecionados
  selectedBox:      { backgroundColor: '#111', borderRadius: RADIUS.md, padding: SPACING.sm, marginHorizontal: SPACING.xs, borderWidth: 1, borderColor: COLORS.primary + '33' },
  selectedBoxTitle: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 },
  selectedBoxHint:  { color: COLORS.textMuted, fontWeight: '400', fontSize: 11 },
  chipsRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:             { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary + '22', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: COLORS.primary + '55' },
  chipText:         { color: COLORS.primary, fontSize: 13, fontWeight: 'bold' },
  chipX:            { color: COLORS.primary, fontSize: 10, opacity: 0.7 },

  // Footer
  footer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? SPACING.md : SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderTopColor: '#2a2a2a',
    gap: SPACING.md,
    ...SHADOW.medium,
  },
  footerLeft:   { flex: 1 },
  footerLabel:  { color: COLORS.textSecondary, fontSize: 12 },
  footerTotal:  { color: COLORS.gold, fontSize: 20, fontWeight: 'bold', marginTop: 1 },
  buyBtn:       { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 13, paddingHorizontal: SPACING.lg },
  buyBtnOff:    { opacity: 0.35 },
  buyBtnText:   { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});

const modalS = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
    borderTopWidth: 1, borderColor: '#2a2a2a',
  },
  handle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: '#444', alignSelf: 'center', marginBottom: SPACING.md },
  sheetTitle:   { color: COLORS.text, fontSize: 17, fontWeight: 'bold' },
  sheetMovie:   { color: COLORS.primary, fontSize: 13, marginTop: 3 },
  sheetSession: { color: COLORS.textMuted, fontSize: 11, marginTop: 2, marginBottom: SPACING.sm },

  seatsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.md },
  seatBadge:     { backgroundColor: COLORS.primary + '22', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: COLORS.primary + '55' },
  seatBadgeText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 13 },

  summaryBox:    { backgroundColor: '#111', borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.md },
  summaryRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e1e1e' },
  summaryLabel:  { color: COLORS.textMuted, fontSize: 13 },
  summaryValue:  { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  totalRow:      { borderBottomWidth: 0, paddingTop: 10 },
  totalLabel:    { color: COLORS.textSecondary, fontSize: 15, fontWeight: 'bold' },
  totalValue:    { color: COLORS.gold, fontSize: 20, fontWeight: 'bold' },

  btnRow:      { flexDirection: 'row', gap: SPACING.sm },
  cancelBtn:   { flex: 1, paddingVertical: 13, borderRadius: RADIUS.md, alignItems: 'center', backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#333' },
  cancelText:  { color: COLORS.textSecondary, fontWeight: 'bold', fontSize: 14 },
  confirmBtn:  { flex: 2, paddingVertical: 13, borderRadius: RADIUS.md, alignItems: 'center', backgroundColor: COLORS.primary },
  confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
