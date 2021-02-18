import { Concat, EmptySet, Epsilon, Literal, Or, Pattern, Star } from './regex'
import simplify from './regex-simplify'

class Vertex {
	public outgoingEdges: Map<Vertex, Edge> = new Map()
	public incomingEdges: Map<Vertex, Edge> = new Map()

	constructor(public name: string) {}

	public addEdge(to: Vertex, pattern: Pattern): Edge {
		if (this.outgoingEdges.has(to) ?? to.incomingEdges.has(this)) {
			// This edge already exists. Merge the current pattern and this new one
			pattern = new Or([pattern, this.outgoingEdges.get(to)?.pattern as Pattern]) // merge patterns
			// The edge does not have to be removed, it will simply be overridden in the next step
		}

		pattern = simplify(pattern)

		const edge = new Edge(this, to, pattern)
		this.outgoingEdges.set(to, edge)
		to.incomingEdges.set(this, edge)

		return edge
	}
}

class Edge {
	constructor(public from: Vertex, public to: Vertex, public pattern: Pattern) {}
}

class NFA {
	constructor(
		public Q: Vertex[],
		public E: string[],
		public d: Map<Vertex, Map<Vertex, Pattern>>,
		public q0: Vertex,
		public F: Vertex[]
	) {
		d.forEach((destinations, from) => {
			destinations.forEach((pattern, to) => {
				this.addEdge(from, to, pattern)
			})
		})
	}

	public addEdge(from: Vertex, to: Vertex, pattern: Pattern): Edge {
		const edge = from.addEdge(to, pattern)
		if (!this.d.has(from)) this.d.set(from, new Map())
		this.d.get(from)?.set(to, edge.pattern)
		return edge
	}

	public removeEdge({ from, to }: Edge): void {
		from.outgoingEdges.delete(to)
		to.incomingEdges.delete(from)
		this.d.get(from)?.delete(to)
	}

	/**
	 * Convert to a GNFA by adding edges to all other vertices, and by making it s.t. there is one start and final state
	 * without incoming edges.
	 */
	public generalize(): void {
		// New GNFA nodes
		const q0 = new Vertex('GNFA Start')
		const F = new Vertex('GNFA End')

		this.addEdge(q0, this.q0, new Epsilon())
		this.F.forEach((f) => this.addEdge(f, F, new Epsilon()))

		this.Q.push(q0, F)
		this.F = [F]
		this.q0 = q0

		for (const q1 of Q) {
			if (q1 === F) continue // No edges come out of the new F
			for (const q2 of Q) {
				if (q2 === q0) continue // No edges go in the new q0
				// If there is already an edge from q1 to q2, then don't create one
				if (q1.outgoingEdges.has(q2)) continue
				// If there is none yet, then create one
				this.addEdge(q1, q2, new EmptySet())
			}
		}
	}

	/**
	 * Performs the convert version until there are no more states apart from q0 and F
	 */
	public convert(): void {
		while (this.Q.length > 2) {
			const qRip = this.Q.shift() as Vertex // generalize put q0 and F at the end, so start at the beginning
			console.log(`-------- ${qRip.name} --------`)
			for (const qi of this.Q) {
				if (qi === this.F[0]) continue
				for (const qj of this.Q) {
					if (qj === this.q0) continue
					const R1 = qi.outgoingEdges.get(qRip)?.pattern
					const R2 = qRip.outgoingEdges.get(qRip)?.pattern
					const R3 = qRip.outgoingEdges.get(qj)?.pattern
					const R4 = qi.outgoingEdges.get(qj)?.pattern
					if (R1 === undefined || R2 === undefined || R3 === undefined || R4 === undefined)
						throw new Error('Could not find d(q., q.) edges. Is this a GNFA?')
					const { pattern } = this.addEdge(qi, qj, new Or([new Concat([R1, new Star(R2), R3]), R4]))
					console.log(qi.name, qj.name, pattern.toString())
				}
			}
			// Rip out qrip
			qRip.outgoingEdges.forEach((edge) => this.removeEdge(edge))
			qRip.incomingEdges.forEach((edge) => this.removeEdge(edge))
		}
	}
}

const Q = [new Vertex('even'), new Vertex('odd')]
const E = ['0', '1']
const d: NFA['d'] = new Map([
	[Q[0], new Map([[Q[1], new Or([new Literal('0'), new Literal('1')])]])],
	[Q[1], new Map([[Q[0], new Or([new Literal('0'), new Literal('1')])]])],
])
const q0 = Q[0]
const F = [Q[0]]
const oddEvenNfa = new NFA(Q, E, d, q0, F)

// Accepts ONLY "1"
// const Q = [new Vertex('q0'), new Vertex('accept')]
// const E = ['0', '1']
// const d: NFA['d'] = new Map([[Q[0], new Map([[Q[1], new Literal('1')]])]])
// const q0 = Q[0]
// const F = [Q[1]]
// const oddEvenNfa = new NFA(Q, E, d, q0, F)

oddEvenNfa.generalize()
oddEvenNfa.convert()

for (const q of oddEvenNfa.Q) {
	for (const edge of q.outgoingEdges.values()) {
		console.log('from', q.name, 'to', edge.to.name, simplify(edge.pattern).toString())
	}
}
