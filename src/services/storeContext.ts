let currentStoreId = 'default'

export function setCurrentStoreId(id: string) {
  currentStoreId = id || 'default'
}

export function getCurrentStoreId() {
  return currentStoreId
}