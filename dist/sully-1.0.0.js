(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.Sully = factory());
}(this, (function () { 'use strict';

    /**
     *
     * Sully - V1.0
     * By Alexander P. Harwood
     * Copyright 2018 Alexander P. Harwood - MIT Licence
     *
     */

        if (!window.document) {

            fatalError("Sully requires a window with a document");

        }

        //Global namespace object
        var Sully = {};

        Sully.production = false;

        Sully.version = "1.0.0";

        Sully.domContainer = {};

        Sully.controllerProvider = {};

        Sully.middlewareProvider = {};

        Sully.viewProvider = {};

        Sully.routeProvider = {};

        Sully.notFoundRoute = {};

        Sully.exceptionMessage = "Oops! An error occured processing your request.";

        /**
         *  Utility functions (private to this scope)
         */

        function fatalError(message){

                Sully.domContainer.innerHTML = '<h3 id="exceptionMessage">' + Sully.exceptionMessage + '</h3>';

                throw new Error(message);

        }

        function getBasePath(route){

            var path = (Sully.basePath + route).replace('//', '/');

            return path;

        }
        function parseQueryString(){

            var hash = window.location.hash.substr(1);

            var hash = hash.substr(hash.indexOf('?') + 1, hash.length);

            var result = hash.split('&').reduce(function (result, item) {

                var parts = item.split('=');

                result[parts[0]] = parts[1];

                return result;

            }, {});

            return result;

        }
        function getQueryString() {

            var hash = window.location.hash.substr(1);

            if (hash.indexOf('/?') === -1) {

                return undefined;

            } else {

                var hash = hash.substr(hash.indexOf('/?') + 1, hash.length);

                if (hash === "") {

                    return undefined;

                } else {

                    return hash;

                }

            }

        }
        function getRouteFromUrl() {

            if(Sully.routingMethod === "HASH"){

                route = window.location.hash.substr(1, window.location.hash.length);

            } else {

                var route = window.location.pathname.replace(Sully.basePath, '');

            }

            if (route === "") {

                route = undefined;

            }

            return route;

        }
        function loadController(params) {

            // if (typeof Sully.routeProvider[params.route] === "undefined") {
            //
            //     params.controller = Sully.notFoundRoute.controller;
            //
            //     params.method = Sully.notFoundRoute.method;
            //
            //     params.middleware = Sully.notFoundRoute.middleware;
            //
            // } else {
            //
            //     params.middleware = Sully.routeProvider[params.route].middleware;
            //
            // }

            //Check for the resence of any applicable middleware
            if(typeof params.middleware !== "undefined" && params.middleware.constructor === Array){

                for (var i in params.middleware){

                    Sully.middlewareProvider[params.middleware[i]].run(params.requestData);

                }

            }

            //Check for the presence of a constructor
            if (typeof Sully.controllerProvider[params.controller].constructor !== "undefined"){

                Sully.controllerProvider[params.controller].constructor(params.requestData);

            }

            Sully.controllerProvider[params.controller][params.method](params.requestData);

        }
        function parseTemplate(template, viewData) {

            template = template.replace(/(\r\n|\n|\r)/gm, "");

            var valuesArr = template.match(/{{(.*?)}}/g);

            for (var i in valuesArr) {

                valuesArr[i] = valuesArr[i].substr(2, valuesArr[i].length - 4);

                valuesArr[i].trim();

                var pointer = valuesArr[i].split(':', 1)[0];

                switch (pointer) {

                    case "view":

                        var partial = Sully.viewProvider[valuesArr[i].substr(pointer.length + 1, valuesArr[i].length)];

                        template = template.replace("{{" + valuesArr[i] + "}}", parseTemplate(partial, viewData));

                        break;

                }

            }

            return template;

        }
        function routeFromUrl() {

            var isValidRoute = false;

            var routeParams = {};

            routeParams.route = getRouteFromUrl();

            routeParams.requestData = {};

            if (typeof routeParams.route === "undefined" || routeParams.route === "") {

                routeParams.route = "/";

            }

            for (var key in Sully.routeProvider) {

                var route = Sully.routeProvider[key].route;

                var routeDataKeys = route.match(/{(.*?)}/g);

                var routeRegex = new RegExp("^" + route.replace(/{(.*?)}/g, "(.*?)").replace(new RegExp("/", "g"), "\\/?") + "$", "g");

                var routeMatch = routeParams.route.match(routeRegex);

                if (routeMatch != null) {

                    var routeDataValues = routeRegex.exec(routeParams.route);

                    routeParams.controller = Sully.routeProvider[key].controller;

                    routeParams.method = Sully.routeProvider[key].method;

                    routeParams.middleware = Sully.routeProvider[key].middleware;

                    routeParams.route = key;

                    isValidRoute = true;

                }

                if (isValidRoute) {

                    break;

                }

            }

            if (isValidRoute) {

                var routeDataIndex = 1;

                for (var key in routeDataKeys) {

                    var thisDataKey = routeDataKeys[key].substr(1, routeDataKeys[key].length - 2);

                    routeParams.requestData[thisDataKey] = routeDataValues[routeDataIndex];

                    routeDataIndex++;

                }

            } else {
                //not a valid route, set 404 controllerProvider
                routeParams.controller = Sully.notFoundRoute.controller;

                routeParams.method = Sully.notFoundRoute.method;

                routeParams.middleware = Sully.notFoundRoute.middleware;

            }

            if (typeof getQueryString() !== "undefined") {

                routeParams.requestData.queryData = parseQueryString();

            }

            loadController(routeParams);

        }

        /**
         * API function (globally accessible under Sully)
         */

        Sully.navigate = function(params) {

            var route = params.route + (typeof params.queryData !== "undefined" ? "/?" + params.queryData : '');

            window.history.pushState({}, null, getBasePath(params.route));

            routeFromUrl();

        };

        Sully.registerNotFound = function(controller, method){

            Sully.notFoundRoute.controller = controller;

            Sully.notFoundRoute.method = method;

        };

        Sully.registerView = function(name, template){

            Sully.viewProvider[name] = template;

        };

        Sully.registerRoute = function(params){

            Sully.routeProvider[params.name] = {

                route: params.route,

                controller: params.controller,

                method: params.method,

                middleware: params.middleware

            };

        };

        Sully.registerController = function(name, controller){

            Sully.controllerProvider[name] = controller;

        };

        Sully.registerMiddleware = function(name, middleware){

            Sully.middlewareProvider[name] = middleware;

        };

        Sully.getViewTemplate = function(name){

            return Sully.viewProvider[name];

        };

        Sully.renderView = function (params) {

            if (typeof params.template === "undefined"){

                fatalError("ERROR: view not found: " + params.view);

            }

            var parsedTemplate = parseTemplate(params.template, typeof params.data === "undefined" ? {} : params.data);

            Sully.domContainer.innerHTML = parsedTemplate;

            params.viewDidLoad();

            if(typeof params.scrollToTop === "undefined" || params.scrollToTop){

                document.body.scrollTop = document.documentElement.scrollTop = 0;

            }

        };

        Sully.init = function (params) {

            if(!Sully.production){

                console.log("Sully.js, development version " + Sully.version + "");

            }

            Sully.basePath = params.basePath;

            Sully.routingMethod = params.routingMethod;

            Sully.interceptAnchorWithClass = params.interceptAnchorWithClass;

            Sully.domContainer = document.getElementById(params.container);

            if(typeof params.exceptionMessage !== "undefined"){

                Sully.exceptionMessage = params.exceptionMessage;

            }

            //For clicking back and forward in the browser
            if (Sully.routingMethod === "HISTORY"){

                //Check the history API is supported
                if(window.history && history.pushState){

                    window.onpopstate = function (event) {

                        routeFromUrl();

                    };

                    //we can use the history api for routing without hashtags or hashbangs
                    window.history.replaceState({}, null, window.location.path);

                } else{

                    fatalError('Browser does not support routing method.');

                }

            } else {

                window.onhashchange = function(){

                    routeFromUrl();

                };

            }

            document.addEventListener('click', function(event){

                var path = event.path || (event.composedPath && event.composedPath()) || event.deepPath();

                for(var i in path){

                    if(path[i].nodeName === "A"){

                        if(typeof Sully.interceptAnchorWithClass === "undefined" || path[i].classList.contains(Sully.interceptAnchorWithClass)){

                            event.preventDefault();

                            var route = path[i].getAttribute('href');

                            window.history.pushState({}, null, getBasePath(route));

                            routeFromUrl();

                            return true;

                        }

                    }

                }

            });

            routeFromUrl();

        };

    return Sully;

})));
