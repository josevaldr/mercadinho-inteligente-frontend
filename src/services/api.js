export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.10:3000/api';
export const OFF_URL = 'https://world.openfoodfacts.org/api/v3/product';
export const USER_AGENT = 'MercadinhoInteligente/1.0 (contato@exemplo.com)';

export const OFF_FIELDS = [
  'product_name',
  'product_name_pt',
  'brands',
  'quantity',
  'image_front_url',
  'image_url',
  'nutriscore_grade',
  'nova_group',
  'ingredients_text_pt',
  'ingredients_text',
  'allergens_tags',
  'nutriments',
].join(',');

async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch (networkError) {
    throw new Error(`Não foi possível acessar ${API_URL}: ${networkError.message}`);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.erro || `Erro HTTP ${response.status}`);
  }

  return body;
}

export function listarProdutos() {
  return apiRequest('/products');
}

export function buscarProdutoPorCodigo(barcode) {
  return apiRequest(`/products/barcode/${encodeURIComponent(barcode)}`);
}

export function criarProduto(produto) {
  return apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify(produto),
  });
}

export function atualizarProduto(id, dados) {
  return apiRequest(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  });
}

export function listarFavoritos() {
  return apiRequest('/products/favorites');
}

export async function buscarProdutoCompleto(barcode) {
  try {
    return await buscarProdutoPorCodigo(barcode);
  } catch (erro) {
    if (!erro.message.includes('não encontrado')) {
      throw erro;
    }
  }

  const response = await fetch(
    `${OFF_URL}/${encodeURIComponent(barcode)}?fields=${encodeURIComponent(OFF_FIELDS)}`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
    },
  );

  if (!response.ok) {
    throw new Error('Produto não encontrado.');
  }

  const data = await response.json();
  if (data.status === 0 || !data.product) {
    throw new Error('Produto não encontrado.');
  }

  const source = data.product;
  const nutriments = source.nutriments || {};
  const novaGroup = Number(source.nova_group);
  const nutriScoreGrade = String(source.nutriscore_grade || '').toLowerCase();

  const produto = {
    barcode,
    name: source.product_name_pt || source.product_name || 'Produto sem nome',
    brand: source.brands || '',
    quantity: source.quantity || '',
    imageUrl: source.image_front_url || source.image_url || '',
    nutriScore: ['a', 'b', 'c', 'd', 'e'].includes(nutriScoreGrade)
      ? nutriScoreGrade
      : 'unknown',
    novaGroup: novaGroup >= 1 && novaGroup <= 4 ? novaGroup : null,
    nutriments: {
      calories: nutriments['energy-kcal_100g'] ?? nutriments.energy_kcal_100g ?? null,
      carbohydrates: nutriments.carbohydrates_100g ?? null,
      sugars: nutriments.sugars_100g ?? null,
      fat: nutriments.fat_100g ?? null,
      saturatedFat: nutriments['saturated-fat_100g'] ?? null,
      proteins: nutriments.proteins_100g ?? null,
      fiber: nutriments.fiber_100g ?? null,
      salt: nutriments.salt_100g ?? null,
    },
    ingredients: source.ingredients_text_pt || source.ingredients_text || '',
    allergens: source.allergens_tags || [],
    favorite: false,
  };

  return criarProduto(produto);
}