angular.module('cellariumApp', ['ngRoute', 'tooltip', 'beerApiModule', 'authentication'])

    .config(['$routeProvider', 
        function($routeProvider) {
            var authResolver = ['$q', 'authentication', 
                function ($q, authentication) {
                    var userInfo = authentication.getUserInfo();
                    if (userInfo) {
                        return $q.when(userInfo);
                    } else {
                        return $q.reject({ authenticated: false });
                    }
                }];

            $routeProvider
                .when('/', {
                    controller: 'ListController',
                    templateUrl: 'templates/list.html',
                    resolve: {
                        auth: authResolver
                    }
                })
                .when('/edit/:beerId', {
                    controller: 'DetailsController',
                    templateUrl: 'templates/detail.html',
                    resolve: {
                        auth: authResolver
                    }
                })
                .when('/new', {
                    controller: 'DetailsController',
                    templateUrl: 'templates/detail.html',
                    resolve: {
                        auth: authResolver
                    }
                })
                .when('/login', {
                    controller: 'LoginController',
                    templateUrl: 'templates/login.html'
                })
                .when('/logout', {
                    controller: 'LogoutController',
                    template: ''
                })
                .otherwise({
                    redirectTo: '/'
                });
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

    .controller('FlashController', ['$scope', 'flash',
        function($scope, flash) {
            $scope.message = flash.message;
            $scope.clear = flash.clear;
        }])

    .controller('ListController', ['$scope', 'beerApi', 'flash', 'beerDefaults', '$timeout', 
        function($scope, beerApi, flash, beerDefaults, $timeout) {
            $scope.defaults = beerDefaults;
            $scope.beer = {};
            
            var updateBeerList = function() {
                beerApi.getBeers(function(data) {
                    $scope.beers = data;
                });
            }
    
            $scope.destroy = function(beer) {
                beerApi.deleteBeer(beer, function() {
                    updateBeerList();
                });
            };

            $scope.add = function(beer) {
                beerApi.saveBeer(beer, function() {
                    updateBeerList();
                    $scope.beerForm.$setPristine();
                    $scope.beerForm.$setUntouched();
                    $scope.beer = {};
                    $timeout(function() {
                        angular.element('#newBeerCount').focus();
                    }); 
                });
            };
    
            updateBeerList();
        }])

    .controller('DetailsController', ['$scope', '$location', '$routeParams', 'beerApi', 'beerDefaults', 'flash', 
        function($scope, $location, $routeParams, beerApi, beerDefaults, flash) {
            $scope.defaults = beerDefaults;

            if ($routeParams.beerId) {
                beerApi.getBeer($routeParams.beerId, function(data) {
                    $scope.beer = data;
                });
            } else {
                $scope.beer = {};
            }

            $scope.destroy = function(beer) {
                beerApi.deleteBeer(beer, function() {
                    $location.path('/');
                });
            };

            $scope.save = function(beer) {
                beerApi.saveBeer(beer, function() {
                    $location.path('/');
                });
            };
        }])

    .controller('CellariumController', ['$scope', '$location', 'authentication',
        function($scope, $location, authentication) {
            $scope.isLoggedIn = function () {
                return !!authentication.getUserInfo();
            };

            $scope.isOnPage = function (page) {
                var currentRoute = $location.path().substring(1);
                return page === currentRoute;
            };
        }]);
