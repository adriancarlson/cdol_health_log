'use strict'
define(function (require) {
	// UPDATE these two variables for your table and module location
	// var RESOURCE_TABLE = 'u_applications';
	// var module = require('components/college_applications/module');
	// var RESOURCE_URL = '/ws/schema/table/' + RESOURCE_TABLE;
	// var JSON_HEADER = {
	//     headers: {
	//         'Content-Type': 'application/json; charset=UTF-8'
	//     }
	// };
	// var psUtils = require('components/shared/utils/psUtils');
	// module.controller('myEditCtrl', ['$http', '$scope', '$rootScope', '$filter', function($http, $scope, $rootScope, $filter) {
	//     var errorMessages = [];
	//     var warningMessages = [];
	//     // UPDATE context to represent your blank JSON payload
	//     var context = {
	//         "id": null,
	//         "studentsdcid": null,
	//         "institutionid": null,
	//         "request_date": null,
	//         "request_status": null,
	//         "scholarship": null,
	//         "scholarship_amount": null,
	//         "completion_date": null,
	//         "outcome": null,
	//         "notes": null
	//     };
	//     var init = function() {
	//         $scope.currentContext = context;
	//         $scope.$emit('open.drawer.event', openDrawer);
	//         $scope.$emit('cancel.drawer.event', cancelDrawer);
	//         $scope.$emit('save.drawer.event', saveDrawer);
	//         $scope.$emit('deleteinit.item.event', deleteInit);
	//         $scope.$emit('delete.item.event', deleteItem);
	//         $scope.$emit('cancel.item.event', cancelDrawer);
	//         $scope.$emit('save.item.event', saveDrawer);
	//         $scope.$emit('deletecancel.item.event', deleteCancel);
	//     };
	//     var openDrawer = function(openCallBack, data) {
	//         if(data.data.id==null) {
	//             clearModel(data);
	//         }else{
	//             loadModel(data);
	//         }
	//         openCallBack();
	//     };
	//     var clearModel = function(data) {
	//         Object.keys(context).forEach(function(key) {
	//             // preserve studentsdcid for new record
	//             if(key == 'studentsdcid') {
	//                 context[key] = data.data[key];
	//             // clear all other keys
	//             } else {
	//                 context[key] = null;
	//             }
	//         });
	//     };
	//     var loadModel = function(data) {
	//         Object.keys(context).forEach(function(key) {
	//             context[key] = data.data[key];
	//         });
	//     };
	//     var cancelDrawer = function(closeDrawer) {
	//         closeDrawer();
	//     };
	//     var saveDrawer = function(closeDrawer, data) {
	//         loadingDialog();
	//         console.log(buildPayload());
	//         closeLoading();
	//         saveData(RESOURCE_URL, buildPayload()).then(function(returned){
	//             closeLoading();
	//             if(returned.status==200 || returned.status==201) {
	//                 data.data = context;
	//                 $scope.$emit('saved.item.row',data.data);
	//                 closeDrawer(true);
	//             }else{
	//                 //FAIL
	//                 closeDrawer(false);
	//             }
	//         },
	//         function(error) {
	//             closeLoading();
	//             if (error.status === 409 && error.data && psUtils.hasValue(error.data.message)) {
	//                 warningMessages = [error.data.message];
	//             } else if (error.status === 403) {
	//                 errorMessages = ['You do not have permission'];
	//             } else {
	//                 errorMessages = ['An error occurred contact your system administrator'];
	//             }
	//             closeDrawer(false);
	//         });
	//     };
	//     var saveData = function(resourceURL, payload){
	//         var URL;
	//         if(payload.id>0) {
	//             URL = resourceURL + '/' + payload.id;
	//             return $http.put(URL, payload, JSON_HEADER);
	//         }else{
	//             URL = resourceURL;
	//             return $http.post(URL, payload, JSON_HEADER);
	//         }
	//     };
	//     var buildPayload = function(){
	//         // fix null values - change to empty string
	//         Object.keys(context).forEach(function(key) {
	//             if(context[key] == null) context[key] = '';
	//         });
	//         // base payload common for both add and update
	//         var payload = {
	//             "tables": {
	//                 [RESOURCE_TABLE]: {
	//                     "institutionid": context.institutionid,
	//                     "request_date": parseDateString(context.request_date),
	//                     "request_status": context.request_status,
	//                     "scholarship": context.scholarship,
	//                     "scholarship_amount": context.scholarship_amount,
	//                     "completion_date": parseDateString(context.completion_date),
	//                     "outcome": context.outcome,
	//                     "notes": context.notes
	//                 }
	//             }
	//         };
	//         if(context.id>0) {
	//             // existing record - add necessary payload data
	//             payload.id = context.id;
	//             payload.name = RESOURCE_TABLE;
	//         } else {
	//             // new record needs studentsdcid for foreign key 1-many requirement
	//             payload.tables[RESOURCE_TABLE].studentsdcid = context.studentsdcid;
	//         }
	//         return payload;
	//     };
	//     var deleteInit = function(closeDrawer) {
	//         $j('#btn_delete,#btn_deletecancel').removeClass('hide');
	//         $j('#btn_delete1').addClass('hide');
	//         closeDrawer(false);
	//     }
	//     var deleteCancel = function(closeDrawer) {
	//         $j('#btn_delete,#btn_deletecancel').addClass('hide');
	//         $j('#btn_delete1').removeClass('hide');
	//         closeDrawer(false);
	//     }
	//     var deleteItem = function(closeDrawer, data) {
	//         loadingDialog();
	//         $http.delete(RESOURCE_URL + '/' + data.data.id).then(function(returned){
	//             closeLoading();
	//             if(returned.status==204) {
	//                 $scope.$emit('deleted.item.row',data.data);
	//                 closeDrawer(true);
	//             }else{
	//                 //FAIL
	//                 closeDrawer(false);
	//             }
	//         },
	//         function(error) {
	//             closeLoading();
	//             if (error.status === 409 && error.data && psUtils.hasValue(error.data.message)) {
	//                 warningMessages = [error.data.message];
	//             } else if (error.status === 403) {
	//                 errorMessages = ['You do not have permission'];
	//             } else {
	//                 errorMessages = ['An error occurred contact your system administrator'];
	//             }
	//             closeDrawer(false);
	//         });
	//     }
	//     var clearMessages = function() {
	//         errorMessages = [];
	//         warningMessages = [];
	//     };
	//     var parseDateString = function(dateString) {
	// 		// returns MM/dd/yyyy as yyyy-MM-dd string
	// 		var split = dateString.split('/');
	//         return ( split[2] + '-' + split[0] + '-' + split[1] );
	// 	};
	//     init();
	// }]);
})
