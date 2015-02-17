angular.module('cellarium', ['api', 'auth', 'flash'])

    .controller('CellariumCtrl', ['$scope', '$location', 'authentication', 'beerApi',
        function($scope, $location, authentication, beerApi) {
            $scope.isLoggedIn = function () {
                return !!authentication.getUserInfo();
            };

            $scope.isOnPage = function (page) {
                var currentRoute = $location.path().substring(1);
                return page === currentRoute;
            };

            var user = authentication.getUserInfo();
            if (user) {
                $scope.username = user.username;
            }
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

    .controller('ListCtrl', ['$scope', 'beerApi', 'flash', 'beerDefaults', '$timeout', 
        function($scope, beerApi, flash, beerDefaults, $timeout) {
            $scope.defaults = beerDefaults;
            $scope.beer = {};
            $scope.newBeerRow = {visible: false};
            $scope.beers = [];
            
            var updateBeerList = function() {
                beerApi.getBeers(function(data) {
                    // There must be a better way to do this without changing the reference?
                    $scope.beers.length = 0;
                    for (beer in data) {
                        $scope.beers.push(data[beer]);
                    }
                });
            }
            
            $scope.showNewBeerRow = function() {
                $scope.newBeerRow.visible = !$scope.newBeerRow.true;
                $timeout(function() {
                    angular.element('#newBeerCount').focus();
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
        }]);
