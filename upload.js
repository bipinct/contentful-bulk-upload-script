// Script to bulk upload images to contentful
const fs = require('fs');
const contentful = require('contentful-management')
const token = "";
const space = "";
const env = "";
const content_type_id = "";
const rate_limit = 3; // will request rate_limit number of calls at a time
const rate_limit_time = 5000; //will deley each bulk call for rate_limit_time Milliesecond
const mime = require('mime-types')
const folderPath = '';
const client = contentful.createClient({
    accessToken: token
})
const filesProcessed = [];
var errorUploading = [];
var imageToUpload = 0;

// TODO: No handled error or failed upload cases
// TODO : add logs or resume upload when failed
console.time("Time Taken By Script : ");
readImagesInDirectory(folderPath)

async function readImagesInDirectory(folder) {
    let contentFullClient = await client.getSpace(space);
    let contentFullEnv = await contentFullClient.getEnvironment(env);
    let fileBatch = [];
    let aFileBatch = [];

    await new Promise((resolve, reject) => {
        fs.readdir(folder, (err, files) => {
            imageToUpload = files.length;
            files.forEach((file, index) => {
                aFileBatch.push(file);
                if (index != 0 && !(index % rate_limit)) {
                    fileBatch.push(aFileBatch);
                    aFileBatch = [];
                }
            });
            if (aFileBatch.length) {
                fileBatch.push(aFileBatch);
            }
            resolve(fileBatch);
        });
    })


    if (fileBatch.length) {
        for (let ele = 0; ele < fileBatch.length; ele++) {
            let element = fileBatch[ele];
            element.forEach(async (item, index1) => {
                try {
                    await uploadAnImage(contentFullEnv, folder, item);
                    filesProcessed.push(item)
                    console.log(`...image uploaded ${filesProcessed.length} of ${imageToUpload}`)
                } catch (error) {
                    console.log("error processing file : ", error);
                }
            })
            if(errorUploading.length){
                console.log(errorUploading,"...in error uploading.....")
                fileBatch.concat(errorUploading)
                errorUploading = [];
                console.log(errorUploading,"...in error uploading.....")
            }

            await sleep(rate_limit_time);
        }

    }
    console.timeEnd("Time Taken By Script : ");
}

async function uploadAnImage(contentFullEnv, filePath, fileName) {
    try {
        let assetFileToUploadPath = filePath + "/" + fileName;
        let file;
        try {
            file = fs.readFileSync(assetFileToUploadPath);
            // console.log(file);
        } catch (err) {
            console.error(err);
        }

        let contentFullAsset = await contentFullEnv.createAssetFromFiles({
            fields: {
                title: {
                    'en-US': fileName.split(".")[0]
                },
                file: {
                    'en-US': {
                        contentType: mime.lookup(fileName),
                        fileName: fileName,
                        file: file
                    }
                }
            }

        });

        let contentFullProcessLocale = await contentFullAsset.processForAllLocales();
        let contentFullPublishAsset = await contentFullProcessLocale.publish();
        let contentFullEntry = await contentFullEnv.createEntry(content_type_id,
            {
                fields: {
                    titleField: {
                        'en-US': fileName.split(".")[0]
                    },
                    logo: {
                        "en-US": { "sys": { "id": contentFullPublishAsset.sys.id, "linkType": "Asset", "type": "Link" } }
                    }
                }
            })

        let ff = await contentFullEntry.publish()
    }
    catch (error) {
        errorUploading.push(fileName);        
        console.error("error uploading images...", error);
    }

}

async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

