angular.module('auth', ['flash'])

    .controller("LogoutCtrl", ["$location", "authentication",
        function ($location, authentication) {
            authentication.logout()
                .then(function(result) {
                    console.log("LOGGED OUT: ", result);
                    $location.path('/login');             
                }, function(error) {
                    console.error("NOT LOGGED OUT: ", error);
                });
        }])

    .controller("LoginCtrl", ["$scope", "$location", "$window", "authentication", "flash",
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
        }]);
