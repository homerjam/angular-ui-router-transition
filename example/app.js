(function() {

    'use strict';

    angular.module('MainCtrl', []).controller('MainCtrl', ['$scope', '$state', '$log',
        function($scope, $state, $log) {
            $scope.$on('uiRouterTransition:leaveStart', function() {
                if ($state.history.length) {
                    $log.log('uiRouterTransition:leaveStart', $state.history[$state.history.length - 1].name);
                }
            });
        }
    ]);

    angular.module('HomeCtrl', []).controller('HomeCtrl', ['$scope', '$log',
        function($scope, $log) {
            $scope.$on('uiRouterTransition:enterSuccess', function() {
                $log.log('uiRouterTransition:enterSuccess', 'home');
            });
        }
    ]);

    angular.module('Page1Ctrl', []).controller('Page1Ctrl', ['$scope', '$log',
        function($scope, $log) {
            $scope.$on('uiRouterTransition:enterSuccess', function() {
                $log.log('uiRouterTransition:enterSuccess', 'page1');
            });
        }
    ]);

    angular.module('Page2Ctrl', []).controller('Page2Ctrl', ['$scope', '$log',
        function($scope, $log) {
            $scope.$on('uiRouterTransition:enterSuccess', function() {
                $log.log('uiRouterTransition:enterSuccess', 'page2');
            });
        }
    ]);

    angular.module('ExampleApp', ['ngAnimate', 'ui.router', 'mobile-angular-ui', 'hj.uiRouterTransition', 'MainCtrl', 'HomeCtrl', 'Page1Ctrl', 'Page2Ctrl'])

    .config(['$stateProvider', '$locationProvider', '$urlRouterProvider', 'uiRouterTransitionProvider',
        function($stateProvider, $locationProvider, $urlRouterProvider, uiRouterTransitionProvider) {

            uiRouterTransitionProvider.defaults = {
                enter: 'slideRight',
                leave: 'slideLeft'
            };

            uiRouterTransitionProvider.transition('slideAbove', {
                engine: uiRouterTransitionProvider.constants.ENGINE_GSAP,
                duration: 1,
                ease: 'Quart.easeInOut',
                css: {
                    y: '-100%'
                }
            });

            uiRouterTransitionProvider.transition('slideBelow', {
                engine: uiRouterTransitionProvider.constants.ENGINE_GSAP,
                duration: 1,
                ease: 'Quart.easeInOut',
                css: {
                    y: '100%'
                }
            });

            uiRouterTransitionProvider.transition('slideLeft', {
                engine: uiRouterTransitionProvider.constants.ENGINE_GSAP,
                duration: 1,
                ease: 'Quint.easeInOut',
                css: {
                    x: '-100%'
                }
            });

            uiRouterTransitionProvider.transition('slideRight', {
                engine: uiRouterTransitionProvider.constants.ENGINE_GSAP,
                duration: 1,
                ease: 'Quint.easeInOut',
                delay: 0.5,
                css: {
                    x: '100%'
                }
            });

            uiRouterTransitionProvider.transition('fadeIn', {
                engine: uiRouterTransitionProvider.constants.ENGINE_GSAP,
                duration: 0.5,
                delay: 0.5,
                css: {
                    opacity: 0,
                }
            });

            uiRouterTransitionProvider.transition('fadeOut', {
                engine: uiRouterTransitionProvider.constants.ENGINE_GSAP,
                duration: 0.5,
                css: {
                    opacity: 0,
                }
            });

            uiRouterTransitionProvider.transition('scaleDown', {
                engine: uiRouterTransitionProvider.constants.ENGINE_GSAP,
                duration: 0.5,
                css: {
                    scale: 0,
                    opacity: 0
                }
            });

            uiRouterTransitionProvider.transition('ramjet', {
                engine: uiRouterTransitionProvider.constants.ENGINE_RAMJET,
                duration: 30,
                // ease: 'Quint.easeInOut'
            });

            // $locationProvider.html5Mode(true);

            $urlRouterProvider.otherwise("/");

            $stateProvider.state('home', {
                url: '/',
                views: {
                    main: {
                        templateUrl: 'example/home.html',
                        controller: 'HomeCtrl'
                    }
                },
                data: {
                    'uiRouterTransition.main': {
                        enter: {
                            'in': {
                                transition: 'ramjet',
                                priority: 99
                            },
                            out: {
                                transition: 'ramjet',
                                priority: 99
                            }
                        }
                    }
                }
            });

            $stateProvider.state('page1', {
                url: '/page1',
                views: {
                    main: {
                        templateUrl: 'example/page1.html',
                        controller: 'Page1Ctrl'
                    }
                },
                data: {
                    'uiRouterTransition.main': {
                        leave: {
                            out: {
                                transition: 'scaleDown',
                                priority: 2
                            }
                        }
                    }
                }
            });

            $stateProvider.state('page2', {
                url: '/page2',
                views: {
                    main: {
                        templateUrl: 'example/page2.html',
                        controller: 'Page2Ctrl'
                    }
                },
                data: {
                    'uiRouterTransition.main': {
                        enter: {
                            'in': {
                                transition: function() {
                                    var transitions = Object.keys(uiRouterTransitionProvider.transitions);
                                    return transitions[transitions.length * Math.random() << 0];
                                },
                                priority: 2
                            },
                            out: {
                                transition: {
                                    duration: 1,
                                    ease: 'Quart.easeInOut',
                                    css: {
                                        y: '100%'
                                    }
                                },
                                priority: 2
                            }
                        },
                        leave: {
                            out: {
                                transition: 'fadeOut',
                                priority: 1
                            },
                            'in': {
                                transition: 'fadeIn',
                                priority: 1
                            }
                        }
                    }
                }
            });

        }
    ]);

    angular.module("ExampleApp").run(["$templateCache", function($templateCache) {
        $templateCache.put("example/home.html", "<div class=\"wrapper\" style=\"background: #81B270\"><div class=\"box left\" ui-router-transition-dst><h1>Home</h1></div></div>");
        $templateCache.put("example/page1.html", "<div class=\"wrapper\" style=\"background: #FF7F40\"><div class=\"box right ui-router-transition-src\"><h1>Page 1</h1></div></div>");
        $templateCache.put("example/page2.html", "<div class=\"wrapper\" style=\"background: #7F80B2\"><div class=\"box\"><h1>Page 2</h1></div></div>");
    }]);

})();
