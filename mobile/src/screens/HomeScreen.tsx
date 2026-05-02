import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView, TextInput
} from 'react-native';
import { getProducts } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOW } from '../types/theme';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category_name: string;
  image_url?: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  'Pipoca': '🍿',
  'Bebidas': '🥤',
  'Combos': '🎬',
  'Doces': '🍬',
  'Todos': '✨',
};

export default function HomeScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['Todos']);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [search, setSearch] = useState('');
  const { addItem, itemCount } = useCart();
  const { user } = useAuth();

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      const data: Product[] = response.data;
      setProducts(data);

      // Extrai categorias únicas dos produtos
      const cats = ['Todos', ...Array.from(new Set(data.map(p => p.category_name).filter(Boolean)))];
      setCategories(cats);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const filtered = products.filter(p => {
    const matchCat = selectedCategory === 'Todos' || p.category_name === selectedCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Agrupa em pares para grid 2 colunas manual
  const rows: Product[][] = [];
  for (let i = 0; i < filtered.length; i += 2) {
    rows.push(filtered.slice(i, i + 2));
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ fontSize: 52 }}>🍿</Text>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.md }} />
        <Text style={styles.loadingText}>Carregando cardápio...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🍿 Cardápio</Text>
          <Text style={styles.headerSub}>Olá, {user?.name?.split(' ')[0]}! 🎬</Text>
        </View>
        <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Pedidos')}>
          <Text style={styles.cartIcon}>🛒</Text>
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Luzes decorativas */}
      <View style={styles.lightsRow}>
        {[...Array(12)].map((_, i) => (
          <View key={i} style={[styles.light, i % 2 === 0 && styles.lightGold]} />
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchProducts(); }}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Busca */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIconText}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar produto..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Categorias */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
          style={styles.categoriesScroll}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, selectedCategory === cat && styles.chipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={styles.chipEmoji}>{CATEGORY_EMOJI[cat] || '🎬'}</Text>
              <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Contador */}
        <Text style={styles.countText}>
          {filtered.length} {filtered.length === 1 ? 'item' : 'itens'}{selectedCategory !== 'Todos' ? ` em ${selectedCategory}` : ''}
        </Text>

        {/* Grid de produtos */}
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>😔</Text>
            <Text style={styles.emptyTitle}>Nenhum produto encontrado</Text>
            <Text style={styles.emptyText}>
              {search ? `Sem resultados para "${search}"` : 'Nenhum produto nesta categoria.'}
            </Text>
            {search ? (
              <TouchableOpacity style={styles.clearBtn} onPress={() => setSearch('')}>
                <Text style={styles.clearBtnText}>Limpar busca</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map(item => (
                <View key={item.id} style={styles.card}>
                  {/* Imagem / emoji */}
                  <View style={styles.cardTop}>
                    <Text style={styles.cardEmoji}>
                      {CATEGORY_EMOJI[item.category_name] || '🎬'}
                    </Text>
                    {item.stock === 0 && (
                      <View style={[styles.stockBadge, { backgroundColor: '#444' }]}>
                        <Text style={styles.stockBadgeText}>Esgotado</Text>
                      </View>
                    )}
                    {item.stock > 0 && item.stock <= 5 && (
                      <View style={styles.stockBadge}>
                        <Text style={styles.stockBadgeText}>Últimas!</Text>
                      </View>
                    )}
                  </View>

                  {/* Corpo */}
                  <View style={styles.cardBody}>
                    <Text style={styles.cardCategory}>{item.category_name}</Text>
                    <Text style={styles.cardName}>{item.name}</Text>
                    <Text style={styles.cardPrice}>R$ {Number(item.price).toFixed(2)}</Text>

                    <TouchableOpacity
                      style={[styles.addBtn, item.stock === 0 && styles.addBtnDisabled]}
                      onPress={() => {
                        if (item.stock > 0) {
                          addItem({
                            id: item.id,
                            name: item.name,
                            price: Number(item.price),
                            quantity: 1,
                            image_url: item.image_url,
                          });
                        }
                      }}
                      disabled={item.stock === 0}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addBtnText}>
                        {item.stock === 0 ? 'Esgotado' : '+ Adicionar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Preenche espaço se linha com 1 item */}
              {row.length === 1 && <View style={styles.cardPlaceholder} />}
            </View>
          ))
        )}

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    fontSize: 15,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cartButton: {
    position: 'relative',
    padding: SPACING.sm,
  },
  cartIcon: { fontSize: 28 },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Luzes
  lightsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  light: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  lightGold: { backgroundColor: '#FFD700' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.md },

  // Busca
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: SPACING.md,
  },
  searchIconText: { fontSize: 16, marginRight: SPACING.sm },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    paddingVertical: 12,
  },
  clearSearch: {
    color: COLORS.textMuted,
    fontSize: 16,
    paddingLeft: SPACING.sm,
  },

  // Categorias
  categoriesScroll: { marginBottom: SPACING.md },
  categoriesContent: { gap: SPACING.sm, paddingRight: SPACING.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#333',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipEmoji: { fontSize: 14 },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: { color: '#fff' },

  // Contador
  countText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: SPACING.md,
  },

  // Grid
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    ...SHADOW.small,
  },
  cardPlaceholder: { flex: 1 },

  cardTop: {
    height: 100,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardEmoji: { fontSize: 44 },
  stockBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  stockBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  cardBody: { padding: SPACING.sm },
  cardCategory: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 3,
    lineHeight: 17,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.gold,
    marginTop: SPACING.xs,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  addBtnDisabled: { backgroundColor: '#333' },
  addBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  clearBtn: {
    marginTop: SPACING.lg,
    paddingVertical: 10,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  clearBtnText: { color: COLORS.primary, fontWeight: 'bold' },
});
