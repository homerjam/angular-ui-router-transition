/*

    Name: angular-ui-router-transition
    Description: Angular UI-Router animation directive allowing configuration of state transitions using [GSAP](http://www.greensock.com/gsap-js/) or [ramjet](http://www.rich-harris.co.uk/ramjet/)
    Author: jameshomer85@gmail.com
    Licence: MIT
    Usage: http://github.com/homerjam/angular-ui-router-transition

*/
(function() {
    'use strict';

    angular.module('hj.uiRouterTransition', ['ui.router', 'ngAnimate']);

    angular.module('hj.uiRouterTransition').constant('TweenMax', TweenMax);
    angular.module('hj.uiRouterTransition').constant('ramjet', ramjet);

    angular.module('hj.uiRouterTransition').provider('uiRouterTransition', function() {
        var self = this;

        self.options = {};

        self.options.initialTransitionEnabled = false;

        self.ramjet = {
            duration: 1000,
            easing: ramjet.easeInOut
        };

        self.transitions = {};

        self.transitions.above = {
            duration: 1,
            ease: 'Quart.easeInOut',
            css: {
                y: '-100%'
            }
        };

        self.transitions.below = {
            duration: 1,
            ease: 'Quart.easeInOut',
            css: {
                y: '100%'
            }
        };

        self.transitions.left = {
            duration: 1,
            ease: 'Quint.easeInOut',
            css: {
                x: '-100%'
            }
        };

        self.transitions.right = {
            duration: 1,
            ease: 'Quint.easeInOut',
            css: {
                x: '100%'
            }
        };

        self.transitions.fade = {
            duration: 0.5,
            css: {
                opacity: 0
            }
        };

        self.transitions.fadeDelayed = {
            duration: 0.5,
            delay: 0.5,
            css: {
                opacity: 0
            }
        };

        self.transitions.none = {
            duration: 0,
            css: {}
        };

        self.defaults = {
            enter: 'none',
            leave: 'none'
        };

        self.transition = function(transitionName, transitionOptions) {
            self.transitions[transitionName] = transitionOptions;
        };

        self.$get = ['$rootScope', '$state', '$document', '$injector', '$timeout', '$q', '$log', 'TweenMax',
            function($rootScope, $state, $document, $injector, $timeout, $q, $log, TweenMax) {
                var viewElements = {};

                $state.history = [];
                $state.previous = {};

                $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
                    $state.previous = fromState;
                    $state.previousParams = fromParams;

                    $state.history.push({
                        name: fromState.name,
                        params: fromParams
                    });
                });

                var getOptions = function(state, view, enterLeave, inOut) {
                    var options = {
                        transition: self.defaults[inOut === 'in' ? 'enter' : 'leave'],
                        priority: 0
                    };

                    if (state.data) {
                        if (state.data['uiRouterTransition.' + view] && state.data['uiRouterTransition.' + view][enterLeave]) {
                            if (state.data['uiRouterTransition.' + view][enterLeave][inOut]) {
                                switch (Object.prototype.toString.call(state.data['uiRouterTransition.' + view][enterLeave][inOut])) {
                                    case '[object Array]':
                                    case '[object Function]':
                                        options = $injector.invoke(state.data['uiRouterTransition.' + view][enterLeave][inOut]);
                                        break;
                                    case '[object Object]':
                                        options = angular.extend(options, state.data['uiRouterTransition.' + view][enterLeave][inOut]);
                                        Object.keys(options).forEach(function(key) {
                                            switch (Object.prototype.toString.call(options[key])) {
                                                case '[object Array]':
                                                case '[object Function]':
                                                    options[key] = $injector.invoke(options[key]);
                                                    break;
                                            }
                                        });
                                        break;
                                    case '[object String]':
                                        options.transition = state.data['uiRouterTransition.' + view][enterLeave][inOut];
                                        break;
                                }
                            }
                        }
                    }

                    return options;
                };

                var getTransition = function(transition) {
                    var result;
                    switch (Object.prototype.toString.call(transition)) {
                        case '[object Object]':
                            result = transition;
                            break;
                        case '[object String]':
                            result = self.transitions[transition];
                            break;
                    }
                    return result;
                };

                var enter = function(element) {
                    var deferred = $q.defer();

                    element.addClass('ui-router-transition-in-setup');

                    var view = element.attr('ui-view'),

                        current = $state.current,
                        previous = $state.previous,

                        currentOptions = getOptions(current, view, 'enter', 'in'),
                        previousOptions = getOptions(previous, view, 'leave', 'in'),

                        from;

                    viewElements[view] = element;

                    if (previousOptions.priority > currentOptions.priority) {
                        from = getTransition(previousOptions.transition);

                        if (!from) {
                            $log.error("uiRouterTransition: Invalid transition '" + previousOptions.transition + "'");
                        }

                    } else {
                        from = getTransition(currentOptions.transition);

                        if (!from) {
                            $log.error("uiRouterTransition: Invalid transition '" + currentOptions.transition + "'");
                        }
                    }

                    var duration = $state.previous.name === '' && !self.options.initialTransitionEnabled ? 0 : from.duration,
                        args = angular.copy(from);

                    $timeout(function() {
                        element.removeClass('ui-router-transition-in-setup');
                        element.addClass('ui-router-transition-in');

                        args.onComplete = function() {
                            element.addClass('ui-router-transition-in-end');

                            deferred.resolve();
                        };

                        TweenMax.from(element, duration, args);
                    });

                    return deferred.promise;
                };

                var leave = function(element) {
                    var deferred = $q.defer();

                    element.removeClass('ui-router-transition-in ui-router-transition-in-end');
                    element.addClass('ui-router-transition-out-setup');

                    var view = element.attr('ui-view'),

                        current = $state.current,
                        previous = $state.previous,

                        previousOptions = getOptions(previous, view, 'leave', 'out'),
                        currentOptions = getOptions(current, view, 'enter', 'out'),

                        to;

                    if (currentOptions.priority > previousOptions.priority) {
                        to = getTransition(currentOptions.transition);

                        if (!to) {
                            $log.error("uiRouterTransition: Invalid transition '" + currentOptions.transition + "'");
                        }

                    } else {
                        to = getTransition(previousOptions.transition);

                        if (!to) {
                            $log.error("uiRouterTransition: Invalid transition '" + previousOptions.transition + "'");
                        }
                    }

                    var duration = to.duration,
                        args = angular.copy(to);

                    element.removeClass('ui-router-transition-out-setup');
                    element.addClass('ui-router-transition-out');

                    var srcElement = [],
                        dstElement = [];

                    ['.ui-router-transition-src', '[ui-router-transition-src]'].forEach(function(selector) {
                        angular.forEach(element[0].querySelectorAll(selector), function(el) {
                            srcElement.push(el);
                        });
                    });

                    ['.ui-router-transition-dst', '[ui-router-transition-dst]'].forEach(function(selector) {
                        angular.forEach(viewElements[view][0].querySelectorAll(selector), function(el) {
                            dstElement.push(el);
                        });
                    });

                    if (srcElement.length && dstElement.length) {
                        var ramjetOptions = self.ramjet;

                        ramjetOptions.useTimer = true; // necessary to make sure tidying up happens (animationend event doesn't fire if transition canceled)

                        ramjetOptions.done = function() {
                            ramjet.show(srcElement[0], dstElement[0]);
                        };

                        ramjet.transform(srcElement[0], dstElement[0], ramjetOptions);

                        ramjet.hide(srcElement[0], dstElement[0]);
                    }

                    args.onComplete = function() {
                        element.remove();

                        deferred.resolve();
                    };

                    TweenMax.to(element, duration, args);

                    return deferred.promise;
                };


                return {
                    enter: enter,
                    leave: leave,
                    transitions: self.transitions,
                    defaults: self.defaults
                };
            }
        ];
    });

    angular.module('hj.uiRouterTransition').directive('uiRouterTransition', ['$state',
        function($state) {
            return {
                priority: 0,
                restrict: 'C',
                link: function($scope, $element, $attr) {
                    $attr.$set('data-state', $state.current.name);
                }
            };
        }
    ]);

    angular.module('hj.uiRouterTransition').animation('.ui-router-transition', ['$rootScope', 'uiRouterTransition',
        function($rootScope, uiRouterTransition) {
            return {
                enter: function(element, done) {
                    $rootScope.$broadcast('uiRouterTransition:enterStart', element);

                    uiRouterTransition.enter(element).then(function() {
                        $rootScope.$broadcast('uiRouterTransition:enterSuccess', element);

                        done();
                    });

                    return function(cancelled) {
                        if (cancelled) {
                            element.remove();
                        }
                    };
                },
                leave: function(element, done) {
                    $rootScope.$broadcast('uiRouterTransition:leaveStart', element);

                    uiRouterTransition.leave(element).then(function() {
                        $rootScope.$broadcast('uiRouterTransition:leaveSuccess', element);

                        done();
                    });
                }
            };
        }
    ]);

})();
