/**
 * Format:
 * Q
 * q0
 * F
 * qi qj symbol
 * ...
 */
import { NFA, Vertex } from './index'
import { Epsilon, Literal, Pattern, RegexNotation } from './regex'

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
		nfa.addEdge(verticesByName[qi], verticesByName[qj], symbol ? new Literal(symbol) : new Epsilon())
	}
	nfa.generalize()
	nfa.convert()
}

const not110 = `
a b c
a
a b c
a b 1
b c 1
c c 1
b a 0
a a 0
`

const even = `
even odd
even
even
even odd 0
even odd 1
odd even 0
odd even 1
`

const lab2q5 = `
q0 q1 q2
q0
q1 q2
q0 q1 a
q0 q2 b
q1 q2
q1 q0 b
q2 q2 a
q2 q2 b
q2 q1 b
`

const lab2q3a1 = `
q0 q1 q2
q0
q0
q0 q1 a
q0 q2 b
q1 q0 b
q1 q2 a
q2 q2 a
q2 q2 b
`

const lab2q3a2 = `
q0 q1 q2
q0
q0
q0 q1 b
q0 q2 b
q1 q0 a
q1 q2 a
q2 q2 a
q2 q2 b
`

const lab2q4a = `
q0 q1
q0
q0 q1
q0 q1 a
q0 q0 b
q0 q0 c
q1 q1 a
q1 q0 b
`

Pattern.regexNotation = RegexNotation.POSIX_LATEX
parse(lab2q5)
