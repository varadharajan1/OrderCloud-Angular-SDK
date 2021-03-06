var ocSDK = require('ordercloud-javascript-sdk');

angular.module('ordercloud-angular-sdk', [
    'ngCookies'
])
    .factory('OrderCloudSDK', OrderCloudService)
;

function OrderCloudService($cookies, $rootScope, $q) {
    var sdk = {},
        authTokenCookieName, impersonationTokenCookieName, refreshTokenCookieName,
        defaultClient = ocSDK.Sdk.instance,
        oauth2 = defaultClient.authentications['oauth2'];
    
    for(var method in ocSDK) {
        if (ocSDK.hasOwnProperty(method)) {
            if (method === "As") {
                sdk[method] = function(token) {
                    if (token) {
                        _setImpersonationToken(token);
                    }
                    defaultClient.impersonation = true;
                    return sdk;
                }
            }
            else {
                sdk[method] = {};
                for (var apiCall in ocSDK[method]) {
                    if (ocSDK.hasOwnProperty(method)) {
                        sdk[method] = {};
                        for (var apiCall in ocSDK[method]) {
                            if (ocSDK[method].hasOwnProperty(apiCall)) {
                                sdk[method][apiCall] = (function() {
                                    var useMethod = method,
                                        useApiCall = apiCall;
                                    return function() {
                                        var dfd = $q.defer(),
                                        response = ocSDK[useMethod][useApiCall].apply(ocSDK[useMethod], arguments);
                                        response
                                        .then(function(data) {
                                            dfd.resolve(data);
                                        })
                                        .catch(function(ex) {
                                            if (ex.status === 401) $rootScope.$broadcast('OC:InvalidOrExpiredAccessToken', ex);
                                            if (ex.status === 403) $rootScope.$broadcast('OC:AccessForbidden', ex);
                                            dfd.reject(ex);
                                        });
                                        return dfd.promise;
                                    }
                                })();
                            }
                        }
                    }
                }
            }
        }
    }

    var _config = function(cookiePrefix, apiurl, authurl) {
        authTokenCookieName = cookiePrefix + '.token';
        impersonationTokenCookieName = cookiePrefix + '.impersonation.token';
        refreshTokenCookieName = cookiePrefix + '.refresh.token';
        if (apiurl !== null) {
            ocSDK.Sdk.instance.baseApiPath = apiurl;
        }
        if (authurl !== null) {
            ocSDK.Sdk.instance.baseAuthPath = authurl;
        }
        _getToken();
        _getImpersonationToken();
    }

    var _getToken = function() {
        var token = $cookies.get(authTokenCookieName);
        oauth2.accessToken = token;
        return token;
    };

    var _removeToken = function() {
        $cookies.remove(authTokenCookieName);
        oauth2.accessToken = null;
    };

    var _getImpersonationToken = function() {
        var token = $cookies.get(impersonationTokenCookieName);
        oauth2.impersonationToken = token;
        return token;
    };

    var _removeImpersonationToken = function() {
        $cookies.remove(impersonationTokenCookieName);
        oauth2.impersonationToken = null;
    }

    var _getRefreshToken = function() {
        var token = $cookies.get(refreshTokenCookieName);
        return token;
    }

    var _setToken = function(token) {
        oauth2.accessToken = token;
        $cookies.put(authTokenCookieName, token);
    };

    var _setImpersonationToken = function(token) {
        oauth2.impersonationToken = token;
        $cookies.put(impersonationTokenCookieName, token);
    };

    var _setRefreshToken = function(token) {
        $cookies.put(refreshTokenCookieName, token);
    }

    sdk.Config = _config;
    sdk.GetToken = _getToken;
    sdk.RemoveToken = _removeToken;
    sdk.GetImpersonationToken = _getImpersonationToken;
    sdk.RemoveImpersonationToken = _removeImpersonationToken;
    sdk.GetRefreshToken = _getRefreshToken;
    sdk.SetToken = _setToken;
    sdk.SetImpersonationToken = _setImpersonationToken;
    sdk.SetRefreshToken = _setRefreshToken;

    //init authentication for page refresh
    _getToken();
    _getImpersonationToken();

    return sdk;
}