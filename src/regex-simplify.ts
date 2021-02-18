import { Literal, Or, Pattern, Epsilon, EmptySet, Star, Concat, Quantified, Plus, Optional } from './regex'
import match from './match'
import * as util from 'util'

const last = <T extends readonly unknown[]>(arr: T): T extends [...infer H, infer R] ? R : never =>
	arr[arr.length - 1] as ReturnType<typeof last>

const matcher = match({ Literal, Or, Epsilon, EmptySet, Star, Concat, Quantified, Plus, Optional })({
	Literal: (l) => l,
	EmptySet: (l) => l,
	Epsilon: (l) => l,
	Quantified: ({ n, p }) => new Quantified(n, simplify(p)),
	Plus: ({ p }) => new Plus(simplify(p)),
	Optional: ({ p }) => {
		p = simplify(p)
		if (p instanceof Optional) return p
		return new Optional(p)
	},
	Or: ({ patterns }) => {
		const newPatterns: Pattern[] = []
		for (const pat of patterns.map(simplify).filter((p) => !(p instanceof EmptySet))) {
			if (pat instanceof Or) newPatterns.push(...pat.patterns)
			else if (!newPatterns.some((p) => util.isDeepStrictEqual(p, pat))) newPatterns.push(pat)
		}
		if (!newPatterns.length) return new EmptySet()
		if (newPatterns.length === 1) return newPatterns[0]
		if (newPatterns.find((p) => p instanceof Epsilon))
			return simplify(new Optional(new Or(newPatterns.filter((p) => !(p instanceof Epsilon)))))
		return new Or(newPatterns)
	},
	Star: ({ p }) => {
		p = simplify(p)
		return p instanceof EmptySet || p instanceof Epsilon ? new Epsilon() : new Star(p)
	},
	Concat: ({ patterns }) => {
		patterns = patterns.map(simplify).filter((p) => !(p instanceof Epsilon))
		if (!patterns.length) return new Epsilon()
		if (patterns.length === 1) return patterns[0]
		if (patterns.some((p) => p instanceof EmptySet) || !patterns.length) return new EmptySet()
		if (patterns.every((p) => p instanceof Literal)) return new Literal(patterns.map((l) => (l as Literal).l).join(''))
		const unpackedConcat: Pattern[] = [] // unpacked nested concats
		for (const pat of patterns) {
			if (pat instanceof Concat) unpackedConcat.push(...pat.patterns)
			else unpackedConcat.push(pat)
		}
		const mergedPatterns: Pattern[] = [] // merge consecutive equivalent patterns
		for (let pat of unpackedConcat) {
			if (util.isDeepStrictEqual(pat, last(mergedPatterns))) {
				mergedPatterns.pop()
				pat = new Quantified(2, pat)
			} else if (last(mergedPatterns) instanceof Quantified) {
				const { n, p } = last(mergedPatterns) as Quantified
				if (util.isDeepStrictEqual(pat, p)) {
					mergedPatterns.pop()
					pat = new Quantified(n + 1, p)
				}
			} else if (last(mergedPatterns) instanceof Star) {
				const { p } = last(mergedPatterns) as Star
				if (util.isDeepStrictEqual(pat, p)) {
					mergedPatterns.pop()
					pat = new Plus(p)
				}
			}
			mergedPatterns.push(pat)
		}
		return new Concat(mergedPatterns)
	},
})

export default function simplify(pattern: Pattern): Pattern {
	const res = matcher(pattern)
	if (!res) throw new Error('could no simplify')
	return res
}
