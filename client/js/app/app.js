angular.module('cellarium', 
    ['ngRoute', 
     'cellarium.tooltip', 
     'cellarium.api', 
     'cellarium.auth', 
     'cellarium.flash'])

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
                    controller: 'ListCtrl',
                    templateUrl: 'templates/list.html',
                    resolve: {
                        auth: authResolver
                    }
                })
                .when('/edit/:beerId', {
                    controller: 'DetailsCtrl',
                    templateUrl: 'templates/detail.html',
                    resolve: {
                        auth: authResolver
                    }
                })
                .when('/new', {
                    controller: 'DetailsCtrl',
                    templateUrl: 'templates/detail.html',
                    resolve: {
                        auth: authResolver
                    }
                })
                .when('/login', {
                    controller: 'LoginCtrl',
                    templateUrl: 'templates/login.html'
                })
                .when('/logout', {
                    controller: 'LogoutCtrl',
                    template: ''
                })
                .otherwise({
                    redirectTo: '/'
                });
        }])

    .controller('ListCtrl', ['$scope', 'beerApi', 'flash', 'beerDefaults', '$timeout', 
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

    .controller('CellariumCtrl', ['$scope', '$location', 'authentication',
        function($scope, $location, authentication) {
            $scope.isLoggedIn = function () {
                return !!authentication.getUserInfo();
            };

            $scope.isOnPage = function (page) {
                var currentRoute = $location.path().substring(1);
                return page === currentRoute;
            };
        }]);
