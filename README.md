# promise_a_plus实现一个简单的Promise
Promise 是异步编程的一种解决方案，比传统的解决方案——回调函数和事件——更合理和更强大。它由社区最早提出和实现，ES6 将其写进了语言标准，统一了用法，原生提供了Promise对象。
> 以上出自 [ECMAScript 6 入门 阮一峰](https://es6.ruanyifeng.com/#docs/promise)
## 基础功能
1. 封装isFunction函数
   ```js
	const isFunction = value => typeof value === 'function'
   ```
2. 封装isObject函数
   ```js
	const isObject = value => Object.prototype.toString.call(value) === '[object Object]'
   ```
3. Promise对象状态
   ```js
	const PENDING = 'pending' // 进行中
	const FULFILLED = 'fulfilled' // 已成功
	const REJECTED = 'rejected' // 已失败
   ```
## 基本方法
1. Promise对象是一个构造函数，用来生成Promise实例
   ```js
	class MyPromise {
		constructor(executor) {
			executor(
				value => {
					console.log('value: ', value)
				},
				reason => {
					console.log('reason: ', reason)
				}
			)
		}
	}
   ```
2. 添加Promise状态和返回结果
   ```js
	const PENDING = 'pending'
	const FULFILLED = 'fulfilled'
	const REJECTED = 'rejected'

	class MyPromise {
		constructor(executor) {
			this.result = null
			this.state = PENDING
		}
	}
   ```
3. 处理Promise状态，通过控制isExecuted变量，控制resolve或reject只有一个可以被执行，同时使用result保存传递进来的数据
   ```js
	class MyPromise {
		constructor(executor) {
			...		
			let isExecuted = false

			executor(
				value => {
					if (isExecuted) return
					isExecuted = true
					this.result = value
				},
				reason => {
					if (isExecuted) return
					isExecuted = true
					this.result = reason
				}			
			)
		}
	}
   ```
## 添加then方法
1. 实现then方法，传入onFulfilled和onRejected函数
   ```js
	class MyPromise {
		...
		then(onFulfilled, onRejected) {
		}
	}
   ```
2. 添加callbacks字段，初始化为空数组，若当前状态为pending则用于保存then所传入的函数
   ```js
	class MyPromise {
		constructor(executor) {
			...
			this.callbacks = []
			...
		}
	
		then(onFulfilled, onRejected) {
			const callback = { onFulfilled, onRejected }
			if (this.state === PENDING) {
				this.callbacks.push(callback)
				return
			}
		}
	}
   ```
3. 添加runCallback函数，若当前状态不为pending则执行函数
   ```js
	class MyPromise {
		...
	
		then(onFulfilled, onRejected) {
			const callback = { onFulfilled, onRejected }
			...
			this._runCallback(callback)
		}

		_runCallback = ({ onFulfilled, onRejected }) => {
			if (this.state === FULFILLED) {
				isFunction(onFulfilled) && onFulfilled(this.result)
			}
			if (this.state === REJECTED) {
				isFunction(onRejected) && onRejected(this.result)
			}
		}
	}
   ```
## 添加函数执行处理
1. 封装执行函数executeHandler确保reslove和reject只有一个被执行   
   ```js
   	...
	class MyPromise {
		constructor(executor) {
			...
			const executeHandler = fn => result => {
				if (isExecuted) return
				isExecuted = true
				isFunction(fn) && fn(result)
			}			
		}
	}
   ```
2. 添加resultHandler函数用于修改Promise状态并且保存结果
   ```js
   ...
	class MyPromise {
		constructor(executor) {
			...
			const resultHandler = state => result => {
				if (this.state !== PENDING) return
				this.state = state
				this.result = result
			}

			const onFulfilled = resultHandler(FULFILLED)
			const onRejected = resultHandler(REJECTED)
		}
	}
   ```
3. 使用executeHandler封装执行操作限制函数，同时使用try...catch包裹executor函数
   ```js
   ...
	class MyPromise {
		constructor(executor) {
			...
			try {
				executor(executeHandler(onFulfilled), executeHandler(onRejected))
			} catch (error) {
				executeHandler(onRejected)(error)
			}
		}
	}
   ```
4. 若state发生改变后，执行calllbacks中的函数
    ```js
   ...
	class MyPromise {
		constructor(executor) {
			...
			const resultHandler = state => result => {
				...
				this._runAllCallbacks()
			}
			...
		}
		...
		_runAllCallbacks = () => {
			this.callbacks.forEach(this._runCallback)
			this.callbacks = []
		}
	}
   ```
5. 通过queueMicrotask将回调函数添加至微任务队列中
    ```js
	class MyPromise {
		constructor(executor) {
			...
			const resultHandler = state => result => {
				...
				queueMicrotask(this._runAllCallbacks)
			}
			...
		}
		then(onFulfilled, onRejected) {
			...
			queueMicrotask(() => this._runCallback(task))
		}
	}
   ```
## 实现resolvePromise功能
用于处理resolve函数传入参数value的一些问题
1. 若value为this的时候，抛出TypeError，并且执行onRejected函数
   ```js
	class MyPromise {
		constructor(executor) {
			const resolvePromise = value => {
				if (value === this) {
					return onRejected(new TypeError('Chaining cycle detected for promise'))
				}
			}
		}
	}
   ```
2. 若value为其他MyPromise对象时候，执行其then函数
   ```js
	class MyPromise {
		constructor(executor) {
			const resolvePromise = value => {
				...
				if (value instanceof MyPromise) {
					return value.then(onFulfilled, onRejected)
				}
			}
		}
	}
   ```
3. 若value为一个对象或者函数当其中包含一个then函数，则执行函数
   ```js
	class MyPromise {
		constructor(executor) {
			const resolvePromise = value => {
				...
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
			}
		}
	}
   ```
4. 若为其他，则修改当前状态，设置value为result
   ```js
	class MyPromise {
		constructor(executor) {
			const resolvePromise = value => {
				...
				onFulfilled(value)
			}
		}
	}
   ```
5. 使用resolvePromise代替onFulfilled处理value信息
   ```js
	class MyPromise {
		constructor(executor) {
			...
			try {
				executor(executeHandler(resolvePromise), executeHandler(onRejected))
			} catch (error) {
				executeHandler(onRejected)(error)
			}
		}
	}
   ```
## 实现then函数链式调用
then函数返回一个新的Promise
1. 修改then函数返回值
   ```js
   	class MyPromise {
		...
		then(onFulfilled, onRejected) {
			return new MyPromise((reslove, reject) => {
				...
			})
		}
	}
   ```
2. 修改callback信息
    ```js
   	class MyPromise {
		...
		then(onFulfilled, onRejected) {
			return new MyPromise((resolve, reject) => {
				const callback = { resolve, reject, onFulfilled, onRejected }
				...
			})
		}
	}
   ```
3. 修改runCallback方法，添加对then返回Promise的操作
   ```js
	class MyPromise {
		...
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
   ```
## 使用promises-aplus-tests测试
1. 安装promises-aplus-tests
   ```shell
   pnpm add promises-aplus-tests -D
   ```
2. 编写测试adapter
   ```js
	...
	const adapter = {
		resolved(value) {
			return new MyPromise((resolve, reject) => {
				resolve(value)
			})
		},
		rejected(reason) {
			return new MyPromise((resolve, reject) => {
				reject(reason)
			})
		},
		deferred() {
			let dfd = {}
			dfd.promise = new MyPromise((resolve, reject) => {
				dfd.resolve = resolve
				dfd.reject = reject
			})
			return dfd
		}
	}
   ```
## TS版本
1. 添加工具函数类型
   ```ts
	enum STATE {
		PENDING,
		FULFILLED,
		REJECTED
	}

	type TResolveFn<T = any> = (value: T) => void
	type TRejectFn = (value: any) => void
	type TOnFulfilledFn<T = any, R = any> = (data: T) => R
	type TOnRejectedFn = (data: any) => any

	type TPromiseExecutor<T = unknown> = (resolve: TResolveFn<T>, reject: TRejectFn) => void
	interface ICallback {
		resolve: TResolveFn
		reject: TRejectFn
		onFulfilled?: TOnFulfilledFn
		onRejected?: TOnRejectedFn
	}

	const isFunction = (value: any): value is Function => typeof value === 'function'
	const isObject = (value: any): value is object => Object.prototype.toString.call(value) === '[object Object]'

   ```
2. 实现reslove的类型
   ```ts
   ...
	export default class MyPromise<T> {
		private result: any
		private state: STATE = STATE.PENDING
		private callbacks: ICallback[] = []

		constructor(executor: TPromiseExecutor<T>) {
			...
			try {
				executor(executeHandler<T>(resolvePromise), executeHandler(onRejected))
			} catch (error) {
				executeHandler(onRejected)(error)
			}
		}
	}
   ```
3. 添加then方法的类型
   ```ts
   ...
	export default class MyPromise<T> {
		then<R>(onFulfilled?: TOnFulfilledFn<T, R>, onRejected?: TOnRejectedFn) {
			return new MyPromise<R>((resolve, reject) => {
				const task = { onFulfilled, onRejected, resolve, reject }
				if (this.state === STATE.PENDING) {
					this.callbacks.push(task)
					return
				}
				queueMicrotask(() => this._runTask(task))
			})
		}
	}
   ```
