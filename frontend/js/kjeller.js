var applyDefaults = function(beer) {
    if (!beer.vintage) {
        beer.vintage = currentYear();
    }
    if (!beer.count) {
        beer.count = 1;
    }

    return beer;
}

var currentYear = function() {
    return new Date().getFullYear();
}


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
        $scope.currentYear = currentYear();

        $scope.save = function() {
            var beer = applyDefaults($scope.beer);
            $http.post('http://localhost:4321/beers', beer).
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
            $scope.currentYear = currentYear();

            $http.get('http://localhost:4321/beers/' + $routeParams.beerId).
                success(function(data, status, headers, config) {
                    $scope.beer = data;
                }).
                error(function(data, status, headers, config) {
                    // TODO: better handeling of this case
                    $scope.errorMessage = "Unable to fetch beer data.";
                    console.error(status, data);
                });

            $scope.destroy = function() {
                $http.delete('http://localhost:4321/beers/' + $routeParams.beerId, $scope.beer).
                    success(function(data, status, headers, config) {
                        $location.path('/');
                    }).
                    error(function(data, status, headers, config) {
                        $scope.errorMessage = "Delete failed.";
                        console.error(status, data);
                    });
            };

            $scope.save = function() {
                var beer = applyDefaults($scope.beer);
                $http.put('http://localhost:4321/beers/' + $routeParams.beerId, beer).
                    success(function(data, status, headers, config) {
                        $location.path('/');
                    }).
                    error(function(data, status, headers, config) {
                        $scope.errorMessage = "Save failed.";
                        console.error(status, data);
                    });
            };
        });

