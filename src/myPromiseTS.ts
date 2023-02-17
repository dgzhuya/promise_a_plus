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

export default class MyPromise<T> {
    private result: any
    private state: STATE = STATE.PENDING
    private callbacks: ICallback[] = []

    constructor(executor: TPromiseExecutor<T>) {
        let isExecuted = false

        const executeHandler =
            <T = any>(fn: Function) =>
            (result: T) => {
                if (isExecuted) return
                isExecuted = true
                fn(result)
            }

        const resultHandler = (state: STATE) => (result: any) => {
            if (this.state !== STATE.PENDING) return
            this.state = state
            this.result = result
            queueMicrotask(this._runAllTask)
        }

        const onRejected = resultHandler(STATE.REJECTED)
        const onFulfilled = resultHandler(STATE.FULFILLED)

        const resolvePromise = (value: any) => {
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
            executor(executeHandler<T>(resolvePromise), executeHandler(onRejected))
        } catch (error) {
            executeHandler(onRejected)(error)
        }
    }

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

    private _runAllTask = () => {
        this.callbacks.forEach(this._runTask)
        this.callbacks = []
    }

    private _runTask = ({ onFulfilled, onRejected, resolve, reject }: ICallback) => {
        try {
            if (this.state === STATE.FULFILLED) {
                isFunction(onFulfilled) ? resolve(onFulfilled(this.result)) : resolve(this.result)
            }
            if (this.state === STATE.REJECTED) {
                isFunction(onRejected) ? resolve(onRejected(this.result)) : reject(this.result)
            }
        } catch (error) {
            reject(error)
        }
    }
}
