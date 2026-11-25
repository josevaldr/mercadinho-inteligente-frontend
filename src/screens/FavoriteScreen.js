import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { cores, styles } from '../styles/styles';
import { atualizarProduto, listarFavoritos } from '../services/api';

function formatarAlergenos(allergens) {
  if (!allergens) return [];
  const lista = Array.isArray(allergens) ? allergens : String(allergens).split(',');
  return lista
    .map((alergeno) => String(alergeno).replace(/^[a-z]{2}:/, '').replace(/-/g, ' ').trim())
    .filter(Boolean);
}

export default function FavoriteScreen() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setProdutos(await listarFavoritos());
    } catch (_carregarErro) {
      setErro('Não foi possível carregar os favoritos.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  const removerFavorito = useCallback(async (id) => {
    setProdutos((atuais) => atuais.filter((produto) => produto._id !== id));
    try {
      await atualizarProduto(id, { favorite: false });
    } catch (_removerErro) {
      setErro('Não foi possível remover o favorito.');
      carregar();
    }
  }, [carregar]);

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={cores.laranja} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {erro ? <Text style={local.erro}>{erro}</Text> : null}
      {produtos.length === 0 ? (
        <View style={styles.centro}>
          <Ionicons name="star-outline" size={48} color={cores.textoClaro} />
          <Text style={[styles.subtitulo, { marginTop: 12 }]}>Nenhum favorito</Text>
          <Text style={local.vazio}>Escaneie um produto e marque a estrela.</Text>
        </View>
      ) : (
        <FlatList
          data={produtos}
          keyExtractor={(produto) => produto._id}
          contentContainerStyle={local.lista}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={() => {
                setAtualizando(true);
                carregar();
              }}
              tintColor={cores.laranja}
            />
          }
          renderItem={({ item }) => (
            <View style={local.card}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={local.imagem} />
              ) : (
                <View style={[local.imagem, local.semImagem]}>
                  <Ionicons name="cube-outline" size={28} color={cores.textoClaro} />
                </View>
              )}
              <View style={local.info}>
                <Text style={local.nome} numberOfLines={2}>{item.name}</Text>
                {item.brand ? <Text style={local.marca}>{item.brand}</Text> : null}
                {item.quantity ? <Text style={local.detalhe}>{item.quantity}</Text> : null}
                {item.nutriScore && item.nutriScore !== 'unknown' ? (
                  <Text style={local.detalhe}>
                    Nutri-Score: {String(item.nutriScore).toUpperCase()}
                  </Text>
                ) : null}
                {item.ingredients ? (
                  <Text style={local.detalhe} numberOfLines={3}>
                    Ingredientes: {item.ingredients}
                  </Text>
                ) : null}
                {formatarAlergenos(item.allergens).length ? (
                  <Text style={local.detalhe}>
                    Alérgenos: {formatarAlergenos(item.allergens).join(', ')}
                  </Text>
                ) : null}
                {item.nutriments ? (
                  <Text style={local.detalhe}>
                    Nutrientes/100 g: {[
                      item.nutriments.calories != null ? `${item.nutriments.calories} kcal` : null,
                      item.nutriments.carbohydrates != null ? `${item.nutriments.carbohydrates} g carboidratos` : null,
                      item.nutriments.sugars != null ? `${item.nutriments.sugars} g açúcares` : null,
                      item.nutriments.proteins != null ? `${item.nutriments.proteins} g proteínas` : null,
                      item.nutriments.fat != null ? `${item.nutriments.fat} g gorduras` : null,
                      item.nutriments.salt != null ? `${item.nutriments.salt} g sal` : null,
                    ].filter(Boolean).join(' • ') || 'Não informado'}
                  </Text>
                ) : null}
                <Text style={local.codigo}>{item.barcode}</Text>
              </View>
              <Pressable
                onPress={() => removerFavorito(item._id)}
                hitSlop={12}
                accessibilityLabel="Remover dos favoritos"
              >
                <Ionicons name="star" size={30} color={cores.laranja} />
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const local = StyleSheet.create({
  lista: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
  },
  imagem: { width: 72, height: 72, borderRadius: 12 },
  semImagem: { alignItems: 'center', justifyContent: 'center', backgroundColor: cores.fundo },
  info: { flex: 1 },
  nome: { color: cores.texto, fontSize: 16, fontWeight: '700' },
  marca: { marginTop: 4, color: cores.texto, fontWeight: '600' },
  detalhe: { marginTop: 2, color: cores.textoClaro },
  codigo: { marginTop: 6, color: cores.textoClaro, fontSize: 12 },
  vazio: { marginTop: 8, color: cores.textoClaro, textAlign: 'center' },
  erro: { margin: 16, color: cores.vermelho, textAlign: 'center' },
});
