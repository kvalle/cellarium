angular.module('cellarium.flash', [])

    .factory('flash', ['$rootScope',
        function($rootScope) {
            var message = {
                "text": "",
                "type": ""
            };

            var clear = function () {
                message.text = "";
            };

            var set = function (text, type) {
                message.text = text;
                message.type = type;
            };

            return {
                message: message,
                clear: clear,

                success: _.partialRight(set, "success"),
                info: _.partialRight(set, "info"),
                warn: _.partialRight(set, "warning"),
                error: _.partialRight(set, "danger")
            };
        }])

    .controller('FlashCtrl', ['$scope', 'flash',
        function($scope, flash) {
            $scope.message = flash.message;
            $scope.clear = flash.clear;
        }]);
