const AWS = require('aws-sdk');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const fs = require('fs');
const { spawn } = require('child_process');

exports.uploadObjectToS3Bucket = async function(filename) {
    const filePath = `/tmp/${filename}/${filename}.pdf`;
    console.log('Uploading...', filePath);
    let resp = null;
    await fs.promises.readFile(filePath)
        .then(async function(data) {
            const base64data = new Buffer(data, 'binary');

            const params = {
                Bucket: 'meditate-meditations',
                Key: `${meditationId}.mp3`,
                Body: base64data
            };

            const result = await s3.putObject(params).promise();
            console.log(result);

            // Return S3 URL
            const responseBody = {
                meditationUrl: `https://meditate-meditations.s3.eu-central-1.amazonaws.com/${meditationId}.mp3`
            };

            resp = {
                statusCode: 200,
                body: JSON.stringify(responseBody)
            };

            console.log("response: " + JSON.stringify(resp));
        });

    return resp;
}