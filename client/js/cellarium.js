angular.module('cellariumApp', ['ngRoute', 'tooltip'])

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

    .config(['$httpProvider',
        function($httpProvider) {
            $httpProvider.interceptors.push('authHttpResponseInterceptor');
        }])

    .factory('authHttpResponseInterceptor',['$q','$location', '$injector',
        function($q, $location, $injector) {
            return {
                request: function(config) {
                    var authentication = $injector.get('authentication');
                    var user = authentication.getUserInfo();
                    if (user) {
                        config.headers['X-Access-Token'] = user.token;
                    }
                    console.log("DOING REQUEST: ", config);
                    return config || $q.when(config);
                },
                response: function(response){
                    return response || $q.when(response);
                },
                responseError: function(rejection) {
                    if (rejection.status === 401) {
                        console.log("CAUGHT 401 RESPONSE: ", rejection);
                        $location.path('/login');
                    }
                    return $q.reject(rejection);
                }
            }
        }])

    .controller("LogoutController", ["$location", "authentication",
        function ($location, authentication) {
            authentication.logout()
                .then(function(result) {
                    console.log("LOGGED OUT: ", result);
                    $location.path('/login');             
                }, function(error) {
                    console.error("NOT LOGGED OUT: ", error);
                });
        }])

    .controller("LoginController", ["$scope", "$location", "$window", "authentication", "flash",
        function ($scope, $location, $window, authentication, flash) {
            $scope.userInfo = null;

            $scope.login = function () {
                authentication.login($scope.username, $scope.password)
                    .then(function (result) {
                        $scope.userInfo = result;
                        console.log("LOGIN SUCCESS: ", $scope.userInfo)
                        flash.clear()
                        $location.path("/");
                    }, function (error) {
                        flash.error("Bad username or password");
                        console.log("LOGIN FAILED: ", error);
                    });
            };
        }])

    .run(["$rootScope", "$location",
        function ($rootScope, $location) {

            $rootScope.$on("$routeChangeSuccess", function (userInfo) {
                console.log(userInfo);
            });

            $rootScope.$on("$routeChangeError", function (event, current, previous, eventObj) {
                if (eventObj.authenticated === false) {
                    $location.path("/login");
                }
            });
        }])

    .factory("authentication", ["$http", "$q", "$window",
        function ($http, $q, $window) {
            var userInfo;

            function login(username, password) {
                var deferred = $q.defer();

                $http.post("/api/auth/token", { username: username, password: password })
                    .then(function (result) {
                        userInfo = result.data;
                        $window.sessionStorage["userInfo"] = JSON.stringify(userInfo);
                        deferred.resolve(userInfo);
                    }, function (error) {
                        deferred.reject(error);
                    });

                return deferred.promise;
            }

            function logout() {
                var deferred = $q.defer();

                $http({
                    method: "DELETE",
                    url: "/api/auth/token"
                }).then(function (result) {
                    userInfo = null;
                    $window.sessionStorage["userInfo"] = null;
                    deferred.resolve(result);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            }

            function getUserInfo() {
                return userInfo;
            }

            function init() {
                if ($window.sessionStorage["userInfo"]) {
                    userInfo = JSON.parse($window.sessionStorage["userInfo"]);
                }
            }
            init();

            return {
                login: login,
                logout: logout,
                getUserInfo: getUserInfo
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

    .controller('FlashController', ['$scope', 'flash',
        function($scope, flash) {
            $scope.message = flash.message;
            $scope.clear = flash.clear;
        }])

    .factory('beerDefaults', 
        function() {
            return {
                'year': new Date().getFullYear(),
                'count': 1
            }
        })

    .factory('beerApi', ['$http', 'beerDefaults', 'flash',
        function($http, defaults, flash) {

            var urlFor = function (beerId) {
                var url = '/api/beers';
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

            var getBeers = function (fn) {
                $http.get(urlFor()).success(fn)
                    .error(function(data, status, headers, config) {
                        console.error(status, data);
                        flash.error("Unable to retrieve list of beers");
                    });
            };

            var deleteBeer = function (beer, fn) {
                $http.delete(urlFor(beer.beer_id))
                    .success(fn)
                    .error(function(data, status, headers, config) {
                        flash.error("Delete of \"" + beer.brewery + " " + beer.name + "\" failed");
                        console.error(status, data);
                    });
            };

            var putBeer = function (beer, fn) {
                $http.put(urlFor(beer.beer_id), beer)
                    .success(fn)
                    .error(function(data, status, headers, config) {
                        flash.error("Save of \"" + beer.brewery + " " + beer.name + "\" failed");
                        console.error(status, data);
                    });
            };

            var postBeer = function (beer, fn) {
                $http.post(urlFor(), beer)
                    .success(fn)
                    .error(function(data, status, headers, config) {
                        flash.error("Save of \"" + beer.brewery + " " + beer.name + "\" failed");
                        console.error(status, data);
                    });
            };

            var getBeer = function (beerId, fn) {
                $http.get(urlFor(beerId))
                    .success(fn)
                    .error(function(data, status, headers, config) {
                        flash.error("Unable to fetch beer details")
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
