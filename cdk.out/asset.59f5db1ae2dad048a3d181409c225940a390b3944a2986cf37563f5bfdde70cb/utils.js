const AWS = require('aws-sdk');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const fs = require('fs');
const { spawn } = require('child_process');

exports.writeS3File = async function(type, filePath, meditationId) {

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