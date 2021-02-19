import { Literal, Or, Pattern, Epsilon, EmptySet, Concat, Quantified } from './regex'
import match from './match'
import * as util from 'util'

const last = <T extends readonly unknown[]>(arr: T): T extends [...infer H, infer R] ? R : never =>
	arr[arr.length - 1] as ReturnType<typeof last>

const hasP = (obj: unknown): obj is { p: Pattern[] } => Object.prototype.hasOwnProperty.call(obj, 'p')

const matcher = match({ Literal, Or, Epsilon, EmptySet, Concat, Quantified })({
	Literal: (l) => l,
	EmptySet: (l) => l,
	Epsilon: (l) => l,
	Quantified: ({ l, u, p }) => {
		p = simplify(p)
		if (p instanceof Quantified) return new Quantified(l * p.l, u * p.u, p.p)
		return new Quantified(l, u, p)
	},
	Or: ({ p }) => {
		const newPatterns: Pattern[] = []
		for (const pat of p.map(simplify).filter((p) => !(p instanceof EmptySet))) {
			if (pat instanceof Or)
				newPatterns.push(...pat.p.filter((pat) => !newPatterns.some((p) => util.isDeepStrictEqual(p, pat))))
			else if (!newPatterns.some((p) => util.isDeepStrictEqual(p, pat))) newPatterns.push(pat)
		}
		if (!newPatterns.length) return new EmptySet()
		if (newPatterns.length === 1) return newPatterns[0]
		if (newPatterns.find((p) => p instanceof Epsilon))
			return simplify(new Quantified(0, 1, new Or(newPatterns.filter((p) => !(p instanceof Epsilon)))))
		return new Or(newPatterns)
	},
	Concat: ({ p }) => {
		p = p.map(simplify).filter((p) => !(p instanceof Epsilon))
		if (!p.length) return new Epsilon()
		if (p.length === 1) return p[0]
		if (p.some((p) => p instanceof EmptySet) || !p.length) return new EmptySet()
		if (p.every((p) => p instanceof Literal)) return new Literal(p.map((l) => (l as Literal).l).join(''))
		const unpackedConcat: Pattern[] = [] // unpacked nested concats
		for (const pat of p) {
			if (pat instanceof Concat) unpackedConcat.push(...pat.p)
			else unpackedConcat.push(pat)
		}
		const mergedPatterns: Pattern[] = []
		for (let pat of unpackedConcat) {
			if (mergedPatterns.length) {
				const pat2 = last(mergedPatterns)
				if (util.isDeepStrictEqual(pat, pat2)) {
					pat = new Quantified(2, 2, pat)
					mergedPatterns.pop()
				} else if (pat2 instanceof Quantified && util.isDeepStrictEqual(pat, pat2.p)) {
					pat = new Quantified(pat2.l + 1, pat2.u + 1, pat)
					mergedPatterns.pop()
				} else if (pat instanceof Quantified && util.isDeepStrictEqual(pat.p, pat2)) {
					pat = new Quantified(pat.l + 1, pat.u + 1, pat2)
					mergedPatterns.pop()
				} else if (pat instanceof Quantified && pat2 instanceof Quantified && util.isDeepStrictEqual(pat.p, pat2.p)) {
					pat = new Quantified(pat.l + pat2.l, pat.u + pat2.u, pat.p)
					mergedPatterns.pop()
				}
			}
			mergedPatterns.push(pat)
		}
		return new Concat(mergedPatterns)
	}, // TODO: Simplify (0+)? to 0*
})

export default function simplify(pattern: Pattern): Pattern {
	const res = matcher(pattern)
	if (!res) throw new Error('could no simplify')
	return res
}
