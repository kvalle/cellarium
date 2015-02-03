angular.module('tooltip', [])

    .directive('tooltip', function () {
        return {
            restrict: 'A',
            link: function(scope, element, attrs){
                $(element).tooltip();
            }
        };
    });
