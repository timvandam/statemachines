type Constructor<T = unknown> = new (...args: any) => T

type ValueOf<T> = T[keyof T]
type Cases<T extends { [name: string]: Constructor }> = {
	[name in keyof T]: (instance: InstanceType<T[name]>) => unknown
}

export default function match<T extends { [name: string]: Constructor }>(classes: T) {
	return <Z extends Cases<T>>(cases: Z) => (instance: unknown) => {
		for (const [className, callback] of Object.entries(cases)) {
			if (classes[className] && instance instanceof classes[className])
				return callback(instance) as ReturnType<ValueOf<Z>>
		}
	}
}
