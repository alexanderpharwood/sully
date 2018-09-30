/**
 * API function (globally accessible under Sully)
 */

import namespace from './definitions';

namespace.routeTo = function(route) {

    if (namespace.html5Routing){

        window.history.pushState({}, null, getBasePath(route));

    } else {

        window.location.hash = route;

    }

    routeFromUrl();

};

namespace.registerNotFound = function(controller, method){

    namespace.notFoundRoute.controller = controller;

    namespace.notFoundRoute.method = method;

};

namespace.registerView = function(name, template){

    namespace.viewProvider[name] = template;

};

namespace.registerRoute = function(params){

    namespace.routeProvider[params.name] = {

        route: params.route,

        controller: params.controller,

        method: params.method,

        middleware: params.middleware

    }

};

namespace.registerController = function(name, controller){

    namespace.controllerProvider[name] = controller;

};

namespace.registerMiddleware = function(name, middleware){

    namespace.middlewareProvider[name] = middleware;

};

namespace.getView = function(name){

    return namespace.viewProvider[name];

};

//Alias for namespace.buildView to be called directs on an instance of String.
String.prototype.buildView = function(data){

    return namespace.buildView(this, data);

};

namespace.buildView = function(template, data){

    if (typeof template === "undefined"){

        fatalError("Template is undefined");

    }

    template = template.replace(/(\r\n|\n|\r)/gm, "");

    var valuesArr = template.match(/{{(.*?)}}/g);

    for (var i in valuesArr) {

        valuesArr[i] = valuesArr[i].substr(2, valuesArr[i].length - 4);

        valuesArr[i].trim();

        var pointer = valuesArr[i].split(':', 1)[0];

        switch (pointer) {

            case "view":

                var partial = namespace.viewProvider[valuesArr[i].substr(pointer.length + 1, valuesArr[i].length)];

                template = template.replace("{{" + valuesArr[i] + "}}", namespace.buildView(partial, data));

                break;

            default:

                template = template.replace("{{" + valuesArr[i] + "}}", typeof data[valuesArr[i]] !== "undefined" ? data[valuesArr[i]] : "");

            break;

        }

    }

    return template;

};

namespace.renderView = function (template, viewDidLoad, scrollToTop) {

    if (typeof template === "undefined"){

        fatalError("Template is undefined");

    }

    namespace.domContainer.innerHTML = template;

    if (typeof scrollToTop === "undefined" || scrollToTop){

        document.body.scrollTop = document.documentElement.scrollTop = 0;

    }

    if (typeof viewDidLoad !== "undefined" && viewDidLoad){

        viewDidLoad();

    }

};

//This is an alias for: getView, buildView, and renderView
namespace.serveView = function(viewName, data, viewDidLoad, scrollToTop){

    var template = namespace.getView(viewName);

    if (typeof template === "undefined"){

        fatalError("View " + "'" + viewName + "' not found");

    }

    template = namespace.buildView(template, data);

    namespace.renderView(template, viewDidLoad, scrollToTop);

}

namespace.init = function (params) {

    if (typeof document.getElementsByTagName('base')[0] === "undefined") {

        fatalError("Missing <base> tag in html.");

    }

    namespace.basePath = document.getElementsByTagName('base')[0].getAttribute("href");

    namespace.interceptAnchorWithClass = params.interceptAnchorWithClass;

    namespace.domContainer = document.getElementById(params.container);

    if(typeof params.exceptionMessage !== "undefined"){

        namespace.exceptionMessage = params.exceptionMessage;

    }

    //Check the history API is supported
    if (window.history && history.pushState){

        //listen for state changes
        window.onpopstate = function (event) {

            routeFromUrl();

        };

        //Set the current state
        window.history.replaceState({}, null, window.location.path);

        namespace.html5Routing = true;

    } else {

        //listen for state changes
        window.onhashchange = function(){

            routeFromUrl();

        }

        namespace.html5Routing = false;

    }

    document.addEventListener('click', function(event){

        var path = event.path || (event.composedPath && event.composedPath()) || event.deepPath();

        for(var i in path){

            if(path[i].nodeName === "A"){

                if(typeof namespace.interceptAnchorWithClass === "undefined" || path[i].classList.contains(namespace.interceptAnchorWithClass)){

                    event.preventDefault();

                    var route = path[i].getAttribute('href');

                    namespace.routeTo(route);

                }

            }

        }

    });

    routeFromUrl();

};

export default namespace;
