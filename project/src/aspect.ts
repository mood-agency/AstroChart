import type {Points} from './radix'
import type {AspectData, Settings} from './settings'
import {radiansToDegree} from './utils'

export interface FormedAspect {
  point: {
    name: string
    position: number
  }
  toPoint: {
    name: string
    position: number
  }
  aspect: {
    name: string
    degree: number
    color: string
    orbit: number
    lineStyle: string
  }
  precision: string
}

// Long red lines = oppositions, a 180 degree aspect.
// Shorter red lines = squares, a 90 degree aspect.
// Longer blue lines = trines, a 120 degree aspect
// Shorter blue lines = sextiles, a 60 degree aspect
// Dashed green line = quincunxes, a150 degree aspect
// Short dotted green lines = semisextiles, a 30 degree aspect (related to the quincunx, not the sextile)
// Short dotted blue lines = semisquares, a 45 degree aspect
// Long dotted blue line = sesquisquares, a 135 degree aspect.

const DEFAULT_ASPECTS = {
  opposition: {degree: 180, orbit: 10, color: '#ff0000', lineStyle: 'solid'}, // Long red lines
  square: {degree: 90, orbit: 8, color: '#ff0000', lineStyle: 'short'}, // Shorter red lines
  trine: {degree: 120, orbit: 8, color: '#0000ff', lineStyle: 'solid'}, // Longer blue lines
  sextile: {degree: 60, orbit: 8, color: '#0000ff', lineStyle: 'short'}, // Shorter blue lines
  quincunx: {degree: 150, orbit: 8, color: '#00ff00', lineStyle: '5,5'}, // Dashed green line
  semisextile: {degree: 30, orbit: 8, color: '#00ff00', lineStyle: '2,2'}, // Short dotted green lines
  semisquare: {degree: 45, orbit: 8, color: '#0000ff', lineStyle: '1,1'}, // Short dotted blue lines
  sesquisquare: {degree: 135, orbit: 8, color: '#0000ff', lineStyle: '6,2'}, // Long dotted blue line
  conjunction: {degree: 0, orbit: 10, color: 'transparent', lineStyle: 'dashed'} // Example entry for conjunction
}

/**
 * Aspects calculator
 *
 * @class
 * @public
 * @constructor
 * @param {AspectPoints} points; {"Sun":[0], "Moon":[90], "Neptune":[120], "As":[30]}
 * @param {Object | null } settings
 */
class AspectCalculator {
  settings: Partial<Settings>
  toPoints: Points
  context: this

  constructor(toPoints: Points, settings?: Partial<Settings>) {
    if (toPoints == null) {
      throw new Error('Param \'toPoint\' must not be empty.')
    }

    this.settings = settings ?? {}
    this.settings.ASPECTS = settings?.ASPECTS ?? DEFAULT_ASPECTS

    this.toPoints = toPoints

    this.context = this
  }

  /**
   * Getter for this.toPoints
   * @see constructor
   *
   * @return {Object}
   */
  getToPoints(): Points {
    return this.toPoints
  }

  /**
   * Radix aspects
   *
   * In radix calculation is the param "points" the same as param "toPoints" in constructor
   * , but without special points such as: As,Ds, Mc, Ic, ...
   *
   *
   * @return {Array<Object>} [{"aspect":{"name":"conjunction", "degree":120}"", "point":{"name":"Sun", "position":123}, "toPoint":{"name":"Moon", "position":345}, "precision":0.5}]]
   * @param points
   */
  radix(points: Points): FormedAspect[] {
    if (points == null) {
      return []
    }

    const aspects: FormedAspect[] = []

    for (const point in points) {
      if (points.hasOwnProperty(point)) {
        for (const toPoint in this.toPoints) {
          if (this.toPoints.hasOwnProperty(toPoint)) {
            if (point !== toPoint) {
              for (const aspect in this.settings.ASPECTS) {
                if (this.hasAspect(points[point][0], this.toPoints[toPoint][0], this.settings.ASPECTS[aspect])) {
                  aspects.push(
                    {
                      aspect: {
                        name: aspect,
                        degree: this.settings.ASPECTS[aspect].degree,
                        orbit: this.settings.ASPECTS[aspect].orbit,
                        color: this.settings.ASPECTS[aspect].color,
                        lineStyle: this.settings.ASPECTS[aspect].lineStyle
                      },
                      point: {name: point, position: points[point][0]},
                      toPoint: {name: toPoint, position: this.toPoints[toPoint][0]},
                      precision: this.calcPrecision(points[point][0], this.toPoints[toPoint][0], this.settings.ASPECTS[aspect].degree).toFixed(4)
                    }
                  )
                }
              }
            }
          }
        }
      }
    }

    return aspects.sort(this.compareAspectsByPrecision)
  }

  /**
   * Transit aspects
   *
   * @param {Object} points - transiting points; {"Sun":[0, 1], "Uranus":[90, -1], "NAME":[ANGLE, SPEED]};
   * @return {Array<Object>} [{"aspect":{"name":"conjunction", "degree":120}"", "point":{"name":"Sun", "position":123}, "toPoint":{"name":"Moon", "position":345}, "precision":0.5}]]
   */
  transit(points: Points): FormedAspect[] {
    if (points == null) {
      return []
    }

    const aspects = []

    for (const point in points) {
      if (points.hasOwnProperty(point)) {
        for (const toPoint in this.toPoints) {
          if (this.toPoints.hasOwnProperty(toPoint)) {
            for (const aspect in this.settings.ASPECTS) {
              if (this.hasAspect(points[point][0], this.toPoints[toPoint][0], this.settings.ASPECTS[aspect])) {
                let precision = this.calcPrecision(points[point][0], this.toPoints[toPoint][0], this.settings.ASPECTS[aspect].degree)

                // -1 : is approaching to aspect
                // +1 : is moving away
                if (this.isTransitPointApproachingToAspect(this.settings.ASPECTS[aspect].degree, this.toPoints[toPoint][0], points[point][0])) {
                  precision *= -1
                }

                // if transit has speed value && transit is retrograde
                if (points[point][1] && points[point][1] < 0) {
                  precision *= -1
                }

                aspects.push(
                  {
                    aspect: {
                      name: aspect,
                      degree: this.settings.ASPECTS[aspect].degree,
                      orbit: this.settings.ASPECTS[aspect].orbit,
                      color: this.settings.ASPECTS[aspect].color,
                      lineStyle: this.settings.ASPECTS[aspect].lineStyle
                    },
                    point: {name: point, position: points[point][0]},
                    toPoint: {name: toPoint, position: this.toPoints[toPoint][0]},
                    precision: precision.toFixed(4)
                  }
                )
              }
            }
          }
        }
      }
    }

    return aspects.sort(this.compareAspectsByPrecision)
  }

  /*
  * @private
   * @param {double} point
   * @param {double} toPoint
   * @param {Array} aspects; [DEGREE, ORBIT]
   */
  hasAspect(point: number, toPoint: number, aspect: AspectData): boolean {
    let result = false

    let gap = Math.abs(point - toPoint)

    if (gap > radiansToDegree(Math.PI)) {
      gap = radiansToDegree(2 * Math.PI) - gap
    }

    const orbitMin = aspect.degree - (aspect.orbit / 2)
    const orbitMax = aspect.degree + (aspect.orbit / 2)

    if (orbitMin <= gap && gap <= orbitMax) {
      result = true
    }

    return result
  }

  /**
   * Calculates the precision between two points and an aspect.
   *
   * @param {number} point - The starting point.
   * @param {number} toPoint - The ending point.
   * @param {number} aspect - The target aspect.
   * @return {number} - The precision between the two points and the aspect.
   */
  calcPrecision(point: number, toPoint: number, aspect: number): number {
    let gap = Math.abs(point - toPoint)

    if (gap > radiansToDegree(Math.PI)) {
      gap = radiansToDegree(2 * Math.PI) - gap
    }
    return Math.abs(gap - aspect)
  }

  /**
   *
   * @param aspect
   * @param toPoint
   * @param point
   */
  isTransitPointApproachingToAspect(aspect: number, toPoint: number, point: number): boolean {
    if ((point - toPoint) > 0) {
      if ((point - toPoint) > radiansToDegree(Math.PI)) {
        point = (point + aspect) % radiansToDegree(2 * Math.PI)
      } else {
        toPoint = (toPoint + aspect) % radiansToDegree(2 * Math.PI)
      }
    } else {
      if ((toPoint - point) > radiansToDegree(Math.PI)) {
        toPoint = (toPoint + aspect) % radiansToDegree(2 * Math.PI)
      } else {
        point = (point + aspect) % radiansToDegree(2 * Math.PI)
      }
    }

    let _point = point
    let _toPoint = toPoint

    const difference = _point - _toPoint

    if (Math.abs(difference) > radiansToDegree(Math.PI)) {
      _point = toPoint
      _toPoint = point
    }

    return (_point - _toPoint < 0)
  }

  /*
   * Aspects comparator
   * by precision
   * @private
   * @param {Object} a
   * @param {Object} b
   */
  compareAspectsByPrecision(a: FormedAspect, b: FormedAspect): number {
    return parseFloat(a.precision) - parseFloat(b.precision)
  }
}

export default AspectCalculator
