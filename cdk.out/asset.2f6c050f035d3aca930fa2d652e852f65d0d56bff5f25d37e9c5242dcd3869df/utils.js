const AWS = require('aws-sdk');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const fs = require('fs');
const { spawn } = require('child_process');

exports.writeS3File = async function(type, filePath, fileName) {

    let key = filePath.replace('https://meditate-sounds.s3.eu-central-1.amazonaws.com/', '');
    let s3Key = key.replaceAll('+',' ').replaceAll('o%CC%81', 'o').replaceAll('%C5%82', 'l');
    console.log(s3Key);

    await fs.promises.mkdir(`/tmp/${meditationId}`, { recursive: true });

    try {
        const params = {
            Bucket: 'meditate-sounds',
            Key: s3Key,
        };

        const data = await s3.getObject(params).promise();

        await fs.promises.writeFile(`/tmp/${meditationId}/${type}.mp3`, data.Body);

    } catch(err) {
        console.log(err);
    }
}

exports.uploadObjectToS3Bucket = async function(meditationId) {
    const filePath = `/tmp/${meditationId}/${meditationId}.mp3`;
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