import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { styles, cores } from '../styles/styles';
import { atualizarProduto, buscarProdutoCompleto } from '../services/api';

const TIPOS_CODIGO_BARRAS = ['ean13', 'ean8', 'upc_a', 'upc_e'];
const CORES_NUTRISCORE = {
  a: '#038141',
  b: '#85BB2F',
  c: '#FECB02',
  d: '#EE8100',
  e: '#E63E11',
};

function codigoValido(codigo) {
  return /^\d{8,14}$/.test(codigo);
}

function formatarAlergenos(alergenos) {
  const lista = Array.isArray(alergenos)
    ? alergenos
    : String(alergenos || '').split(',');

  const formatados = lista
    .map((item) => String(item).replace(/^[a-z]{2}:/, '').replace(/-/g, ' ').trim())
    .filter(Boolean);

  return formatados.length ? formatados.join(', ') : 'Não informado';
}

function DetalhesProduto({ produto }) {
  const nutrimentos = produto.nutriments || {};
  const nutriScore = String(produto.nutriScore || '').toLowerCase();
  const nutrientes = [
    ['Calorias', nutrimentos.calories, 'kcal'],
    ['Carboidratos', nutrimentos.carbohydrates, 'g'],
    ['Açúcares', nutrimentos.sugars, 'g'],
    ['Gorduras', nutrimentos.fat, 'g'],
    ['Gorduras saturadas', nutrimentos.saturatedFat, 'g'],
    ['Proteínas', nutrimentos.proteins, 'g'],
    ['Fibras', nutrimentos.fiber, 'g'],
    ['Sal', nutrimentos.salt, 'g'],
  ].filter(([, valor]) => valor !== null && valor !== undefined && valor !== '');

  return (
    <View style={local.detalhes}>
      <View style={local.linhaNutriScore}>
        <Text style={local.detalheTitulo}>Nutri-Score</Text>
        <View style={[
          local.etiquetaNutriScore,
          { backgroundColor: CORES_NUTRISCORE[nutriScore] || cores.textoClaro },
        ]}>
          <Text style={local.textoNutriScore}>
            {nutriScore && nutriScore !== 'unknown'
              ? nutriScore.toUpperCase()
              : 'Não informado'}
          </Text>
        </View>
      </View>
      {produto.novaGroup ? (
        <Text style={local.detalheTexto}>Grupo NOVA: {produto.novaGroup}</Text>
      ) : null}

      <Text style={local.detalheTitulo}>Nutrientes por 100 g</Text>
      {nutrientes.length ? nutrientes.map(([nome, valor, unidade]) => (
        <Text key={nome} style={local.detalheTexto}>
          {nome}: {valor} {unidade}
        </Text>
      )) : <Text style={local.detalheTexto}>Não informado</Text>}

      <Text style={local.detalheTitulo}>Ingredientes</Text>
      <Text style={local.detalheTexto}>{produto.ingredients || 'Não informado'}</Text>
      <Text style={local.detalheTitulo}>Alérgenos</Text>
      <Text style={local.detalheTexto}>{formatarAlergenos(produto.allergens)}</Text>
    </View>
  );
}

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();

  const [scannerTravado, setScannerTravado] = useState(false);
  const [codigo, setCodigo] = useState(null);
  const [entradaManualVisivel, setEntradaManualVisivel] = useState(false);
  const [codigoManual, setCodigoManual] = useState('');
  const [erroManual, setErroManual] = useState(null);
  const [lanternaLigada, setLanternaLigada] = useState(false);
  const [produto, setProduto] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [erroProduto, setErroProduto] = useState(null);

  useFocusEffect(
    useCallback(() => {
      setScannerTravado(false);
    }, []),
  );

  async function tratarCodigo(valor) {
    const limpo = String(valor).trim();

    if (!codigoValido(limpo)) {
      setErroManual('Código inválido. Use de 8 a 14 dígitos.');
      return;
    }

    setErroManual(null);
    setErroProduto(null);
    setProduto(null);
    setBuscando(true);
    setEntradaManualVisivel(false);
    setCodigoManual('');
    setCodigo(limpo);

    try {
      const encontrado = await buscarProdutoCompleto(limpo);
      setProduto(encontrado);
    } catch (erro) {
      console.log('Erro ao consultar produto:', erro);
      setErroProduto(
        erro.message.includes('não encontrado')
          ? 'Produto ainda não cadastrado.'
          : erro.message,
      );
    } finally {
      setBuscando(false);
    }
  }

  function aoEscanear({ data }) {
    if (scannerTravado) return;
    setScannerTravado(true);
    tratarCodigo(data);
  }

  async function alternarFavorito() {
    if (!produto) return;

    try {
      const atualizado = await atualizarProduto(produto._id, {
        favorite: !produto.favorite,
      });
      setProduto(atualizado);
    } catch (_erro) {
      setErroProduto(
        _erro.message || 'Não foi possível atualizar o favorito.',
      );
    }
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('Favorites')} hitSlop={12}>
          <Ionicons name="star" size={24} color={cores.laranja} />
        </Pressable>
      ),
    });
  }, [navigation]);

  if (!permission) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centro}>
        <Text style={styles.titulo}>Liberar câmera</Text>
        <Text style={[styles.subtitulo, { marginTop: 8, textAlign: 'center' }]}>
          O app precisa da câmera para ler o código de barras.
        </Text>
        <Pressable style={[styles.botao, { marginTop: 24 }]} onPress={requestPermission}>
          <Text style={styles.botaoTexto}>Permitir acesso</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={lanternaLigada}
          barcodeScannerSettings={{ barcodeTypes: TIPOS_CODIGO_BARRAS }}
          onBarcodeScanned={scannerTravado ? undefined : aoEscanear}
        />
      )}

      <View style={local.mira} pointerEvents="none" />

      <View style={local.barraInferior}>
        <Pressable
          style={local.botaoBarra}
          onPress={() => setLanternaLigada((ligada) => !ligada)}
        >
          <Ionicons name={lanternaLigada ? 'flash' : 'flash-off'} size={22} color="#fff" />
        </Pressable>
        <Pressable
          style={local.botaoBarra}
          onPress={() => {
            setErroManual(null);
            setEntradaManualVisivel(true);
          }}
        >
          <Ionicons name="keypad" size={22} color="#fff" />
          <Text style={local.botaoBarraTexto}>Digitar código</Text>
        </Pressable>
      </View>

      {codigo && (
        <View style={local.card}>
          <Text style={local.cardRotulo}>Código lido</Text>
          <Text style={local.cardCodigo}>{codigo}</Text>
          {buscando && (
            <View style={local.status}>
              <ActivityIndicator size="small" />
              <Text style={local.statusTexto}>Consultando backend...</Text>
            </View>
          )}
          {produto && (
            <View style={local.status}>
              {produto.imageUrl ? (
                <Image source={{ uri: produto.imageUrl }} style={local.produtoImagem} />
              ) : null}
              <View style={local.produtoInfo}>
                <Text style={local.produtoNome}>{produto.name}</Text>
                {produto.brand ? (
                  <Text style={local.produtoMarca}>{produto.brand}</Text>
                ) : null}
              </View>
              <Pressable
                onPress={alternarFavorito}
                hitSlop={12}
                accessibilityLabel={produto.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Ionicons
                  name={produto.favorite ? 'star' : 'star-outline'}
                  size={30}
                  color={cores.laranja}
                />
              </Pressable>
            </View>
          )}
          {produto && (
            <ScrollView
              style={local.detalhesScroll}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              <DetalhesProduto produto={produto} />
            </ScrollView>
          )}
          {erroProduto && <Text style={local.erro}>{erroProduto}</Text>}
          <Pressable
            style={[styles.botao, { marginTop: 12 }]}
            onPress={() => {
              setCodigo(null);
              setProduto(null);
              setErroProduto(null);
              setScannerTravado(false);
            }}
          >
            <Text style={styles.botaoTexto}>Escanear outro</Text>
          </Pressable>
        </View>
      )}

      <Modal visible={entradaManualVisivel} transparent animationType="fade">
        <View style={local.modalFundo}>
          <View style={local.modalCaixa}>
            <Text style={styles.titulo}>Digitar código</Text>
            <Text style={[styles.subtitulo, { marginTop: 4 }]}>
              8 a 14 dígitos, sem espaços
            </Text>
            <TextInput
              style={local.input}
              value={codigoManual}
              onChangeText={(texto) => {
                setCodigoManual(texto.replace(/\D/g, ''));
                setErroManual(null);
              }}
              placeholder="7891000100103"
              keyboardType="number-pad"
              maxLength={14}
              autoFocus
            />
            {erroManual && <Text style={local.erro}>{erroManual}</Text>}
            <Pressable
              style={[styles.botao, { marginTop: 16 }]}
              onPress={() => tratarCodigo(codigoManual)}
            >
              <Text style={styles.botaoTexto}>Buscar</Text>
            </Pressable>
            <Pressable
              style={local.cancelar}
              onPress={() => setEntradaManualVisivel(false)}
            >
              <Text style={styles.subtitulo}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const local = StyleSheet.create({
  mira: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    height: 140,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
  },
  barraInferior: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  botaoBarra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  botaoBarraTexto: { color: '#fff', fontWeight: '600' },
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 100,
    maxHeight: '62%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  cardRotulo: { fontSize: 13, color: cores.textoClaro },
  cardCodigo: { fontSize: 24, fontWeight: '700', color: cores.texto, letterSpacing: 1 },
  status: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusTexto: { color: cores.textoClaro },
  produtoImagem: { width: 56, height: 56, borderRadius: 10 },
  produtoInfo: { flex: 1 },
  produtoNome: { fontSize: 16, fontWeight: '700', color: cores.texto },
  produtoMarca: { marginTop: 2, color: cores.textoClaro },
  detalhesScroll: { marginTop: 12 },
  detalhes: {
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    paddingTop: 12,
  },
  detalheTitulo: {
    color: cores.texto,
    fontSize: 14,
    fontWeight: '700',
  },
  linhaNutriScore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  etiquetaNutriScore: {
    minWidth: 84,
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  textoNutriScore: { color: '#fff', fontWeight: '800' },
  detalheTexto: {
    color: cores.texto,
    marginTop: 4,
    marginBottom: 10,
  },
  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCaixa: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  input: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    marginTop: 12,
  },
  erro: { color: cores.vermelho, marginTop: 8 },
  cancelar: { alignItems: 'center', marginTop: 12, padding: 8 },
});