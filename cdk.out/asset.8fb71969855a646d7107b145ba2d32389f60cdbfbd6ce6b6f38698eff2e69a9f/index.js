'use strict';
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async function(event, context, callback) {

    const body = JSON.parse(event.body);

    console.log('Generating params for request ', body);

    const params = {
        TableName: process.env.DYNAMODB_TABLE,
        Item: body
    };


    try
    {
        //var result = await dynamoDb.put(params).promise();
        const resp = {
            statusCode: 200,
            //body: JSON.stringify(result)
            body: {}
        };
        console.log(resp);
        return resp;
    }
    catch(err)
    {
        console.log(err);
        const resp = {
            statusCode: 500,
            body: JSON.stringify({"error": "Error while saving usage data to the database"})
        };

        return resp;
    }

}
