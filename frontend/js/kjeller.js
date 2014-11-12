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

    .controller('ListCtrl', function($scope, $http, $location) {
        var updateBeerList = function () {
            $http.get('http://localhost:4321/beers').
                success(function(data, status, headers, config) {
                    $scope.beers = data;
                }).
                error(function(data, status, headers, config) {
                    $scope.errorMessage = "Unable to retrieve list of beers";
                    console.error(status, data);
                });
        }

        updateBeerList();

        $scope.destroy = function(beerId) {
            $http.delete('http://localhost:4321/beers/' + beerId, $scope.beer).
                success(function(data, status, headers, config) {
                    updateBeerList();
                }).
                error(function(data, status, headers, config) {
                    $scope.errorMessage = "Delete failed.";
                    console.error(status, data);
                });
        };
    })

    .controller('CreateCtrl', function($scope, $location, $timeout, $http) {
        $scope.beer = {};

        $scope.save = function() {
            $http.post('http://localhost:4321/beers', $scope.beer).
                success(function(data, status, headers, config) {
                    $location.path('/');
                }).
                error(function(data, status, headers, config) {
                    $scope.errorMessage = "Save failed.";
                    console.error(status, data);
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
                    // TODO: better handeling of this case
                    $scope.errorMessage = "Unable to fetch beer data.";
                    console.error(status, data);
                });

            $scope.destroy = function() {
                $http.delete('http://localhost:4321/beers/' + beerId, $scope.beer).
                    success(function(data, status, headers, config) {
                        $location.path('/');
                    }).
                    error(function(data, status, headers, config) {
                        $scope.errorMessage = "Delete failed.";
                        console.error(status, data);
                    });
            };

            $scope.save = function() {
                $http.put('http://localhost:4321/beers/' + beerId, $scope.beer).
                    success(function(data, status, headers, config) {
                        $location.path('/');
                    }).
                    error(function(data, status, headers, config) {
                        $scope.errorMessage = "Save failed.";
                        console.error(status, data);
                    });
            };
        });

