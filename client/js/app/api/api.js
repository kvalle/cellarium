angular.module('api', ['flash'])

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
                        flash.error("Unable to retrieve list of beers");
                        console.error(status, data);
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
        }]);