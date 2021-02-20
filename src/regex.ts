export enum RegexNotation {
	FORMAL,
	POSIX,
	FORMAL_LATEX,
	POSIX_LATEX,
}

export abstract class Pattern {
	public static regexNotation: RegexNotation = RegexNotation.POSIX
	abstract toString(): string
}

export class Literal extends Pattern {
	constructor(public l: string | symbol) {
		super()
	}

	public toString(): string {
		if (typeof this.l === 'string') return this.l
		return this.l.toString().slice(7, -1)
	}
}

export class EmptySet extends Pattern {
	public toString(): string {
		switch (Pattern.regexNotation) {
			case RegexNotation.POSIX:
				return '[]'
			case RegexNotation.FORMAL:
				return 'Ø'
			case RegexNotation.FORMAL_LATEX:
			case RegexNotation.POSIX_LATEX:
				return '\\emptyset '
		}
	}
}

export class Epsilon extends Pattern {
	public toString(): string {
		switch (Pattern.regexNotation) {
			case RegexNotation.POSIX:
				return '[]{0}'
			case RegexNotation.FORMAL:
				return 'ε'
			case RegexNotation.FORMAL_LATEX:
			case RegexNotation.POSIX_LATEX:
				return '\\varepsilon '
		}
	}
}

export class Or extends Pattern {
	constructor(public p: Pattern[]) {
		super()
	}

	public toString(): string {
		let sep: string
		switch (Pattern.regexNotation) {
			case RegexNotation.POSIX:
				sep = '|'
				break
			case RegexNotation.FORMAL:
				sep = '∪'
				break
			case RegexNotation.FORMAL_LATEX:
				sep = '\\cup '
				break
			case RegexNotation.POSIX_LATEX:
				sep = '\\mid '
				break
		}

		return this.p.map((pattern) => pattern.toString()).join(sep)
	}
}

export class Concat extends Pattern {
	constructor(public p: Pattern[]) {
		super()
	}

	public toString(): string {
		return this.p.map((pattern) => (pattern instanceof Or ? `(${pattern.toString()})` : pattern.toString())).join('')
	}
}

export class Quantified extends Pattern {
	constructor(public l: number, public u: number, public p: Pattern) {
		super()
	}

	public isOptional() {
		return this.l === 0 && this.u === 1
	}

	public isPlus() {
		return this.l === 1 && this.u === Infinity
	}

	public isStar() {
		return this.l === 0 && this.u === Infinity
	}

	public isConstant() {
		return this.l === this.u
	}

	get star() {
		switch (Pattern.regexNotation) {
			case RegexNotation.POSIX:
				return '*'
			case RegexNotation.FORMAL:
				return '*'
			case RegexNotation.FORMAL_LATEX:
			case RegexNotation.POSIX_LATEX:
				return '^\\ast '
		}
	}

	get plus() {
		switch (Pattern.regexNotation) {
			case RegexNotation.POSIX:
				return '+'
			case RegexNotation.FORMAL:
				return '+'
			case RegexNotation.FORMAL_LATEX:
			case RegexNotation.POSIX_LATEX:
				return '^+'
		}
	}

	getRepetitions(n: number) {
		switch (Pattern.regexNotation) {
			case RegexNotation.POSIX:
				return `{${n}}`
			case RegexNotation.FORMAL:
				return `^${n}`
			case RegexNotation.FORMAL_LATEX:
			case RegexNotation.POSIX_LATEX:
				return `^{${n}}`
		}
	}

	getRange(l: number | string, u: number | string) {
		switch (Pattern.regexNotation) {
			case RegexNotation.POSIX:
				return `{${l}, ${u}}`
			case RegexNotation.FORMAL:
				return `^[${l}, ${u}]`
			case RegexNotation.FORMAL_LATEX:
			case RegexNotation.POSIX_LATEX:
				return `^{[${l}, ${u}]}`
		}
	}

	get infinity() {
		switch (Pattern.regexNotation) {
			case RegexNotation.POSIX:
				return Infinity
			case RegexNotation.FORMAL:
				return '∞'
			case RegexNotation.FORMAL_LATEX:
			case RegexNotation.POSIX_LATEX:
				return '\\infty '
		}
	}

	public toString(): string {
		let str = this.p.toString()
		if (str.length > 1) str = `(${str})`
		if (this.u === Infinity) {
			if (this.l === 0) str += this.star
			else if (this.l === 1) str += this.plus
			else str += this.getRange(this.l, this.infinity)
		} else if (this.l === 0 && this.u === 1) {
			switch (Pattern.regexNotation) {
				case RegexNotation.POSIX:
					str += '?'
					break
				case RegexNotation.FORMAL:
				case RegexNotation.FORMAL_LATEX:
				case RegexNotation.POSIX_LATEX:
					str = `(${new Or([this.p, new Epsilon()]).toString()})`
					break
			}
		} else if (this.l === this.u) str += this.getRepetitions(this.l)
		else str += this.getRange(this.l, this.u)
		return str
	}
}
