define(['angular', 'components/shared/powerschoolModule'], angular => {
	'use strict'
	const medicationModule = angular.module('medicationModule', ['powerSchoolModule'])

	medicationModule.controller('medicationInventoryController', function ($scope, $rootScope, $attrs) {
		$j(document).dblclick(() => console.log($scope))

		$rootScope.appData = {
			context: $attrs.ngContext
		}

		$scope.message = 'This is the medication inventory plugin. It is currently under construction.'
	})
})
