export type LocalStorageName = 'microphones' | 'favoritesongs' | 'allowAutoplay'

export const setItem = (name: LocalStorageName, item: any) => {
  localStorage.setItem(name, JSON.stringify(item))
}

export const getItem = (name: LocalStorageName) => {
  const string = localStorage.getItem(name)
  return string ? JSON.parse(string) : null
}

export const addOneItem = (name: LocalStorageName, item: any) => {
  const currentItems = getItem(name) || []
  setItem(name, [...currentItems, item])
}

export const removeOneItem = (name: LocalStorageName, item: any) => {
  const currentItems = getItem(name) || []
  setItem(
    name,
    currentItems.filter((currentItem: any) => currentItem !== item)
  )
}

export const itemExists = (name: LocalStorageName, item: any): boolean => {
  const currentItems = getItem(name) || []
  return Boolean(currentItems.find((currentItem: any) => currentItem === item))
}

export const removeItem = (name: LocalStorageName) => {
  localStorage.removeItem(name)
}
