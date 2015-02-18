angular.module('config', [])

    .service('config', function() {
            return {
                accessTokenTTL: 58 * 1000, // TTL in ms
            };
        });
