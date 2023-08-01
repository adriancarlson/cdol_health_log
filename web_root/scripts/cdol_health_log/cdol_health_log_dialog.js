define(['angular', 'components/shared/index', '/scripts/cdol/services/pqService.js', '/scripts/cdol/services/formatService.js', '/scripts/cdol/services/psApiService.js'], function (angular) {
	var cdolHealthLogDialogApp = angular.module('cdolHealthLogDialogMod', ['powerSchoolModule', 'pqModule', 'formatService', 'psApiModule'])

	cdolHealthLogDialogApp.controller('cdolHealthLogDialogCtrl', function ($scope, $attrs, pqService, formatService, psApiService) {
		var context = {
			field1: ''
		}

		var init = function () {
			$scope.myContext = context
			$scope.$emit('open.drawer.event', function (callback, data) {
				console.log('open event received', data)
				callback()
			})
			$scope.$emit('cancel.drawer.event', function (callback, data) {
				console.log('cancel event received')
				callback()
			})
			$scope.$emit('save.drawer.event', function (callback, data) {
				console.log('save event received')
				callback()
			})
			$scope.$emit('this.is.my.new.event', function (callback, data) {
				console.log('this.is.my.new.event received')
			})
			$scope.$emit('this.is.my.new.event2', function (callback, data) {
				console.log('this.is.my.new.event2 received')
				callback()
			})
			$scope.$emit('this.is.my.new.event4', function (callback, data) {
				console.log('this.is.my.new.event4 received')
				callback()
			})
		}

		init()
	})
})
