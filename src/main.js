/**
 *
 * Sully - 1.0.0
 * By Alexander P. Harwood
 * Copyright 2018 Alexander P. Harwood - MIT Licence
 *
 */

    if (!window.document) {

        fatalError("Sully requires a window with a document");

    }

    //Global namespace object
    var Sully = {};

    Sully.version = "1.0.0";

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

        if (typeof queryParamsString !== "undefined"){

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

        if(queryParams === ""){

            return undefined;

        }

        return queryParams.substr(1, queryParams.length);

    }

    function getRouteFromUrl() {

        var route;

        if(Sully.html5Routing){

            route = window.location.pathname.replace(Sully.basePath, '');

        } else {

            route = window.location.hash.substr(1, window.location.hash.length);

        }

        if (route === "") {

            route = undefined;

        }

        return route;

    }

    function loadController(params) {

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

    Sully.routeTo = function(route) {

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

        }

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

        if (typeof document.getElementsByTagName('base')[0] === "undefined") {

            fatalError("Missing <base> tag in html.");

        }

        Sully.basePath = document.getElementsByTagName('base')[0].getAttribute("href");

        Sully.interceptAnchorWithClass = params.interceptAnchorWithClass;

        Sully.domContainer = document.getElementById(params.container);

        if(typeof params.exceptionMessage !== "undefined"){

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

            }

            Sully.html5Routing = false;

        }

        document.addEventListener('click', function(event){

            var path = event.path || (event.composedPath && event.composedPath()) || event.deepPath();

            for(var i in path){

                if(path[i].nodeName === "A"){

                    if(typeof Sully.interceptAnchorWithClass === "undefined" || path[i].classList.contains(Sully.interceptAnchorWithClass)){

                        event.preventDefault();

                        var route = path[i].getAttribute('href');

                        Sully.routeTo(route);

                    }

                }

            }

        });

        routeFromUrl();

    };

    export default Sully;
