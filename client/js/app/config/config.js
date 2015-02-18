angular.module('config', [])

    .service('config', function() {
            return {
                accessTokenTTL: 15 * 60 * 1000, // TTL in ms
            };
        });
