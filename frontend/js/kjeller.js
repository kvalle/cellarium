angular.module('kjeller', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
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
    }])

    .controller('ListCtrl', function($scope, $http) {
        $http.get('http://localhost:4321/beers').
            success(function(data, status, headers, config) {
                $scope.beers = data;
            }).
            error(function(data, status, headers, config) {
                console.error("TODO: handle errors");
            });
    })

    .controller('CreateCtrl', function($scope, $location, $timeout, $http) {
        $scope.save = function() {
            $http.post('http://localhost:4321/beers', $scope.beer).
                success(function(data, status, headers, config) {
                    $location.path('/');
                }).
                error(function(data, status, headers, config) {
                    console.error("TODO: handle errors on create");
                    $location.path('/');
                });
        };
    })

    .controller('EditCtrl',
        function($scope, $location, $routeParams, $http) {
            var beerId = $routeParams.beerId;

            $http.get('http://localhost:4321/beers/' + beerId).
                success(function(data, status, headers, config) {
                    $scope.beer = data;
                }).
                error(function(data, status, headers, config) {
                    console.error("TODO: handle errors");
                });

            $scope.destroy = function() {
                $http.delete('http://localhost:4321/beers/' + beerId, $scope.beer).
                    success(function(data, status, headers, config) {
                        $location.path('/');
                    }).
                    error(function(data, status, headers, config) {
                        console.error("TODO: handle errors on delete");
                        $location.path('/');
                    });
            };

            $scope.save = function() {
                $http.put('http://localhost:4321/beers/' + beerId, $scope.beer).
                    success(function(data, status, headers, config) {
                        $location.path('/');
                    }).
                    error(function(data, status, headers, config) {
                        console.error("TODO: handle errors on save");
                        $location.path('/');
                    });
            };
        });

