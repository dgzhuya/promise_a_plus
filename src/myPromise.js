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
        // 用于记录constructor的参数执行状态
        let isExecuted = false

        /**
         * 用于限制函数执行次数
         * @param {Function} fn 需要限制的函数
         * @returns 若isExecuted为true则函数不会执行
         */
        const executedHandler = fn => result => {
            if (isExecuted) return
            isExecuted = true
            isFunction(fn) && fn(result)
        }

        /**
         * 通过传递状态生成onFulfilled或者onRejected函数
         * @param {*} state 需要生成的函数其状态
         * @returns onFulfilled | onRejected
         */
        const resultHandler = state => result => {
            // 若当前状态已经被修改则不可修改状态
            if (this.state !== PENDING) return
            // 修改状态为执行成功
            this.state = state
            // 保存操作成功结果
            this.result = result
            // 将数组中的函数在微任务队列中运行
            queueMicrotask(this._runAllCallbacks)
        }

        /**
         * 异步操作成功时调用
         * @param {*} value 操作成功结果
         * @returns void
         */
        const onFulfilled = resultHandler(FULFILLED)
        /**
         * 异步操作失败时调用
         * @param {*} reason 错误信息
         * @returns void
         */
        const onRejected = resultHandler(REJECTED)

        /**
         * 处理resolve传入参数信息
         * @param {*} value resolve传入参数
         */
        const resolvePromise = value => {
            // 传入value为当前对象时，抛出异常
            if (value === this) {
                return onRejected(new TypeError('Chaining cycle detected for promise'))
            }
            // 当前value为MyPromise则执行函数
            if (value instanceof MyPromise) {
                return value.then(onFulfilled, onRejected)
            }
            // 当value值为对象的时候
            if (isObject(value) || isFunction(value)) {
                try {
                    // 如果value包含一个then字段
                    const then = value.then
                    // 如果then为一个函数
                    if (isFunction(then)) {
                        // 进入一个新的MyPromise对象
                        return new MyPromise(then.bind(value)).then(onRejected, onRejected)
                    }
                } catch (error) {
                    // 如果抛出异常则调用reject函数
                    return onRejected(error)
                }
            }
            // 若为其他类型则直接调用resolve函数
            onFulfilled(value)
        }

        try {
            // 执行外部传入参数
            executor(executedHandler(resolvePromise), executedHandler(onRejected))
        } catch (error) {
            // 若executor抛出异常则调用reject函数
            executedHandler(onRejected)(error)
        }
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
        // 在微任务队列中执行当前任务
        queueMicrotask(() => this._runCallback(callback))
    }

    /**
     * 执行callbacks数组中保存的
     */
    _runAllCallbacks = () => {
        // 循环调用数组元素执行
        this.callbacks.forEach(this._runCallback)
        // 完成后清空数组
        this.callbacks = []
    }

    /**
     * 执行then传入的函数信息
     * @param {object} callback 需要执行的回调函数信息
     * @param {*} callback.onFulfilled 成功状态下回调函数
     * @param {*} callback.onRejected 失败状态下回调函数
     */
    _runCallback = ({ onFulfilled, onRejected }) => {
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
    resolve({
        then: resolve => resolve('aaa')
    })
    resolve('bbb')
})
p.then(
    data => {
        console.log('data: ', data)
    },
    err => {
        console.log('err: ', err)
    }
)
