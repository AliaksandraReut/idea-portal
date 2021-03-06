'use strict';
angular.module('tp.services')
    .factory('authService', function($http, $q, $cookieStore, $rootScope, helper, appConfig) {
        var USER_KEY = 'user',
            _user = helper.storage.get(USER_KEY);

        function clearSession(){
            $cookieStore.remove(appConfig.userCookie);
            $rootScope.global.isAuthN = false;
            $rootScope.global.currentUser = null;
            _user = null;
            helper.storage.remove(USER_KEY);
        }

        return {
            checkAuthN: function() {
                return $http.get('/idea/auth').error(function(data, status){
                    if (status === 401 && data.code === 'NOPERMISSION'){
                        clearSession();
                    }
                });
            },
            isAuthN: function() {
                var userSettings = $cookieStore.get(appConfig.userCookie);
                return userSettings && userSettings.authN;
            },
            login: function(data) {
                return $http({
                    method: 'POST',
                    url: '/idea/auth',
                    data: data
                }).then(function(response) {
                        var data = response.data;
                        if (data.status === appConfig.responseStatus.SUCCESS) {
                            $cookieStore.put(appConfig.userCookie, {
                                authN: true
                            });
                            _user = data.user;
                            $rootScope.global.isAuthN = true;
                            $rootScope.global.currentUser = _user;
                            helper.storage.set(USER_KEY, _user);
                        }
                        else {
                            return $q.reject(data);
                        }
                    });
            },
            getUserData: function() {
                return _user;
            },
            logout: function() {
                clearSession();

                $http({
                    method: 'POST',
                    url: '/idea/logout'
                });
            }
        };
    });