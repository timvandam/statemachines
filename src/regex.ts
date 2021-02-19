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
	constructor(public p: Pattern[]) {
		super()
	}

	public toString(): string {
		return this.p.map((pattern) => pattern.toString()).join('|')
	}
}

export class Concat extends Pattern {
	constructor(public p: Pattern[]) {
		super()
	}

	public toString(): string {
		return this.p
			.map((pattern, i) =>
				i !== this.p.length - 1 && pattern instanceof Or ? `(${pattern.toString()})` : pattern.toString()
			)
			.join('')
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

	public toString(): string {
		let str = this.p.toString()
		if (str.length > 1) str = `(${str})`
		if (this.u === Infinity) {
			if (this.l === 0) str += '*'
			else if (this.l === 1) str += '+'
			else str += `{${this.l}, ∞}`
		} else if (this.l === 0 && this.u === 1) str += '?'
		else if (this.l === this.u) str += `{${this.l}}`
		else str += `{${this.l}, ${this.u}}`
		return str
	}
}
