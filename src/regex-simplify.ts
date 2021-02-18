import { Literal, Or, Pattern, Epsilon, EmptySet, Star, Concat } from './regex'
import match from './match'

const matcher = match({ Literal, Or, Epsilon, EmptySet, Star, Concat })({
	Literal: (l) => l,
	EmptySet: (l) => l,
	Or: ({ patterns }) => {
		const newPatterns = []
		for (const pat of patterns.map(simplify).filter((p) => !(p instanceof EmptySet))) {
			if (pat instanceof Or) newPatterns.push(...pat.patterns)
			else newPatterns.push(pat)
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
		return patterns.some((p) => p instanceof EmptySet) || !patterns.length
			? new EmptySet()
			: patterns.every((p) => p instanceof Literal)
			? new Literal(patterns.map((l) => (l as Literal).l).join(''))
			: new Concat(patterns)
	},
	Epsilon: (l) => l,
})

export default function simplify(pattern: Pattern): Pattern {
	return matcher(pattern) ?? new EmptySet()
}
