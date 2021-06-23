interface RadiusInput {
  tl?: number
  tr?: number
  br?: number
  bl?: number
}

interface Radius {
  tl: number
  tr: number
  br: number
  bl: number
}

type RadiusField = 'tl' | 'tr' | 'br' | 'bl'

export const roundRect = (
  ctx: any,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | RadiusInput,
  fill = true,
  stroke = true
) => {
  if (typeof radius === 'number') {
    radius = { tl: radius, tr: radius, br: radius, bl: radius }
  } else {
    const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 }
    for (const side in defaultRadius) {
      const sideAsType = side as RadiusField
      radius[sideAsType] = radius[sideAsType] || defaultRadius[sideAsType]
    }
  }
  const rad = radius as Radius
  ctx.beginPath()
  ctx.moveTo(x + rad.tl, y)
  ctx.lineTo(x + width - rad.tr, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + rad.tr)
  ctx.lineTo(x + width, y + height - rad.br)
  ctx.quadraticCurveTo(x + width, y + height, x + width - rad.br, y + height)
  ctx.lineTo(x + rad.bl, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - rad.bl)
  ctx.lineTo(x, y + rad.tl)
  ctx.quadraticCurveTo(x, y, x + rad.tl, y)
  ctx.closePath()
  if (fill) {
    ctx.fill()
  }
  if (stroke) {
    ctx.stroke()
  }
}

export const closestIndex = (num: number, arr: number[]) => {
  let curr = arr[0],
    diff = Math.abs(num - curr)
  let index = 0
  for (let val = 0; val < arr.length; val++) {
    let newdiff = Math.abs(num - arr[val])
    if (newdiff < diff) {
      diff = newdiff
      curr = arr[val]
      index = val
    }
  }
  return index
}
