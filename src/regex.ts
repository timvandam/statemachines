export abstract class Pattern {
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
		return '[]'
	}
}

export class Epsilon extends Pattern {
	public toString(): string {
		return '[]{0}'
	}
}

export class Or extends Pattern {
	constructor(public patterns: Pattern[]) {
		super()
	}

	public toString(): string {
		return `(${this.patterns.map((pattern) => pattern.toString()).join('|')})`
	}
}

export class Concat extends Pattern {
	constructor(public patterns: Pattern[]) {
		super()
	}

	public toString(): string {
		return `(${this.patterns.map((pattern) => pattern.toString()).join('')})`
	}
}

export class Star extends Pattern {
	constructor(public p: Pattern) {
		super()
	}

	public toString(): string {
		return this.p.toString() + '*'
	}
}

export class Plus extends Pattern {
	constructor(public p: Pattern) {
		super()
	}

	public toString(): string {
		return this.p.toString() + '+'
	}
}

export class Optional extends Pattern {
	constructor(public p: Pattern) {
		super()
	}

	public toString(): string {
		return this.p.toString() + '?'
	}
}

export class Quantified extends Pattern {
	constructor(public n: number, public p: Pattern) {
		super()
	}

	public toString(): string {
		return `(${this.p.toString()}{${this.n}})`
	}
}
