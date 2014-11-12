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
                controller:'DetailsCtrl',
                templateUrl:'templates/detail.html'
            })
            .when('/new', {
                controller:'DetailsCtrl',
                templateUrl:'templates/detail.html'
            })
            .otherwise({
                redirectTo:'/'
            });
    }])

    .directive('tooltip', function(){
        return {
            restrict: 'A',
            link: function(scope, element, attrs){
                $(element).tooltip();
            }
        };
    })

    .factory('beerApi', ['$http', function($http) {
        var url = 'http://localhost:4321/beers';

        var getBeers = function (fn) {
            $http.get(url).
                success(fn).
                error(function(data, status, headers, config) {
                    console.error(status, data);
                    // TODO: register error "Unable to retrieve list of beers";
                });
        };

        var deleteBeer = function (beer, fn) {
            $http.delete(url + '/' + beer.beer_id).
                success(fn).
                error(function(data, status, headers, config) {
                    // TODO: register error "Something went wrong, unable to delete beer"
                    console.error(status, data);
                });
        };

        var putBeer = function (beer, fn) {
            $http.put(url + '/' + beer.beer_id, beer).
                success(fn).
                error(function(data, status, headers, config) {
                    // TODO: register error "Save failed."
                    console.error(status, data);
                });
        };

        var postBeer = function (beer, fn) {
            $http.post(url, beer).
                success(fn).
                error(function(data, status, headers, config) {
                    // TODO: register error "Save failed."
                    console.error(status, data);
                });
        };

        var getBeer = function (beerId, fn) {
            $http.get(url + '/' + beerId).
                success(fn).
                error(function(data, status, headers, config) {
                    // TODO: register error "Unable to fetch beer data.";
                    console.error(status, data);
                });
        };

        var saveBeer = function (beer, fn) {
            if (beer.beer_id) {
                putBeer(beer, fn);
            } else {
                postBeer(beer, fn);
            }
        };

        return {
            'getBeers': getBeers,
            'deleteBeer': deleteBeer,
            'getBeer': getBeer,
            'saveBeer': saveBeer
        }
    }])

    .controller('ListCtrl', ['$scope', 'beerApi', function($scope, beerApi) {
            var updateBeerList = function() {
                beerApi.getBeers(
                    function(data, status, headers, config) {
                        $scope.beers = data;
                });
            }
    
            $scope.destroy = function(beer) {
                beerApi.deleteBeer(beer, 
                    function(data, status, headers, config) {
                        updateBeerList();
                    }
                );
            };
    
            updateBeerList();
        }])

    .controller('DetailsCtrl', ['$scope', '$location', '$routeParams', '$http', 'beerApi', function($scope, $location, $routeParams, $http, beerApi) {
                $scope.currentYear = currentYear();
    
                if ($routeParams.beerId) {
                    beerApi.getBeer($routeParams.beerId, function(data) {
                        $scope.beer = data;
                    });
                } else {
                    $scope.beer = {};
                }

                $scope.destroy = function() {
                    beerApi.deleteBeer($scope.beer, function() {
                        $location.path('/');
                    });
                };
    
                $scope.save = function() {
                    var beer = applyDefaults($scope.beer);

                    beerApi.saveBeer(beer, function() {
                        $location.path('/');
                    });
                };
            }]);
