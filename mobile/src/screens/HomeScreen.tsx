import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, RefreshControl, ScrollView
} from 'react-native';
import { getProducts } from '../services/api';
import { useCart } from '../context/CartContext';
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

export default function HomeScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const { addItem, itemCount } = useCart();

  const categories = ['Todos', 'Pipoca', 'Bebidas', 'Combos', 'Doces'];

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      setProducts(response.data);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const filteredProducts = selectedCategory === 'Todos'
    ? products
    : products.filter(p => p.category_name === selectedCategory);

  const handleAddToCart = (product: Product) => {
    addItem({ id: product.id, name: product.name, price: product.price, quantity: 1, image_url: product.image_url });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando cardápio...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🍿 Pipocalizando</Text>
          <Text style={styles.headerSub}>O que vai querer hoje?</Text>
        </View>
        <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartIcon}>🛒</Text>
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerText}>🎬 Compre sua pipoca e aproveite o filme!</Text>
      </View>

      {/* Categorias */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Produtos */}
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProducts(); }} tintColor={COLORS.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
            <View style={styles.cardImage}>
              <Text style={styles.cardEmoji}>
                {item.category_name === 'Pipoca' ? '🍿' :
                 item.category_name === 'Bebidas' ? '🥤' :
                 item.category_name === 'Combos' ? '🎬' : '🍬'}
              </Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardCategory}>{item.category_name}</Text>
              <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.cardPrice}>R$ {item.price.toFixed(2)}</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => handleAddToCart(item)}>
                <Text style={styles.addButtonText}>+ Adicionar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum produto encontrado.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingTop: SPACING.xxl, backgroundColor: COLORS.surface },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  cartButton: { position: 'relative', padding: SPACING.sm },
  cartIcon: { fontSize: 28 },
  cartBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.primary, borderRadius: RADIUS.full, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  banner: { backgroundColor: COLORS.primaryDark, padding: SPACING.md, alignItems: 'center' },
  bannerText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  categoriesScroll: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, maxHeight: 56 },
  categoryChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, marginRight: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  categoryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryChipText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  categoryChipTextActive: { color: '#fff' },
  list: { padding: SPACING.sm },
  card: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md, margin: SPACING.sm, overflow: 'hidden', ...SHADOW.small },
  cardImage: { height: 100, backgroundColor: COLORS.surfaceLight, justifyContent: 'center', alignItems: 'center' },
  cardEmoji: { fontSize: 48 },
  cardBody: { padding: SPACING.sm },
  cardCategory: { fontSize: 11, color: COLORS.primary, fontWeight: '600', textTransform: 'uppercase' },
  cardName: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginTop: 2 },
  cardPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.gold, marginTop: SPACING.xs },
  addButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, padding: SPACING.sm, alignItems: 'center', marginTop: SPACING.sm },
  addButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  empty: { alignItems: 'center', marginTop: SPACING.xxl },
  emptyText: { color: COLORS.textSecondary, fontSize: 16 },
});
