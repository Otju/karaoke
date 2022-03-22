const getScoreText = (scorePercentage: number | undefined) => {
  if (scorePercentage === undefined) {
    return null
  }
  if (scorePercentage >= 0.9) {
    return ['Perfect!', 'green']
  } else if (scorePercentage >= 0.8) {
    return ['Amazing!', 'green']
  } else if (scorePercentage >= 0.7) {
    return ['Great!', 'green']
  } else if (scorePercentage >= 0.6) {
    return ['Good', 'green']
  } else if (scorePercentage >= 0.4) {
    return ['Decent', 'yellow']
  } else if (scorePercentage >= 0.2) {
    return ['Not that bad', 'red']
  } else {
    return ['Dude, really?', 'red']
  }
}

export default getScoreText
