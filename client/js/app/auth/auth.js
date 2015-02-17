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

    .factory("authentication", ["$http", "$q", "$window", 'flash', '$rootScope',
        function ($http, $q, $window, flash, $rootScope) {
            var userInfo;

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
                    console.log("LOGIN SUCCESS: ", userInfo);
                }, function (error) {
                    flash.error("Bad username or password");
                    console.log("LOGIN FAILED: ", error);
                });
            }

            function logout() {
                $http({
                    method: "DELETE",
                    url: "/api/auth/token"
                }).then(function (result) {
                    clearUserInfo();
                    $rootScope.$broadcast('auth:logout');
                    console.log("LOGGED OUT");
                }, function (error) {
                    console.error("NOT LOGGED OUT: ", error);
                });
            }

            function getUserInfo() {
                return userInfo;
            }

            function clearUserInfo() {
                userInfo = null;
                $window.sessionStorage["userInfo"] = null;
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
                getUserInfo: getUserInfo,
                clearUserInfo: clearUserInfo
            };
        }]);
