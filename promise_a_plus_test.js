import PromiseAplusTests from 'promises-aplus-tests'
import MyPromise from './myPromise'

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
PromiseAplusTests(adapter, err => {
	console.log(err)
})
