/**
ROBERTO LONARDI - 2016
Api.js Async comunication Library.
API - Javascript Api calls module.

Required libraries for correct working:
- jQuery > 1.2.0
*/

/** Dependency constructor */
function api(){

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

        if(request.accept){         data['accept']        = request.accept; }
        if(request.contentType){    data['contentType']   = request.contentType; }

        if(request.body){ data['data'] = request.body; };

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

        /** Parse Path and Query string parameters */
        if(request.params){

            /** Check each parameter and populate the url if is a path parameter */
            for(key in request.params){

                /** Check if the key is in the URL as placeholder */
                if(Help.checkPlaceholder(key, request.url)){
                    var placeholder = Help.placeholder(key);

                    /** If is present replace it */
                    request.url = request.url.replace(placeholder, request.params[key]);

                    /** Remove the param from params and leave only the query string ones */
                    delete request.params[key];
                }
            }

        };

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

        /** If there is already cache for the call, return directly the cached response */
        if(Api.config.settings.cache.enabled && loadCache(request)){
            var cache = new Promise(function(resolve){

                /** Resolve the promise with the cached response */
                resolve(loadCache(request));

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
            Request: function(url, params){

                if(!url){
                    console.error(Api.config.info.name + ': At least url must be passed to create Request object.');
                    return false;
                }

                /** If url has no http add api base url */
                if(url.indexOf('http') < 0){
                    url = Api.config.paths.api + url;
                };

                /** Set url */
                this['url'] = url;

                /** Set params */
                if(params){ this['params'] = params };

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
                if(callback){ callback(); }

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

            /** Return all the promises */
            return Promise.all(promises).then(function(response, status, xhr){
                if(success){ success(response, status, xhr); }
            }).catch(function(response, status, xhr){
                if(error){ error(response, status, xhr); }
            });

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

            /** Return all the promises */
            return Promise.all(promises).then(function(response, status, xhr){
                if(success){ success(response, status, xhr); }
            }).catch(function(response, status, xhr){
                if(error){ error(response, status, xhr); }
            });

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

            /** Return all the promises */
            return Promise.all(promises).then(function(response, status, xhr){
                if(success){ success(response, status, xhr); }
            }).catch(function(response, status, xhr){
                if(error){ error(response, status, xhr); }
            });

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

            /** Return all the promises */
            return Promise.all(promises).then(function(response, status, xhr){
                if(success){ success(response, status, xhr); }
            }).catch(function(response, status, xhr){
                if(error){ error(response, status, xhr); }
            });
        }

    };

    /** Return dependency prototype. */
    return Api;
}
