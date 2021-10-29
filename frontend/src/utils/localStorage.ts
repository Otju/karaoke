export const getFavorited = () => {
  const valueFromLocalStorage = window.localStorage.getItem('favorited')
  const favorited: string[] = valueFromLocalStorage ? JSON.parse(valueFromLocalStorage) : []
  return favorited
}

export const setFavorited = (favorited: string[]) => {
  window.localStorage.setItem('favorited', JSON.stringify(favorited))
}

export const addFavorited = (newFavorited: string) => {
  const favorited = getFavorited()
  favorited.push(newFavorited)
  setFavorited(favorited)
}

export const deleteFavorited = (favoritedToDelete: string) => {
  const favorited = getFavorited()
  const newFavorited = favorited.filter((item) => item !== favoritedToDelete)
  setFavorited(newFavorited)
}

export const checkIfFavorited = (favoritedToCheck: string) => {
  const favorited = getFavorited()
  return favorited.some((item) => item === favoritedToCheck)
}
