// 等待
const PENDING = 'pending'
// 成功
const FULFILLED = 'fulfilled'
// 失败
const REJECTED = 'rejected'
/**
 * 传入值否为函数
 * @param {*} value 传入value
 * @returns boolean
 */
const isFunction = value => typeof value === 'function'
/**
 * 传入值类型是否为对象
 * @param {*} value 传入值
 * @returns boolean
 */
const isObject = value => Object.prototype.toString.call(value) === '[object Object]'

class MyPromise {
	/**
	 * 初始化函数
	 * @param { Function } executor 执行函数
	 */
	constructor(executor) {
		// 保存异步操作执行结果
		this.result = null
		// 记录当前Promise状态
		this.state = PENDING
		// 用于记录then函数的参数信息
		this.callbacks = []

		/**
		 * 异步操作成功时调用
		 * @param {*} value 操作成功结果
		 * @returns void
		 */
		const reslove = value => {
			// 若当前状态已经被修改则不可修改状态
			if (this.state !== PENDING) return
			// 修改状态为执行成功
			this.state = FULFILLED
			// 保存操作成功结果
			this.result = value
		}
		/**
		 * 异步操作失败时调用
		 * @param {*} reason 错误信息
		 * @returns void
		 */
		const reject = reason => {
			if (this.state !== PENDING) return
			// 修改状态为执行失败
			this.state = REJECTED
			// 保存执行失败错误信息
			this.result = reason
		}

		// 执行外部传入参数
		executor(reslove, reject)
	}

	/**
	 * 添加状态改变时的回调函数
	 * @param {*} onFulfilled FULFILLED状态回调函数
	 * @param {*} onRejected FULFILLED状态的回调函数
	 */
	then(onFulfilled, onRejected) {
		// 创建回调信息
		const callback = { onFulfilled, onRejected }
		// 当前状态为等待中
		if (this.state === PENDING) {
			// 保存回调信息到callbacks数组中
			this.callbacks.push(callback)
			return
		}
		// 执行当前任务
		this._runCallback(callback)
	}

	/**
	 * 执行then传入的函数信息
	 * @param {object} callback 需要执行的回调函数信息
	 * @param {*} callback.onFulfilled 成功状态下回调函数
	 * @param {*} callback.onRejected 失败状态下回调函数
	 */
	_runCallback({ onFulfilled, onRejected }) {
		// 成功状态
		if (this.state === FULFILLED) {
			// 若onFulfilled为函数，则传入result作为参数执行
			isFunction(onFulfilled) && onFulfilled(this.result)
		}
		// 失败状态
		if (this.state === REJECTED) {
			// 若onRejected为函数，则传入result作为参数执行
			isFunction(onRejected) && onRejected(this.result)
		}
	}
}

const p = new MyPromise((resolve, reject) => {
	Math.floor(Math.random() * 10) > 4 ? resolve('success') : reject('fail')
})
p.then(
	data => {
		console.log('data: ', data)
	},
	err => {
		console.log('err: ', err)
	}
)
