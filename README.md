# Api.js
A Promises based Asynchronous calls library, for multiple requests at the same time, and a caching layer for speeding up the response.

This library, based on jQuery, helps to achieve a large number of REST calls without writing a lot of code. Really useful for parallel calls but also for consecutive ones.

### Necessary dependencies ###
Apart from jQuery, the only needed dependency, in ext folder, are helpers and [js-md5](@link https://github.com/emn178/js-md5) (this one is optional for caching system keys).

## Fist steps ##
Include Api.js in your HTML page:

```html
<script type="text/javascript" src="dist/api.js"></script>
```

After that, initialize the api istance in a variable of your choice:

```javascript
var Api = api();
```
The last step is to initialize the library and pass the optional configuration to be overwritten, the second parameter can be a callback function called when the library is initialized (intialization is asynchronous).

```javascript
Api.init([config, callback]);
```

And you're good to start playing with the library :).

### Config object ###
The config object is composed by the following items:

Item | Type | Description
------------ | ------------- | -------------
**paths** | Object | Composed by base and api, is the base path to be called by your library
**dev** | Boolean | dev enable/disable the logs (Errors and warning are shown anyway).
**ext** | Array | Path for extensions are set here, the extensions are loaded once the init method is called.
**info**| Object| contain general string info about the library
**methods** | Object | contain the methods map.
**settings**| Object | Default settings for requests, and enable/disable caching system.

### Methods ###
**Init**
Initialize the library, you can pass a configuration object and a callback as second parameter:

```javascript
Api.init([config, callback]);
```

**Get/post/put/delete/call**
Ajax methods, perform the specified ajax call on every request passed, request can be a single object or an array of objects, the response will be returned when all requests has been dispatched, and will contain an array with all the responses.

The method requires a request argument, and a success and error callbacks can be added as optional second and third arguments. These methods all return a Promise, so you can use then and catch too instead of the two callbacks.

The call method behave exactly the same of the others, but it consider a "method" attribute in the request, allowing you to make different methods calls if needed.

```javascript
Api.get(request/s, [config, callback]);
Api.post(request/s, [config, callback]);
Api.put(request/s, [config, callback]);
Api.delete(request/s, [config, callback]);
Api.call(request/s, [config, callback]);
```
Here you can find an example of calls with callbacks and promises (Thanks to [swapi for the data]{@link https://swapi.co/}):

```javascript

    /** Callback function example */
    function makeRequest(){

        /** Create a request istance for the first 10 pages */
        var requests = [];
        for(var i = 1; i < 10; i++){

            /** Create a request istance */
            var request = new Api.build.Request(
                'people/{{id}}/',
                {
                    id: i
                }
            );

            /** Add it to requests array */
            requests.push(request);

        };

        /** Pass requests to get method */
        Api.get(requests).then(function(response){

            /** This is the callback to successful calls */

            /** Results retrieved */
            console.info('Results retrieved', response);

        }).catch(function(error){

            /** Errors in calls are catched here */

            /** Results retrieved */
            console.error('Error occurred', error);

        });

    };

    /** Create Api istance */
    var Api = api();

    /** Settings */
    var settings = {

        /** Base paths settings */
        paths: {
            base    : '',
            api     : 'http://swapi.co/api/'
        },

        /** Set logs to active */
        dev     : true,

        /** Set extensions with different path */
        ext     : [
            '../ext/helpers.js',
            '../ext/md5.js'
        ]
    };

    /** initialize library */
    Api.init(settings, makeRequest);
}
```
### Request object ###
The request object is composed by the following items:

Item | Type | Description
------------ | ------------- | -------------
**url** | String | *Mandatory*, set the URL of the resource to be called, you can insert parameters placeholders in order to populate dynamic path parameters.
**params** | Object | *Optional*, Params contains the data to be passed in path or as query string data, a passed param is first replaced in the URL if a placeholder with the same key is found, otherwise is added in query string.
**body** | Object | *Optional*, Body is the object that has to be passed as the actual payload, in GET method this data are managed as params.
**settings** | Object | *Optional*, Settings contain all those beatiful params you could add on Ajax requests, such as "crossDomain" or "async".
**headers** | Object | *Optional*, I know, could sound strange, but headers actually contain headers (could you believe that?) to be passed along with the request.
**contentType** | String | Set the content-type of the request (override the default one from configuration).
**accept** | String | Set the accept parameter of the request (override the default one from configuration).
