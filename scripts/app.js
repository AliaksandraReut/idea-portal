'use strict';
angular.module('tp.services', []);
angular.module('tp.directives', []);

angular.module('tp', ['ngCookies', 'ngResource', 'ngRoute','tp.services', 'tp.directives'])
    .config(function($routeProvider, $locationProvider, $provide) {
        $provide.constant('appConfig', {
            userCookie: 'user_settings',
            responseStatus: {
                SUCCESS: 'success',
                ERROR: 'error'
            },
            BASE_PATH: '/',
            EMAIL_SUFFIX: '@epam.com'
        });

        $routeProvider
            .when('/show/:ideaId',{
                controller: 'commentsController',
                templateUrl:'/idea/views/ideaPage.html'
            })
            .when('/',{
                controller:'mainController'
            })
            .otherwise({redirectTo: '/'});
        })
    .run(function($rootScope, $q, authService) {
        return $q.all([
            authService.checkAuthN()
        ]);
    })
    .controller('AppCtrl', function($rootScope, $scope, $q, authService) {
        var global = {
            isAuthN: authService.isAuthN(),
            currentUser: authService.getUserData(),
            errorStack: []
        };


        $rootScope.global = global;
        $scope.auth = {};

        $scope.signin = function() {
            $scope.authInProgress = true;
            $rootScope.errorWithCredentials=null;

            authService.login({
                login: $scope.auth.login,
                password: $scope.auth.password
            })
                .then(function() {

                }, function(error) {
                    $rootScope.global.errorStack.push(error);
                    $rootScope.errorWithCredentials=error.message;
                    console.error(error.errorCode, error.message);
                })
                ['finally'](function() {
                $scope.authInProgress = false;
            });
        };

        $scope.logout = function() {
            authService.logout();
        };
    });