var apigClientFactory = require('aws-api-gateway-client').default;
var apiClientConfig = require('./apigw-config-dev.json');

var apigClient = apigClientFactory.newClient(apiClientConfig);

var pathTemplate = '/balanceSheet'
var method = 'PUT';
var additionalParams = {};

var request = require('/Users/zofiawalczewska/Documents/GitHub/EIT-maste-thesis-backend/api-test/wines and roses (1).pdf');

apigClient.invokeApi(null, pathTemplate, method, additionalParams, request)
    .then(function(result){
        console.log(result.data);
    }).catch( function(result){
    console.error(result);
});
