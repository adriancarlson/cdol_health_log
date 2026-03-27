define(['angular', 'components/shared/powerschoolModule'], angular => {
	'use strict'
	const medicationModule = angular.module('medicationModule', ['powerSchoolModule'])

	medicationModule.controller('inventoryController', function ($scope, $rootScope, $attrs) {
		$j(document).dblclick(() => console.log($scope))

		$rootScope.appData = {
			context: $attrs.ngContext
		}
	})
})
