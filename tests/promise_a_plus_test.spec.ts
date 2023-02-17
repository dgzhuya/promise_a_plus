import PromiseAplusTests from 'promises-aplus-tests'
// import MyPromise from './other_promise'
import MyPromise from '../src/myPromisePlus'

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
		let dfd: any = {}
		dfd.promise = new MyPromise((resolve, reject) => {
			dfd.resolve = resolve
			dfd.reject = reject
		})
		return dfd
	}
}
PromiseAplusTests(adapter, function (err) {
	console.log(err)
})
