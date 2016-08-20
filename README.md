# Api.js
A Promises based Asynchronous calls library, for multiple requests at the same time, and a caching layer for speeding up the response.

This library, based on jQuery, helps to achieve a large number of REST calls without writing a lot of code. Really useful for parallel calls but also for consecutive ones.

### Necessary dependencies ###
Apart from jQuery, the only needed dependency, in ext folder, are helpers and [js-md5]{@link https://github.com/emn178/js-md5} (this one is optional for caching system keys).

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
**dev** | Boolean | dev enable/disable the logs (Errors and warning are shown anyway).
**ext** | Array | Path for extensions are set here, the extensions are loaded once the init method is called.
**info**| Object| contain general string info about the library
**methods** | Object | contain the methods map.
**settings**| Object | Item | Type | Description
                       ------------ | ------------- | -------------
                       **contentType** | String | Set the default contentType, used if is not defined in the request.
                       **accept**      | String | Set the default accept, used if is not defined in the request.
                       **cache**       | Object | Cache system settings
                                                  Item | Type | Description
                                                  ------------ | ------------- | -------------
                                                  **enabled** | Boolean | Enable/disable the caching system.

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
// Generate an array of 10 requests object 
var requests = [];
var i = 1;
while(i < 11){
    a.push({
        url: 'http://swapi.co/api/people/{{id}}/',
        settings: {
            crossDomain: true
        },
        params: {
            id: i
        }
    });
    i++
}

// Make the actual request with callbacks
Api.get(requests, function(response){
    console.info('That\'s a success!', response);
}, function(error){
    console.error('That\'s an error :c', error);
});

// Make the actual request with promises
Api.get(requests).then(function(response){
    console.info('That\'s a success!', response);
}).catch(function(error){
    console.error('That\'s an error :c', error);
});
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
