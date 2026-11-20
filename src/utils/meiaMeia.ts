import type { MeiaMeiaGroup, Product, Category } from '@/types'

/**
 * Tabela única de combinações permitidas para meio a meio.
 * Chave = grupo do 1º sabor; valor = grupos permitidos para o 2º sabor.
 *
 * Regras:
 * - Tradicional + Tradicional
 * - Tradicional + Doce
 * - Premium + Premium
 * - Premium + Doce
 * - Doce + Doce
 * Não permitido: Tradicional + Premium (em qualquer ordem).
 */
export const MEIA_MEIA_ALLOWED: Record<MeiaMeiaGroup, MeiaMeiaGroup[]> = {
  tradicional: ['tradicional', 'doce'],
  premium: ['premium', 'doce'],
  doce: ['tradicional', 'premium', 'doce'],
}

export function isAllowedCombination(a: MeiaMeiaGroup, b: MeiaMeiaGroup): boolean {
  return MEIA_MEIA_ALLOWED[a]?.includes(b) ?? false
}

/**
 * Preço do meio a meio: por padrão, cobra o valor do sabor mais caro.
 * Ajuste esta função se a pizzaria usar outra regra (ex.: média, maior + taxa).
 */
export function calcularPrecoMeioAMeio(price1: number, price2: number): number {
  return Math.max(price1, price2)
}

export function productPrice(p: Product): number {
  return p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price
}

export function validateSplitCombination(
  group1: MeiaMeiaGroup | undefined,
  group2: MeiaMeiaGroup | undefined,
): boolean {
  if (!group1 || !group2) return false
  return isAllowedCombination(group1, group2)
}

/**
 * Resolve o grupo de uma categoria, inferindo por nome (ou ordem) quando
 * o campo meiaMeiaGroup não estiver definido (compatibilidade com dados
 * antigos / antes da migração).
 */
export function resolveMeiaMeiaGroup(
  category: Category | undefined,
  allCategories?: Category[],
): MeiaMeiaGroup | undefined {
  if (!category) return undefined
  if (category.meiaMeiaGroup) return category.meiaMeiaGroup
  if (!category.allowsMeiaMeia) return undefined
  const n = category.name.toLowerCase()
  if (n.includes('tradicional')) return 'tradicional'
  if (n.includes('premium')) return 'premium'
  if (n.includes('doce')) return 'doce'
  // fallback por ordem entre as categorias que permitem meia-meia
  const pool = (allCategories ?? []).filter((c) => c.allowsMeiaMeia)
  const idx = pool.findIndex((c) => c.id === category.id)
  if (idx === 0) return 'tradicional'
  if (idx === 1) return 'premium'
  if (idx === 2) return 'doce'
  return undefined
}