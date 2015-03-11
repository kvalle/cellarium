angular.module('cellarium', ['api', 'auth', 'flash'])

    .controller('CellariumCtrl', ['$scope', '$location', 'authentication', 'beerApi', '$rootScope',
        function($scope, $location, authentication, beerApi, $rootScope) {
            $scope.user = {};

            $scope.isLoggedIn = function () {
                return !!authentication.getUserInfo();
            };

            $scope.isOnPage = function (page) {
                var currentRoute = $location.path().substring(1);
                return page === currentRoute;
            };

            $rootScope.$on("auth:login", function (event, data) {
                $scope.user.username = data.userInfo.username;
            });


            function init() {
                // In case user is already logged in when page refreshes
                var user = authentication.getUserInfo();
                if (user) {
                    $scope.user.username = user.username;
                }
            }
            init();
        }])

    .controller('SettingsCtrl', ['$scope', 'authentication', 'beerApi',
        function($scope, authentication, beerApi) {
            var username = authentication.getUserInfo().username;
            $scope.exportName = "beers-" + username + ".json";
            $scope.exportUrl = "";

            beerApi.getBeers(function(data) {
                var beerList = _.values(data);
                var content = JSON.stringify(beerList, null, '\t');
                var blob = new Blob([ content ], { type : 'text/plain' });
                $scope.exportUrl = (window.URL || window.webkitURL).createObjectURL(blob);
            });
        }])

    .directive("sortHeader", 
        function() {
            return {
                restrict: "A",
                scope: true,
                transclude: true,
                templateUrl: "js/app/cellarium/sortHeader.html",
                link: function(scope, element, attributes) {
                    scope.sortField = attributes["sortHeader"];
                }
            };
        })

    .controller('ListCtrl', ['$scope', 'beerApi', 'flash', 'beerDefaults', '$timeout', 
        function($scope, beerApi, flash, beerDefaults, $timeout) {
            $scope.defaults = beerDefaults;
            $scope.beer = {};
            $scope.newBeerRow = {visible: false};
            $scope.beerList = {
                beers: [],
                ordering: 'name'
            }

            var updateBeerList = function() {
                beerApi.getBeers(function(data) {
                    $scope.beerList.beers = _.values(data);
                });
            };

            $scope.sortBy = function(field) {
                if ($scope.beerList.ordering === field) {
                    $scope.beerList.ordering = "-" + field;
                } else {
                    $scope.beerList.ordering = field;
                }
            };
            
            $scope.showNewBeerRow = function() {
                $scope.newBeerRow.visible = !$scope.newBeerRow.true;
                $timeout(function() {
                    angular.element('#newBeerCount').focus();
                });
            };

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
                    $scope.newBeerRow.visible = true;
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

    .directive('fieldMustEqual', 
        function() {
            return {
                require: 'ngModel',
                link: function (scope, elem, attrs, model) {
                    if (!attrs.fieldMustEqual) {
                        console.error('fieldMustEqual expects a model as an argument!');
                        return;
                    }
                    scope.$watch(attrs.fieldMustEqual, function (value) {
                        // Only compare values if the second ctrl has a value.
                        if (model.$viewValue !== undefined && model.$viewValue !== '') {
                            model.$setValidity('fieldMustEqual', value === model.$viewValue);
                        }
                    });
                    model.$parsers.push(function (value) {
                        // Mute the nxEqual error if the second ctrl is empty.
                        if (value === undefined || value === '') {
                            model.$setValidity('fieldMustEqual', true);
                            return value;
                        }
                        var isValid = value === scope.$eval(attrs.fieldMustEqual);
                        model.$setValidity('fieldMustEqual', isValid);
                        return isValid ? value : undefined;
                    });
                }
            };
    });
