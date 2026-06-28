declare module 'cytoscape-fcose' {
  import type cytoscape from 'cytoscape';
  const ext: cytoscape.Ext;
  export default ext;
}

declare module 'd3-force-3d' {
  export interface SimulationNode {
    id?: string | number;
    x?: number;
    y?: number;
    z?: number;
    vx?: number;
    vy?: number;
    vz?: number;
    fx?: number | null;
    fy?: number | null;
    fz?: number | null;
    [key: string]: any;
  }

  export interface SimulationLink<N extends SimulationNode = SimulationNode> {
    source: N | string | number;
    target: N | string | number;
    [key: string]: any;
  }

  export interface Simulation<N extends SimulationNode = SimulationNode> {
    restart(): this;
    stop(): this;
    tick(iterations?: number): this;
    nodes(): N[];
    nodes(nodes: N[]): this;
    alpha(): number;
    alpha(alpha: number): this;
    alphaMin(): number;
    alphaMin(min: number): this;
    alphaDecay(): number;
    alphaDecay(decay: number): this;
    alphaTarget(): number;
    alphaTarget(target: number): this;
    velocityDecay(): number;
    velocityDecay(decay: number): this;
    force(name: string): any;
    force(name: string, force: any): this;
    find(x: number, y: number, radius?: number): N | undefined;
    on(typenames: string, listener: (this: Simulation<N>) => void): this;
    on(typenames: string): ((this: Simulation<N>) => void) | undefined;
  }

  export function forceSimulation<N extends SimulationNode>(
    nodes?: N[],
    numDimensions?: number
  ): Simulation<N>;

  export interface ForceLink<N extends SimulationNode = SimulationNode> {
    (alpha: number): void;
    links(): SimulationLink<N>[];
    links(links: SimulationLink<N>[]): this;
    id(): (node: N) => string | number;
    id(id: (node: N) => string | number): this;
    distance(): number | ((link: SimulationLink<N>) => number);
    distance(distance: number | ((link: SimulationLink<N>) => number)): this;
    strength(): number | ((link: SimulationLink<N>) => number);
    strength(strength: number | ((link: SimulationLink<N>) => number)): this;
    iterations(): number;
    iterations(iterations: number): this;
  }

  export function forceLink<N extends SimulationNode>(
    links?: SimulationLink<N>[]
  ): ForceLink<N>;

  export interface ForceManyBody<N extends SimulationNode = SimulationNode> {
    (alpha: number): void;
    strength(): number | ((node: N) => number);
    strength(strength: number | ((node: N) => number)): this;
    theta(): number;
    theta(theta: number): this;
    distanceMin(): number;
    distanceMin(distance: number): this;
    distanceMax(): number;
    distanceMax(distance: number): this;
  }

  export function forceManyBody<N extends SimulationNode>(): ForceManyBody<N>;

  export interface ForceCenter<N extends SimulationNode = SimulationNode> {
    (alpha: number): void;
    x(): number;
    x(x: number): this;
    y(): number;
    y(y: number): this;
    strength(): number;
    strength(strength: number): this;
  }

  export function forceCenter<N extends SimulationNode>(
    x?: number,
    y?: number
  ): ForceCenter<N>;

  export interface ForceCollide<N extends SimulationNode = SimulationNode> {
    (alpha: number): void;
    radius(): number | ((node: N) => number);
    radius(radius: number | ((node: N) => number)): this;
    strength(): number;
    strength(strength: number): this;
    iterations(): number;
    iterations(iterations: number): this;
  }

  export function forceCollide<N extends SimulationNode>(
    radius?: number | ((node: N) => number)
  ): ForceCollide<N>;

  export function forceX<N extends SimulationNode>(x?: number): any;
  export function forceY<N extends SimulationNode>(y?: number): any;
  export function forceRadial<N extends SimulationNode>(
    radius: number,
    x?: number,
    y?: number
  ): any;
}
