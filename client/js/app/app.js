angular.module('cellariumApp', ['ngRoute', 'cellarium', 'tooltip', 'api', 'auth', 'flash'])

    .config(['$compileProvider',
        function($compileProvider) {
            $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|blob):/);
        }])

    .config(['$routeProvider', 
        function($routeProvider) {
            var authResolver = ['$q', 'authentication', '$rootScope',
                function ($q, authentication, $rootScope) {
                    var userInfo = authentication.getUserInfo();
                    if (userInfo) {
                        return $q.when(userInfo);
                    } else {
                        // User tried to access protected view without being authenticated
                        $rootScope.$broadcast('auth:unauthorized');
                        return $q.reject({ authenticated: false });
                    }
                }];

            $routeProvider
                .when('/', {
                    controller: 'ListCtrl',
                    templateUrl: 'js/app/cellarium/list.html',
                    resolve: {
                        auth: authResolver
                    }
                })
                .when('/edit/:beerId', {
                    controller: 'DetailsCtrl',
                    templateUrl: 'js/app/cellarium/detail.html',
                    resolve: {
                        auth: authResolver
                    }
                })
                .when('/new', {
                    controller: 'DetailsCtrl',
                    templateUrl: 'js/app/cellarium/detail.html',
                    resolve: {
                        auth: authResolver
                    }
                })
                .when('/settings', {
                    controller: 'SettingsCtrl',
                    templateUrl: 'js/app/cellarium/settings.html',
                    resolve: {
                        auth: authResolver
                    }
                })
                .when('/login', {
                    controller: 'LoginCtrl',
                    templateUrl: 'js/app/auth/login.html'
                })
                .when('/logout', {
                    controller: 'LogoutCtrl',
                    template: ''
                })
                .otherwise({
                    redirectTo: '/'
                });
        }]);

