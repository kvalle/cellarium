angular.module('kjeller', ['ngRoute'])

    .config(function($routeProvider) {
        $routeProvider
        .when('/', {
            controller:'ListCtrl',
            templateUrl:'templates/list.html'
        })
        .when('/edit/:beerId', {
            controller:'EditCtrl',
            templateUrl:'templates/detail.html'
        })
        .when('/new', {
            controller:'CreateCtrl',
            templateUrl:'templates/detail.html'
        })
        .otherwise({
            redirectTo:'/'
        });
    })

    .controller('ListCtrl', function($scope) {
        $scope.beers = [
            {
                "beer_id": "2", 
                "brewery": "Southern Tier", 
                "count": 1, 
                "name": "Backburner"
            }, 
            {
                "beer_id": "3", 
                "brewery": "N\u00f8gne \u00d8", 
                "count": 2, 
                "name": "Imperial Stout"
            }
        ];
    })

    .controller('CreateCtrl', function($scope, $location, $timeout) {
        $scope.save = function() {
            console.log("TODO: save")
        };
    })

    .controller('EditCtrl',
        function($scope, $location, $routeParams) {
            var beerId = $routeParams.beerId;

            $scope.beer = null;

            $scope.destroy = function() {
                console.log("TODO: delete")
                $location.path('/');
            };

            $scope.save = function() {
                console.log("TODO: save")
                $location.path('/');
            };
        });

