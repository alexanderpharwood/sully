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

export {
    fatalError,
    getBasePath,
    parseQueryString,
    getQueryString,
    getRouteFromUrl,
    loadController,
    routeFromUrl
};
