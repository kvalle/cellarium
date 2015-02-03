angular.module('cellariumApp', ['ngRoute', 'cellarium', 'tooltip', 'api', 'auth', 'flash'])

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

