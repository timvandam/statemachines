import { Literal, Or, Pattern, Epsilon, EmptySet, Star, Concat, Quantified, Plus } from './regex'
import match from './match'
import * as util from 'util'

const last = <T extends readonly unknown[]>(arr: T): T extends [...infer H, infer R] ? R : never =>
	arr[arr.length - 1] as ReturnType<typeof last>

// todo: Add quantified. merge nested
const matcher = match({ Literal, Or, Epsilon, EmptySet, Star, Concat, Quantified, Plus })({
	Literal: (l) => l,
	EmptySet: (l) => l,
	Or: ({ patterns }) => {
		const newPatterns: Pattern[] = []
		for (const pat of patterns.map(simplify).filter((p) => !(p instanceof EmptySet))) {
			if (pat instanceof Or) newPatterns.push(...pat.patterns)
			else if (!newPatterns.some((p) => util.isDeepStrictEqual(p, pat))) newPatterns.push(pat)
		}
		if (!newPatterns.length) return new EmptySet()
		if (newPatterns.length === 1) return newPatterns[0]
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
		// TODO: Unpack nested concat
		const unpackedConcat: Pattern[] = [] // unpacked nested concats
		for (const pat of patterns) {
			if (pat instanceof Concat) unpackedConcat.push(...pat.patterns)
			else unpackedConcat.push(pat)
		}
		const mergedPatterns: Pattern[] = [] // merge consecutive equivalent patterns
		for (let pat of unpackedConcat) {
			if (util.isDeepStrictEqual(pat, last(mergedPatterns))) {
				mergedPatterns.pop()
				console.log(pat.toString(), 'merged')
				pat = new Quantified(2, pat)
			} else if (last(mergedPatterns) instanceof Quantified) {
				const { n, p } = last(mergedPatterns) as Quantified
				if (util.isDeepStrictEqual(pat, p)) {
					mergedPatterns.pop()
					pat = new Quantified(n + 1, p)
				}
			} else if (last(mergedPatterns) instanceof Star) {
				const { p } = last(mergedPatterns) as Plus
				if (util.isDeepStrictEqual(pat, p)) {
					mergedPatterns.pop()
					pat = new Plus(p)
				}
			}
			mergedPatterns.push(pat)
		}
		return new Concat(mergedPatterns)
	},
	Epsilon: (l) => l,
	Quantified: (l) => l,
	Plus: (l) => l,
})

export default function simplify(pattern: Pattern): Pattern {
	return matcher(pattern) ?? new EmptySet()
}
