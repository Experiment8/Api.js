/**
ROBERTO LONARDI - 2016
App.js helpers file.
HELPERS - Helpers file for App.js.
*/

/** Help object */
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

        if(!data){ App.error('No data passed, can\'t populate string.'); }

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
