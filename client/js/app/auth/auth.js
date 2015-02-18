angular.module('auth', ['flash'])

    .controller("LoginCtrl", ["$scope", "authentication",
        function ($scope, authentication) {
            $scope.login = function () {
                authentication.login($scope.username, $scope.password);
            };
        }])

    .controller("LogoutCtrl", ["authentication",
        function (authentication) {
            authentication.logout();
        }])

    .config(['$httpProvider',
        function($httpProvider) {
            $httpProvider.interceptors.push('authHttpResponseInterceptor');
        }])

    .factory('authHttpResponseInterceptor',['$q','$location', '$injector', '$rootScope',
        function($q, $location, $injector, $rootScope) {
            return {
                request: function(config) {
                    var authentication = $injector.get('authentication');
                    var user = authentication.getUserInfo();
                    var apiCall = _.startsWith(config.url, '/api/');
                    if (user && apiCall) {
                        config.headers['X-Access-Token'] = user.token;
                    }
                    console.log("DOING REQUEST: ", config);
                    return config || $q.when(config);
                },
                response: function(response){
                    if (response.headers('X-Access-Token-Renewed')) {
                        var authentication = $injector.get('authentication');
                        authentication.registerActivity();
                    }
                    return response || $q.when(response);
                },
                responseError: function(rejection) {
                    if (rejection.status === 401) {
                        $rootScope.$broadcast("auth:unauthorized");
                    }
                    return $q.reject(rejection);
                }
            }
        }])

    .run(["$rootScope", "$location",
        function ($rootScope, $location) {

            $rootScope.$on("auth:unauthorized", function () {
                $location.path("/login");
            });

            $rootScope.$on("auth:login", function () {
                $location.path("/");
            });

            $rootScope.$on("auth:logout", function () {
                $location.path("/login");
            });
        }])

    .factory("authentication", ["$http", "$q", "$window", 'flash', '$rootScope', '$timeout', 'config',
        function ($http, $q, $window, flash, $rootScope, $timeout, config) {
            var userInfo,
                lastActivity;

            function login(username, password) {
                $http({
                    method: "POST",
                    url: "/api/auth/token",
                    data: { username: username, password: password }
                }).then(function (result) {
                    userInfo = result.data;
                    $window.sessionStorage["userInfo"] = JSON.stringify(userInfo);
                    flash.clear();
                    $rootScope.$broadcast('auth:login', {userInfo: userInfo});
                    trackSession();
                    console.log("LOGIN SUCCESS: ", userInfo);
                }, function (error) {
                    if (error.status === 401) {
                        flash.error("Login failed: bad username or password");
                        console.log("LOGIN FAILED: ", error);
                    } else {
                        throw error;
                    }
                });
            }

            function logout() {
                $http({
                    method: "DELETE",
                    url: "/api/auth/token/" + userInfo.token
                }).then(function (result) {
                    clearUserInfo();
                    $rootScope.$broadcast('auth:logout');
                    console.log("LOGGED OUT");
                }, function (error) {
                    console.error("NOT LOGGED OUT: ", error);
                });
            }

            function trackSession() {
                $timeout(
                    function () {
                        if (!userInfo) {
                            return;
                        }

                        var tokenAge = new Date() - lastActivity;
                        if (tokenAge > config.accessTokenTTL) {
                            logout();
                        } else {
                            trackSession();
                        }
                    }, 1000)
            }

            function getUserInfo() {
                return userInfo;
            }

            function clearUserInfo() {
                userInfo = null;
                $window.sessionStorage["userInfo"] = null;
            }

            function registerActivity() {
                lastActivity = new Date();
            }

            function init() {
                userInfo = JSON.parse($window.sessionStorage["userInfo"]);
                if (userInfo) {
                    registerActivity();
                    trackSession();
                }
            }
            init();

            $rootScope.$on("auth:unauthorized", function () {
                clearUserInfo();
            });

            return {
                login: login,
                logout: logout,
                getUserInfo: getUserInfo,
                registerActivity: registerActivity
            };
        }]);
