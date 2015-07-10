/*

    Name: angular-ui-router-transition
    Description: Angular UI-Router animation directive allowing configuration of state transitions using [GSAP](http://www.greensock.com/gsap-js/) or [ramjet](http://www.rich-harris.co.uk/ramjet/)
    Author: jameshomer85@gmail.com
    Licence: MIT
    Usage: http://github.com/homerjam/angular-ui-router-transition

*/
(function() {
    'use strict';

    angular.module('hj.uiRouterTransition', ['ui.router', 'ngAnimate'])

    .constant('TweenMax', TweenMax)

    .provider('uiRouterTransition', function() {
        var self = this;

        self.constants = {};

        self.constants.ENGINE_GSAP = 'gsap';
        self.constants.ENGINE_RAMJET = 'ramjet';

        self._viewElements = {};

        self.options = {};

        self.options.initialTransitionEnabled = false;

        self.transitions = {};

        self.transitions.above = {
            engine: self.constants.ENGINE_GSAP,
            duration: 1,
            ease: 'Quart.easeInOut',
            css: {
                y: '-100%'
            }
        };

        self.transitions.below = {
            engine: self.constants.ENGINE_GSAP,
            duration: 1,
            ease: 'Quart.easeInOut',
            css: {
                y: '100%'
            }
        };

        self.transitions.left = {
            engine: self.constants.ENGINE_GSAP,
            duration: 1,
            ease: 'Quint.easeInOut',
            css: {
                x: '-100%'
            }
        };

        self.transitions.right = {
            engine: self.constants.ENGINE_GSAP,
            duration: 1,
            ease: 'Quint.easeInOut',
            css: {
                x: '100%'
            }
        };

        self.transitions.fade = {
            engine: self.constants.ENGINE_GSAP,
            duration: 0.5,
            css: {
                opacity: 0
            }
        };

        self.transitions.fadeDelayed = {
            engine: self.constants.ENGINE_GSAP,
            duration: 0.5,
            delay: 0.5,
            css: {
                opacity: 0
            }
        };

        self.transitions.none = {
            engine: self.constants.ENGINE_GSAP,
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

                var getOpts = function(state, view, enterLeave, inOut) {
                    var opts = {
                        transition: self.defaults[inOut === 'in' ? 'enter' : 'leave'],
                        priority: 0
                    };

                    if (state.data) {
                        if (state.data['uiRouterTransition.' + view] && state.data['uiRouterTransition.' + view][enterLeave]) {
                            if (state.data['uiRouterTransition.' + view][enterLeave][inOut]) {
                                switch (Object.prototype.toString.call(state.data['uiRouterTransition.' + view][enterLeave][inOut])) {
                                    case '[object Array]':
                                    case '[object Function]':
                                        opts = $injector.invoke(state.data['uiRouterTransition.' + view][enterLeave][inOut]);
                                        break;
                                    case '[object Object]':
                                        opts = angular.extend(opts, state.data['uiRouterTransition.' + view][enterLeave][inOut]);
                                        Object.keys(opts).forEach(function(key) {
                                            switch (Object.prototype.toString.call(opts[key])) {
                                                case '[object Array]':
                                                case '[object Function]':
                                                    opts[key] = $injector.invoke(opts[key]);
                                                    break;
                                            }
                                        });
                                        break;
                                    case '[object String]':
                                        opts.transition = state.data['uiRouterTransition.' + view][enterLeave][inOut];
                                        break;
                                }
                            }
                        }
                    }

                    return opts;
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

                        currentOpts = getOpts(current, view, 'enter', 'in'),
                        previousOpts = getOpts(previous, view, 'leave', 'in'),

                        from;

                    if (!self._viewElements[view]) {
                        self._viewElements[view] = {};
                    }

                    self._viewElements[view].enter = element;

                    if (previousOpts.priority > currentOpts.priority) {
                        from = getTransition(previousOpts.transition);

                        if (!from) {
                            $log.error("uiRouterTransition: Invalid transition '" + previousOpts.transition + "'");
                        }

                    } else {
                        from = getTransition(currentOpts.transition);

                        if (!from) {
                            $log.error("uiRouterTransition: Invalid transition '" + currentOpts.transition + "'");
                        }
                    }

                    var duration = $state.previous.name === '' && !self.options.initialTransitionEnabled ? 0 : from.duration,
                        args = angular.copy(from);

                    $timeout(function() {
                        element.removeClass('ui-router-transition-in-setup');
                        element.addClass('ui-router-transition-in');

                        if (from.engine === self.constants.ENGINE_GSAP) {
                            args.onComplete = function() {
                                element.addClass('ui-router-transition-in-end');

                                deferred.resolve();
                            };

                            TweenMax.from(element, duration, args);
                        }

                        if (from.engine === self.constants.ENGINE_RAMJET) {
                            $timeout(function() {
                                element.addClass('ui-router-transition-in-end');

                                deferred.resolve();
                            }, duration * 1000);
                        }

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

                        previousOpts = getOpts(previous, view, 'leave', 'out'),
                        currentOpts = getOpts(current, view, 'enter', 'out'),

                        to;

                    if (!self._viewElements[view]) {
                        self._viewElements[view] = {};
                    }

                    self._viewElements[view].leave = element;

                    if (currentOpts.priority > previousOpts.priority) {
                        to = getTransition(currentOpts.transition);

                        if (!to) {
                            $log.error("uiRouterTransition: Invalid transition '" + currentOpts.transition + "'");
                        }

                    } else {
                        to = getTransition(previousOpts.transition);

                        if (!to) {
                            $log.error("uiRouterTransition: Invalid transition '" + previousOpts.transition + "'");
                        }
                    }

                    var duration = to.duration,
                        args = angular.copy(to);

                    $timeout(function() {
                        element.removeClass('ui-router-transition-out-setup');
                        element.addClass('ui-router-transition-out');

                        if (to.engine === self.constants.ENGINE_GSAP) {
                            args.onComplete = function() {
                                element.remove();

                                deferred.resolve();
                            };

                            TweenMax.to(element, duration, args);
                        }

                        if (to.engine === self.constants.ENGINE_RAMJET) {
                            args.duration = duration * 1000;

                            if (args.ease) {
                                args.easing = args.ease;
                            }

                            args.useTimer = true; // necessary to make sure tidying up happens

                            var leaveElement = self._viewElements[view].leave[0],
                                enterElement = self._viewElements[view].enter[0];

                            args.done = function() {
                                element.remove();

                                deferred.resolve();
                            };

                            var srcElement = [];

                            ['.ui-router-transition-src', '[ui-router-transition-src]'].forEach(function(selector) {
                                angular.forEach(leaveElement.querySelectorAll(selector), function(el) {
                                    srcElement.push(el);
                                });
                            });

                            var dstElement = [];

                            ['.ui-router-transition-dst', '[ui-router-transition-dst]'].forEach(function(selector) {
                                angular.forEach(enterElement.querySelectorAll(selector), function(el) {
                                    dstElement.push(el);
                                });
                            });

                            leaveElement = srcElement.length ? srcElement[0] : leaveElement;
                            enterElement = dstElement.length ? dstElement[0] : enterElement;

                            ramjet.transform(leaveElement, enterElement, args);
                        }

                    });

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
    })

    .directive('uiRouterTransition', ['$state',
        function($state) {
            return {
                priority: 0,
                restrict: 'C',
                link: function($scope, $element, $attr) {
                    $attr.$set('data-state', $state.current.name);
                }
            };
        }
    ])

    .animation('.ui-router-transition', ['$rootScope', 'uiRouterTransition',
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
