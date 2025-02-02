import type { Points } from './radix';
import type { AspectData, Settings } from './settings';
export interface FormedAspect {
    point: {
        name: string;
        position: number;
    };
    toPoint: {
        name: string;
        position: number;
    };
    aspect: {
        name: string;
        degree: number;
        color: string;
        orbit: number;
        lineStyle: string;
    };
    precision: string;
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
declare class AspectCalculator {
    settings: Partial<Settings>;
    toPoints: Points;
    context: this;
    constructor(toPoints: Points, settings?: Partial<Settings>);
    /**
     * Getter for this.toPoints
     * @see constructor
     *
     * @return {Object}
     */
    getToPoints(): Points;
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
    radix(points: Points): FormedAspect[];
    /**
     * Transit aspects
     *
     * @param {Object} points - transiting points; {"Sun":[0, 1], "Uranus":[90, -1], "NAME":[ANGLE, SPEED]};
     * @return {Array<Object>} [{"aspect":{"name":"conjunction", "degree":120}"", "point":{"name":"Sun", "position":123}, "toPoint":{"name":"Moon", "position":345}, "precision":0.5}]]
     */
    transit(points: Points): FormedAspect[];
    hasAspect(point: number, toPoint: number, aspect: AspectData): boolean;
    /**
     * Calculates the precision between two points and an aspect.
     *
     * @param {number} point - The starting point.
     * @param {number} toPoint - The ending point.
     * @param {number} aspect - The target aspect.
     * @return {number} - The precision between the two points and the aspect.
     */
    calcPrecision(point: number, toPoint: number, aspect: number): number;
    /**
     *
     * @param aspect
     * @param toPoint
     * @param point
     */
    isTransitPointApproachingToAspect(aspect: number, toPoint: number, point: number): boolean;
    compareAspectsByPrecision(a: FormedAspect, b: FormedAspect): number;
}
export default AspectCalculator;
