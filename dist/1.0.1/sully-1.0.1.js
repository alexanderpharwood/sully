(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.Sully = factory());
}(this, (function () { 'use strict';

    /**
     *
     * Sully.js - 1.0.1
     * By Alexander P. Harwood
     * Github core: https://github.com/alexanderpharwood/sully
     * Github cli: https://github.com/alexanderpharwood/sully-cli
     * Copyright 2018 Alexander P. Harwood - MIT Licence
     *
     */

    var Sully = {};

    Sully.domContainer = {};

    Sully.controllerProvider = {};

    Sully.middlewareProvider = {};

    Sully.viewProvider = {};

    Sully.routeProvider = {};

    Sully.notFoundRoute = {};

    Sully.html5Routing = false;

    Sully.exceptionMessage = "Oops! An error occured processing your request.";

    /**
     *  Utility functions (private to this scope)
     */

    function isObject(value) {

        return value && typeof value === 'object' && value.constructor === Object;

    }

    function isArray(value) {

        return value && typeof value === 'object' && value.constructor === Array;

    }

    function isFunction (value) {

        return typeof value === 'function';

    }

    function isUndefined (value) {

        return typeof value === "undefined";

    }

    function fatalError(message){

            Sully.domContainer.innerHTML = '<h3 id="exceptionMessage">' + Sully.exceptionMessage + '</h3>';

            throw new Error(message);

    }

    function getBasePath(route){

        var path = (Sully.basePath + route).replace('//', '/');

        return path;

    }

    function parseQueryString(){

        var queryParamsString = getQueryString();

        if (!isUndefined(queryParamsString)){

            var result = queryParamsString.split('&').reduce(function (result, item) {

                var parts = item.split('=');

                result[parts[0]] = parts[1];

                return result;

            }, {});

            return result;

        }

    }

    function getQueryString() {

        var queryParams = window.location.search;

        if (queryParams === ""){

            return undefined;

        }

        return queryParams.substr(1, queryParams.length);

    }

    function getHtml5RouteFromUrl(){

        return window.location.pathname.replace(Sully.basePath, '');

    }

    function getHashRouteFromUrl(){

        return window.location.hash.substr(1, window.location.hash.length);

    }

    function getRouteFromUrl() {

        var route;

        if (Sully.html5Routing){

            return getHtml5RouteFromUrl();

        } else {

            return getHashRouteFromUrl();

        }

        if (route === "") {

            route = "/";

        }

        return route;

    }

    function loadController(params) {

        //Check for the resence of any applicable middleware
        if (!isUndefined(params.middleware) && isArray(params.middleware.constructor)){

            for (var i in params.middleware){

                Sully.middlewareProvider[params.middleware[i]].run(params.request);

            }

        }

        //Check for the presence of a constructor
        if (!isUndefined(Sully.controllerProvider[params.controller].constructor)){

            Sully.controllerProvider[params.controller].constructor(params.request);

        }

        Sully.controllerProvider[params.controller][params.method](params.request);

    }

    function routeFromUrl() {

        var isValidRoute = false;

        var routeParams = {};

        routeParams.route = getRouteFromUrl();

        if (!Sully.html5Routing){

            if (getHashRouteFromUrl() === "" && getHtml5RouteFromUrl() !== ""){

                var hashRoute = "#/" + getHtml5RouteFromUrl();

                return window.location.replace(window.location.origin + getBasePath(hashRoute));

            }

        } else {

            if (getHashRouteFromUrl() !== "" && getHtml5RouteFromUrl() === ""){

                var html5Route = "/" + getHashRouteFromUrl();

                return window.location.replace(window.location.origin + getBasePath(html5Route));

            }

        }

        routeParams.request = {};

        routeParams.request.url = window.location.href;

        if (isUndefined(routeParams.route) || routeParams.route === "") {

            routeParams.route = "/";

        }

        for (var key in Sully.routeProvider) {

            var route = Sully.routeProvider[key].route;

            var routeDataKeys = route.match(/{(.*?)}/g);

            var routeRegex = new RegExp("^" + route.replace(/{(.*?)}/g, "(.*?)").replace(new RegExp("/", "g"), "\\/?") + "(\/*)?$", "g");

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

                routeParams.request[thisDataKey] = routeDataValues[routeDataIndex];

                routeDataIndex++;

            }

        } else {
            //not a valid route, set 404 controllerProvider
            routeParams.controller = Sully.notFoundRoute.controller;

            routeParams.method = Sully.notFoundRoute.method;

            routeParams.middleware = Sully.notFoundRoute.middleware;

        }

        if (!isUndefined(getQueryString())) {

            routeParams.request.queryData = parseQueryString();

        }

        loadController(routeParams);

    }

    /**
     * API function (globally accessible under Sully)
     */

    Sully.routeTo = function(route) {

        //Do not route if we are already on this page.
        if (window.location.origin + getBasePath(route) === window.location.href){

            return false;

        }

        if (Sully.html5Routing){

            window.history.pushState({}, null, getBasePath(route));

        } else {

            window.location.hash = route;

        }

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

    Sully.getView = function(name){

        return Sully.viewProvider[name];

    };

    //Alias for Sully.buildView to be called directs on an instance of String.
    String.prototype.buildView = function(data){

        return Sully.buildView(this, data);

    };

    Sully.buildView = function(template, data){

        if (isUndefined(template)){

            fatalError("Template is undefined");

        }

        if (!isObject(data)){

            data = {};

        }

        template = template.replace(/(\r\n|\n|\r)/gm, "");

        var valuesArr = template.match(/{{(.*?)}}/g);

        for (var i in valuesArr) {

            valuesArr[i] = valuesArr[i].substr(2, valuesArr[i].length - 4);

            valuesArr[i].trim();

            var pointer = valuesArr[i].split(':', 1)[0];

            switch (pointer) {

                case "view":

                    var partial = Sully.viewProvider[valuesArr[i].substr(pointer.length + 1, valuesArr[i].length)];

                    template = template.replace("{{" + valuesArr[i] + "}}", Sully.buildView(partial, data));

                    break;

                default:

                    template = template.replace("{{" + valuesArr[i] + "}}", !isUndefined(data[valuesArr[i]]) ? data[valuesArr[i]] : "");

                break;

            }

        }

        return template;

    };

    Sully.renderView = function (template, viewDidLoad, scrollToTop) {

        if (isUndefined(template)){

            fatalError("Template is undefined");

        }

        Sully.domContainer.innerHTML = template;

        if (scrollToTop){

            document.body.scrollTop = document.documentElement.scrollTop = 0;

        }

        if (isFunction(viewDidLoad)){

            viewDidLoad();

        }

    };

    //This is an alias for: getView, buildView, and renderView
    Sully.serveView = function(viewName, data, viewDidLoad, scrollToTop){

        var template = Sully.getView(viewName);

        if (isUndefined(template)){

            fatalError("View " + "'" + viewName + "' not found");

        }

        template = Sully.buildView(template, data);

        Sully.renderView(template, viewDidLoad, scrollToTop);

    };

    Sully.init = function (params) {

        if (!window.document) {

            fatalError("Sully requires a window with a document");

        }

        if (isUndefined(document.getElementsByTagName('base')[0])) {

            fatalError("Missing <base> tag in html.");

        }

        Sully.basePath = document.getElementsByTagName('base')[0].getAttribute("href");

        Sully.domContainer = document.getElementById(params.container);

        if (!isUndefined(params.exceptionMessage)){

            Sully.exceptionMessage = params.exceptionMessage;

        }

        //Check the history API is supported
        if (window.history && history.pushState){

            //listen for state changes
            window.onpopstate = function (event) {

                routeFromUrl();

            };

            //Set the current state
            window.history.replaceState({}, null, window.location.path);

            Sully.html5Routing = true;

        } else {

            //listen for state changes
            window.onhashchange = function(){

                routeFromUrl();

            };

            Sully.html5Routing = false;

        }

        document.addEventListener('click', function(event){

            var path = event.path || (event.composedPath && event.composedPath()) || event.deepPath();

            for (var i in path){

                if (path[i].nodeName === "A"){

                    if (!path[i].classList.contains("no-route-catch")){

                        event.preventDefault();

                        var route = path[i].getAttribute('href');

                        Sully.routeTo(route);

                    }

                }

            }

        });

        routeFromUrl();

    };

    return Sully;

})));
