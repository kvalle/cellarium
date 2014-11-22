angular.module('kjeller', ['ngRoute'])

    .config(['$routeProvider', 
        function($routeProvider) {
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

    .run(['$rootScope', '$location', 'flash',
        function($rootScope, $location, flash) {
            $rootScope.isOnPage = function (page) {
                var currentRoute = $location.path().substring(1);
                return page === currentRoute;
            };
            $rootScope.flash = flash;
        }])

    .factory('flash', ['$rootScope',
        function($rootScope) {
            var messages = [];

            var addMessage = function (text, type) {
                messages.push({
                    "text": text,
                    "type": type
                });
            };

            return {
                messages: messages,

                success: _.partialRight(addMessage, "success"),
                info: _.partialRight(addMessage, "info"),
                warn: _.partialRight(addMessage, "warning")
            };
        }])

    .directive('tooltip', 
        function(){
            return {
                restrict: 'A',
                link: function(scope, element, attrs){
                    $(element).tooltip();
                }
            };
        })

    .factory('beerDefaults', 
        function() {
            return {
                'year': new Date().getFullYear(),
                'count': 1
            }
        })

    .factory('beerApi', ['$http', 'beerDefaults', 'flash',
        function($http, defaults, flash) {
            var url = 'http://localhost:4321/beers';

            var applyDefaults = function(beer) {
                if (!beer.vintage) {
                    beer.vintage = defaults.year;
                }
                if (!beer.count) {
                    beer.count = defaults.count;
                }

                return beer;
            }

            var getBeers = function (fn) {
                $http.get(url)
                    .success(fn)
                    .error(function(data, status, headers, config) {
                        console.error(status, data);
                        // TODO: register error "Unable to retrieve list of beers";
                    });
            };

            var deleteBeer = function (beer, fn) {
                $http.delete(url + '/' + beer.beer_id)
                    .success(fn)
                    .error(function(data, status, headers, config) {
                        // TODO: register error "Something went wrong, unable to delete beer"
                        console.error(status, data);
                    });
            };

            var putBeer = function (beer, fn) {
                $http.put(url + '/' + beer.beer_id, beer)
                    .success(fn)
                    .error(function(data, status, headers, config) {
                        // TODO: register error "Save failed."
                        console.error(status, data);
                        flash.info("whoops")
                    });
            };

            var postBeer = function (beer, fn) {
                $http.post(url, beer)
                    .success(fn)
                    .error(function(data, status, headers, config) {
                        // TODO: register error "Save failed."
                        console.error(status, data);
                    });
            };

            var getBeer = function (beerId, fn) {
                $http.get(url + '/' + beerId)
                    .success(fn)
                    .error(function(data, status, headers, config) {
                        // TODO: register error "Unable to fetch beer data.";
                        console.error(status, data);
                    });
            };

            var saveBeer = function (beer, fn) {
                beer = applyDefaults(beer);

                if (beer.beer_id) {
                    putBeer(beer, fn);
                } else {
                    postBeer(beer, fn);
                }
            };

            return {
                'getBeer': getBeer,
                'getBeers': getBeers,
                'deleteBeer': deleteBeer,
                'saveBeer': saveBeer
            }
        }])

    .controller('ListCtrl', ['$scope', 'beerApi', 'flash', 
        function($scope, beerApi, flash) {
            var updateBeerList = function() {
                beerApi.getBeers(function(data) {
                    $scope.beers = data;
                });
            }
    
            $scope.destroy = function(beer) {
                beerApi.deleteBeer(beer, function() {
                    flash.success("Deleted \"" + beer.brewery + " " + beer.name + "\"");
                    updateBeerList();
                });
            };
    
            updateBeerList();
        }])

    .controller('DetailsCtrl', ['$scope', '$location', '$routeParams', 'beerApi', 'beerDefaults', 'flash', 
        function($scope, $location, $routeParams, beerApi, beerDefaults, flash) {
            $scope.defaults = beerDefaults;

            if ($routeParams.beerId) {
                beerApi.getBeer($routeParams.beerId, function(data) {
                    $scope.beer = data;
                });
            } else {
                $scope.beer = {};
            }

            $scope.destroy = function() {
                beerApi.deleteBeer($scope.beer, function() {
                    flash.info("Deleted beer");
                    $location.path('/');
                });
            };

            $scope.save = function() {
                beerApi.saveBeer($scope.beer, function() {
                    flash.info("saved something");
                    $location.path('/');
                });
            };
        }]);
