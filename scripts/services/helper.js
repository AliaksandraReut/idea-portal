'use strict';
angular.module('tp.services')
    .factory('helper', function ($rootScope, appConfig) {
        var monthNames = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ],
            shortMonthNames = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            dayName = [ 'Sun', 'Mon', 'Tue', 'Wen', 'Thu', 'Fri', 'Sat'];

        function Storage() {
            this.storage = window.localStorage;
        }

        Storage.prototype.get = function (key) {
            return JSON.parse(this.storage.getItem(key));
        };

        Storage.prototype.set = function (key, data) {
            try {
                this.storage.setItem(key, typeof data === 'undefined' ? 'null' : JSON.stringify(data));
            }
            catch (e) {
                console.log('invalid json format', e);
            }

            return this;
        };

        Storage.prototype.remove = function (key) {
            this.storage.removeItem(key);
            return this;
        };

        Storage.prototype.update = function (key, newData) {
            var data = ng.extend(this.get(key) || {}, newData);
            this.set(key, data);

            return data;
        };

        return {
            getMonthName: function (index, useShortFormat) {
                return (useShortFormat ? shortMonthNames : monthNames)[index];
            },
            getMonthIndex: function (monthName) {
                return shortMonthNames.indexOf(monthName);
            },
            //if you are using the format(first month has 1 index) set useHumanReadableMonthBase to true
            getDaysInMonth: function (month, year, useHumanReadableMonthBase) {
                return new Date(year, month + useHumanReadableMonthBase ? 0 : 1, 0).getDate();
            },
            getDayName: function (index) {
                return dayName[index];
            },
            getDayIndex: function (day) {
                return dayName.indexOf(day);
            },
            parseUrl: function (url) {
                var parser = document.createElement('a');
                parser.href = url;
                return parser;
            },
            getUser: (function () {
                var _memory = {};

                return function (id, users) {
                    users = users || $rootScope.global.users;

                    var usersNumber = users.length,
                        email,
                        i = 0;

                    if (id) {
                        email = id + (~id.indexOf('@') ? '' : appConfig.EMAIL_SUFFIX);

                        if (_memory[id]) {
                            return _memory[id];
                        }
                        else {
                            for (; i < usersNumber; i++) {
                                var user = users[i];
                                if (user.email === email || user._id === id) {
                                    _memory[id] = user;
                                    return user;
                                }
                            }
                        }
                    }

                    return null;
                };
            })(),
            storage: new Storage()
        };
    });