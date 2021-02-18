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
		return ''
	}
}

export class Or extends Pattern {
	constructor(public patterns: Pattern[]) {
		super()
	}

	public toString(): string {
		return `(${this.patterns
			.map((pattern) => pattern.toString())
			.filter((e) => e.length)
			.join('|')})`
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
		if (this.p instanceof Epsilon) return this.p.toString()
		return this.p.toString() + '*'
	}
}
