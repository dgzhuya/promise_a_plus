const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'
const isFunction = value => typeof value === 'function'
const isObject = value => Object.prototype.toString.call(value) === '[object Object]'

export default class MyPromise {
	constructor(executor) {
		this.result = null
		this.state = PENDING
		this.callbacks = []
		let isExecuted = false

		const executeHandler = fn => result => {
			if (isExecuted) return
			isExecuted = true
			isFunction(fn) && fn(result)
		}

		const resultHandler = state => result => {
			if (this.state !== PENDING) return
			this.state = state
			this.result = result
			queueMicrotask(this._runAllCallbacks)
		}

		const onFulfilled = resultHandler(FULFILLED)
		const onRejected = resultHandler(REJECTED)

		const resolvePromise = value => {
			if (value === this) {
				return onRejected(new TypeError('Chaining cycle detected for promise'))
			}
			if (value instanceof MyPromise) {
				return value.then(onFulfilled, onRejected)
			}
			if (isObject(value) || isFunction(value)) {
				try {
					const then = value.then
					if (typeof then === 'function') {
						return new MyPromise(then.bind(value)).then(onFulfilled, onRejected)
					}
				} catch (error) {
					return onRejected(error)
				}
			}
			onFulfilled(value)
		}

		try {
			executor(executeHandler(resolvePromise), executeHandler(onRejected))
		} catch (error) {
			executeHandler(onRejected)(error)
		}
	}

	then(onFulfilled, onRejected) {
		return new MyPromise((resolve, reject) => {
			const callback = { resolve, reject, onFulfilled, onRejected }
			if (this.state === PENDING) {
				this.callbacks.push(callback)
				return
			}
			queueMicrotask(() => this._runCallback(callback))
		})
	}

	_runAllCallbacks = () => {
		this.callbacks.forEach(this._runCallback)
		this.callbacks = []
	}

	_runCallback = ({ resolve, reject, onFulfilled, onRejected }) => {
		try {
			if (this.state === FULFILLED) {
				isFunction(onFulfilled) ? resolve(onFulfilled(this.result)) : resolve(this.result)
			}
			if (this.state === REJECTED) {
				isFunction(onRejected) ? resolve(onRejected(this.result)) : reject(this.result)
			}
		} catch (error) {
			reject(error)
		}
	}
}
