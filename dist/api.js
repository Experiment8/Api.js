/**
@name Api.js
@description A RESTful APIs library, with cache layer and multiple calls threading.
@author Roberto Lonardi <lonardi.r@gmail.com>
@tags API REST Promise Promises
@version 1.0.0
*/

/** Helpers object */
var Help = {

    /** Return a fake Promise always resolving immediately */
    fakePromise: function(success, callback){

        /** Generate a fake xhr Promise */
        var xhr = new Promise(function(resolve, reject){

                /** If a callback is passed call it */
                if(callback){ callback(); }

                if(success === true){ resolve(); } else if(success === false){ reject(); }

            });

        /** Return it */
        return xhr;

    },

    /** Populate a string that contains placeholders */
    populateString: function(string, data){

        if (!data) {
            console.error('No data passed, can\'t populate string.');
            return string;
        }

        /** Search each placeholder and replace it with the corresponding value */
        for(key in data){
            var placeholder = '{{' + key + '}}';
            var matcher     = new RegExp(placeholder, 'g');

            /** Search for it in the string */
            if(matcher.test(string)){
                string = string.replace(placeholder, data[key]);
            }
        }

        return string;
    },

    /** Check for a "{{text}}" type placeholder in certain string, returns false or true */
    checkPlaceholder: function(string, text){

        /** Populate the RegExp object with the passed string */
        var filter = '{{' + string + '}}';
        var regexp = new RegExp(filter, 'g');

        /** Return the result of the match */
        return regexp.test(text);

    },

    /** Return a placeholder representation of a string */
    placeholder: function(string){
        var placeholder = '{{' + string + '}}';

        /** Returns the palceholder */
        return placeholder;

    },

    /** Returns the passed JSON in query string object */
    toQueryString: function(object){
        var query = $.param(object) ? '?' + $.param(object) : '';

        /** Return the query */
        return query;
    }

};

/** Dependency constructor */
function api(){

    /** IMPORTS
    Import dependencies.
    ========================================================== */
    var $   = require('jquery');
    var md5 = require('js-md5');

    /** PRIVATE METHODS
    Private methods are available only from within the dependency.
    ========================================================== */

    /** TO MD5
    Parse the passed string in md5 and return the result. */
    function generateKey(request){
        var string = request.url + JSON.stringify(request.params);

        /** Check if md5 extension is loaded */
        if(md5){
            return md5(string);
        } else {
            return string;
        };

    }

    /** LOAD CACHE
    Load call from cache if present, otherwise return false. */
    function loadCache(request){
        var key = generateKey(request);

        return Api.cache[key];
    };

    /** SAVE CACHE
    Save the call response in memory cache. */
    function saveCache(request, response){
        var key = generateKey(request);

        if(Api.config.dev){ console.info(Api.config.info.name + ': Saving call in cache with key "' + key + '"'); }

        /** Save data in cache */
        Api.cache[key] = response;
    };

    /** GENERATE AJAX OBJECT
    Starting from the request, parse it and returns the
    correct ajax object request. */
    function generateAjaxObject(request){

        /** Generate arguments with fixed values */
        var data = {};

        data['url']    = request.url;
        data['method'] = request.method;

        if(request.accept !== false)         data['accept']        = request.accept || Api.config.settings.accept;
        if(request.contentType !== false)    data['contentType']   = request.contentType || Api.config.settings.contentType;

        if(request.body){ data['data'] = Api.config.settings.bodyParser(request.body); };

        /** Parse headers */
        if(request.headers){
            data['headers'] = request.headers;
        };

        /** Parse settings */
        if(request.settings){
            $.extend(data, request.settings);
        };

        return data;
    };

    /** CALL
    Actual ajax call with passed parameters. */
    function call(request){

        /** Parse request to generate an ajax compatible object */
        var data = generateAjaxObject(request);

        /** Wehre the magic is done :) */
        var xhr = new Promise(function(resolve, reject){

            $.ajax(data).done(function(response, status, xhr){

                /** Resolve the promise */
                resolve(response, status, xhr);

            }).fail(function(response, status, xhr){

                /** Reject the promise */
                reject(response, status, xhr);

            });

        });

        return xhr;
    };

    /** PARSE REQUEST
    Parse the requests and return the call itself. */
    function parseRequest(request){

        /** If there are params left put them in query string */
        if(request.params){

            /** Add them to the url */
            request.url += Help.toQueryString(request.params);

            /** Delete the params */
            delete request.params;
        };

        /** If url has no http add api base url */
        if(request.url.indexOf('http') < 0){
            request.url = Api.config.paths.api + request.url;
        };

        /** retrive cache if present */
        var cache = loadCache(request);

        /** If there is already cache for the call, return directly the cached response */
        if(Api.config.settings.cache.enabled){
            var cache = new Promise(function(resolve){

                /** Resolve the promise with the cached response */
                resolve(cache);

            });

            /** Return the actual call */
            var response = call(request);

            /** Save the response in cache */
            response.then(function(data){
                saveCache(request, data);
            });

            return cache;

        } else {

            /** Return the actual call */
            var response = call(request);

            /** Save the response in cache */
            response.then(function(data){
                saveCache(request, data);
            });

            return response;
        };
    }

    /** CHECK REQUESTS INTEGRITY
    Check if requests are in a correct format and if not return a boolean false. */
    function checkRequestsIntegrity(requests){

        if(!requests){ return false; }

        /** If request is not an array wrap it in one */
        if(!(requests instanceof Array)){
            requests = [requests];
        }

        /** For each request check for essential parameters */
        for(index in requests){
            var request = requests[index];

            if(!request.url){

                console.error(Api.config.info.name + ': No url passed, request aborted.');

                return false;
            }
        }

        return requests;
    };

    /** CALLBACK WRAPPER
    Wraps the final promises from call method in a promise. */
    function callbackWrapper (promises, success, error) {

        if (!promises || !promises.length) {
            console.error(Api.config.info.name + ': No promises passed, aborted callback wrapping.');
            return Help.fakePromise(true);
        }

        /** Parse the Promises to launch the callbacks */
        var callback = new Promise(function(resolve, reject){
            Promise.all(promises).then(function(response, status, xhr){

                if(success){ success(response, status, xhr); }

                /** Resolve the promise */
                resolve(response, status, xhr);

            }).catch(function(response, status, xhr){

                if(error){ error(response, status, xhr); }

                /** Resolve the promise */
                reject(response, status, xhr);

            });
        });

        return callback;

    }

    /** EXTENSIONS
    Initialize extensions of this dependency.
    (extensions are reachable for children of this dependency) */
    function initializeExtensions(){

        /** Get extensions */
        var exts = Api.config.ext;

        /** Initialize promises */
        var promises = [];

        /** If the are no extensions return a fake Promise */
        if(exts.length === 0){

            /** Fake promise */
            return Help.fakePromise(true);

        }

        /** For each extension create a promise */
        for(index in exts){
            var ext = exts[index];

            /** Create the promise */
            var xhr = new Promise(function(resolve, reject){
                $.getScript(ext, function(extension){
                    resolve(extension);
                }).fail(function(){
                    reject();
                });
            });

            promises.push(xhr);
        }

        return Promise.all(promises);
    };

    /** Dependency prototype */
    var Api = {

        /** CONFIG
        Dependency configuration. */
        config  : {

            /** Base paths settings */
            paths: {
                base    : '',
                api     : ''
            },

            dev: true,

            /** Extensions */
            ext: [
                'ext/helpers.js',
                'ext/md5.js'
                 ],

            /** Dependency general infos */
            info: {
                name: 'Api'
            },

            /** Methods */
            methods: {

                get     : 'GET',
                post    : 'POST',
                put     : 'PUT',
                delete  : 'DELETE'

            },

            /** Default configuration */
            settings: {

                /** Default Accept and contentType for AJAX calls */
                contentType : 'application/json',
                accept      : 'json',

                /** The function used by default for parsing the body */
                bodyParser: JSON.stringify,

                /** Caching settings */
                cache: {
                    enabled: true
                }

            }
        },

        /** CACHE
        Call cache for faster response. */
        cache   : {},

        /** BUILD
        Object constructors. */
        build   : {

            /** Request object constructor */
            Request: function(url, params, body){

                if(!url){
                    console.error(Api.config.info.name + ': At least url must be passed to create Request object.');
                    return false;
                }

                /** If url has no http add api base url */
                if(url.indexOf('http') < 0){
                    url = Api.config.paths.api + url;
                };

                /** Set params */
                if(params)  {

                    /** Populate the string where possible */
                    url = Help.populateString(url, params);

                    /** Assign remaining params */
                    this['params'] = params;

                };

                /** Set url, after path parameters have been added */
                this['url'] = url;

                /** Set body */
                if(body) this['body'] = body;

            }

        },

        /** PUBLIC METHODS
        Public methods can be called from outside the dependency.
        ===================================================== */

        /** INIT
        Dependency initialization. */
        init: function(config, callback){

            /** Extend configuration with the passed one */
            $.extend(true, Api.config, config);

            /** Initialize extensions */
            initializeExtensions().then(function(){

                /** If init callback is present call it at the init very end */
                if(callback) callback();

            });

        },

        /** GET
        Get calls method. */
        get: function(requests, success, error){

            /** Check integrity */
            requests = checkRequestsIntegrity(requests);

            if(!requests){

                console.error(Api.config.info.name + ': No valid requests passes on GET method, aborted.');

                return false;
            }

            /** Initialize promises */
            var promises = [];

            /** Parse each request */
            for(index in requests){
                var request = requests[index];

                /** If the method is already present and different from "GET", the call is skipped */
                if(request.method && request.method !== Api.config.methods.get){

                    console.error(Api.config.info.name + ': Passed method different from GET, request skipped.', request);

                    continue;
                }

                /** Set the request method */
                request['method'] = Api.config.methods.get;

                /** Parse the requests then make the actual call */
                var xhr = parseRequest(request);

                /** Push xhr call in promises array */
                promises.push(xhr);
            }

            /** Return the call promise wrapped in another promise */
            return callbackWrapper(promises, success, error);

        },

        /** POST
        Post calls method. */
        post: function(requests, success, error){

            /** Check integrity */
            requests = checkRequestsIntegrity(requests);

            if(!requests){

                console.error(Api.config.info.name + ': No valid requests passes on POST method, aborted.');

                return false;
            }

            /** Initialize promises */
            var promises = [];

            /** Parse each request */
            for(index in requests){
                var request = requests[index];

                /** If the method is already present and different from "POST", the call is skipped */
                if(request.method && request.method !== Api.config.methods.post){

                    console.error(Api.config.info.name + ': Passed method different from POST, request skipped.', request);

                    continue;
                }

                /** Set the request method */
                request['method'] = Api.config.methods.post;

                /** Parse the requests then make the actual call */
                var xhr = parseRequest(request);

                /** Push xhr call in promises array */
                promises.push(xhr);

            }

            /** Return the call promise wrapped in another promise */
            return callbackWrapper(promises, success, error);

        },

        /** PUT
        Put calls method. */
        put: function(requests, success, error){

            /** Check integrity */
            requests = checkRequestsIntegrity(requests);

            if(!requests){

                console.error(Api.config.info.name + ': No valid requests passes on PUT method, aborted.');

                return false;
            }

            /** Initialize promises */
            var promises = [];

            /** Parse each request */
            for(index in requests){
                var request = requests[index];

                /** If the method is already present and different from "PUT", the call is skipped */
                if(request.method && request.method !== Api.config.methods.put){

                    console.error(Api.config.info.name + ': Passed method different from PUT, request skipped.', request);

                    continue;
                }

                /** Set the request method */
                request['method'] = Api.config.methods.put;

                /** Parse the requests then make the actual call */
                var xhr = parseRequest(request);

                /** Push xhr call in promises array */
                promises.push(xhr);

            }

            /** Return the call promise wrapped in another promise */
            return callbackWrapper(promises, success, error);

        },

        /** DELETE
        Delete calls method. */
        delete: function(requests, success, error){

            /** Check integrity */
            requests = checkRequestsIntegrity(requests);

            if(!requests){

                console.error(Api.config.info.name + ': No valid requests passes on DELETE method, aborted.');

                return false;
            }

            /** Initialize promises */
            var promises = [];

            /** Parse each request */
            for(index in requests){
                var request = requests[index];

                /** Ifa  method is already present and different from "DELETE", the call is skipped */
                if(request.method && request.method !== Api.config.methods.delete){

                    console.error(Api.config.info.name + ': Passed method different from DELETE, request skipped.', request);

                    continue;
                }

                /** Set the request method */
                request['method'] = Api.config.methods.delete;

                /** Parse the requests then make the actual call */
                var xhr = parseRequest(request);

                /** Push xhr call in promises array */
                promises.push(xhr);

            }

            /** Return the call promise wrapped in another promise */
            return callbackWrapper(promises, success, error);

        },

        /** CALL
        Calls with different methods. */
        call: function(requests, success, error){

            /** Check integrity */
            requests = checkRequestsIntegrity(requests);

            if(!requests){

                console.error(Api.config.info.name + ': No valid requests passes on CALL method, aborted.');

                return false;
            }

            /** Initialize promises */
            var promises = [];

            /** Parse each request */
            for(index in requests){
                var request = requests[index];

                /** If the method is not present, request is skipped */
                if(!request.method){

                    console.error(Api.config.info.name + ': No method found, request skipped.', request);

                    continue;
                }

                /** Parse the requests then make the actual call */
                var xhr = parseRequest(request);

                /** Push xhr call in promises array */
                promises.push(xhr);

            }

            /** Return the call promise wrapped in another promise */
            return callbackWrapper(promises, success, error);
        }

    };

    /** Return dependency prototype. */
    return Api;
}

/** NPM export */
module.exports = new api();
