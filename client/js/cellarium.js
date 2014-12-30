angular.module('cellarium', ['ngRoute'])

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
        }])

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
            var urlFor = function (user, beerId) {
                var url = '/api/' + user + '/beers';
                if (beerId) {
                    url += '/' + beerId;
                }
                console.log(url);
                return url;
            };

            var applyDefaults = function(beer) {
                if (!beer.vintage) {
                    beer.vintage = defaults.year;
                }
                if (!beer.count) {
                    beer.count = defaults.count;
                }

                return beer;
            };

            var getBeers = function (user, fn) {
                $http.get(urlFor(user))
                    .success(fn)
                    .error(function(data, status, headers, config) {
                        console.error(status, data);
                        flash.error("Unable to retrieve list of beers");
                    });
            };

            var deleteBeer = function (user, beer, fn) {
                $http.delete(urlFor(user, beer.beer_id))
                    .success(fn)
                    .error(function(data, status, headers, config) {
                        flash.error("Delete of \"" + beer.brewery + " " + beer.name + "\" failed");
                        console.error(status, data);
                    });
            };

            var putBeer = function (user, beer, fn) {
                $http.put(urlFor(user, beer.beer_id), beer)
                    .success(fn)
                    .error(function(data, status, headers, config) {
                        flash.error("Save of \"" + beer.brewery + " " + beer.name + "\" failed");
                        console.error(status, data);
                    });
            };

            var postBeer = function (user, beer, fn) {
                $http.post(urlFor(user), beer)
                    .success(fn)
                    .error(function(data, status, headers, config) {
                        flash.error("Save of \"" + beer.brewery + " " + beer.name + "\" failed");
                        console.error(status, data);
                    });
            };

            var getBeer = function (user, beerId, fn) {
                $http.get(urlFor(user, beerId))
                    .success(fn)
                    .error(function(data, status, headers, config) {
                        flash.error("Unable to fetch beer details")
                        console.error(status, data);
                    });
            };

            var saveBeer = function (user, beer, fn) {
                beer = applyDefaults(beer);

                if (beer.beer_id) {
                    putBeer(user, beer, fn);
                } else {
                    postBeer(user, beer, fn);
                }
            };

            return {
                'getBeer': getBeer,
                'getBeers': getBeers,
                'deleteBeer': deleteBeer,
                'saveBeer': saveBeer
            }
        }])

    .controller('ListCtrl', ['$scope', 'beerApi', 'flash', 'beerDefaults', 
        function($scope, beerApi, flash, beerDefaults) {
            $scope.defaults = beerDefaults;
            $scope.beer = {};
            
            var updateBeerList = function() {
                beerApi.getBeers('kjetil', function(data) {
                    $scope.beers = data;
                });
            }
    
            $scope.destroy = function(beer) {
                beerApi.deleteBeer('kjetil', beer, function() {
                    updateBeerList();
                });
            };

            $scope.add = function(beer) {
                beerApi.saveBeer('kjetil', beer, function() {
                    updateBeerList();
                    $scope.beer = {};
                });
            };
    
            updateBeerList();
        }])

    .controller('DetailsCtrl', ['$scope', '$location', '$routeParams', 'beerApi', 'beerDefaults', 'flash', 
        function($scope, $location, $routeParams, beerApi, beerDefaults, flash) {
            $scope.defaults = beerDefaults;

            if ($routeParams.beerId) {
                beerApi.getBeer('kjetil', $routeParams.beerId, function(data) {
                    $scope.beer = data;
                });
            } else {
                $scope.beer = {};
            }

            $scope.destroy = function() {
                beerApi.deleteBeer('kjetil', $scope.beer, function() {
                    $location.path('/');
                });
            };

            $scope.save = function() {
                beerApi.saveBeer('kjetil', $scope.beer, function() {
                    $location.path('/');
                });
            };
        }]);
