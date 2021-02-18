/**
 * Format:
 * Q
 * q0
 * F
 * qi qj symbol
 * ...
 */
import { NFA, Vertex } from './index'
import { Literal } from './regex'

function parse(str: string): void {
	str = str.trim()
	const [Q, q0, F, ...d] = str.split(/[\r\n]+/g)

	const verticesByName = Q.split(/\s/g).reduce((res, q) => Object.assign(res, { [q]: new Vertex(q) }), {}) as Record<
		string,
		Vertex
	>
	const _Q = Object.values(verticesByName)
	const _q0 = verticesByName[q0]
	const _F = F.split(/\s/g).map((f) => verticesByName[f])
	const nfa = new NFA(_Q, new Map(), _q0, _F)
	for (const line of d) {
		const [qi, qj, symbol] = line.split(/\s/g)
		nfa.addEdge(verticesByName[qi], verticesByName[qj], new Literal(symbol))
	}
	nfa.generalize()
	nfa.convert()
}

parse(`
even odd
even
even
even odd 0
even odd 1
odd even 0
odd even 1
`)