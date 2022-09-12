
// Get uploaded image url
const contentful = require("contentful");
const space = "";
const token = "";
const host = "preview.contentful.com";
const content_type_id = "";

const client = contentful.createClient({
    space: space,
    accessToken: token,
    host: host
});



// to get enteries
client.getEntries({
    content_type: content_type_id,
    'fields.titleField': 'my-file-name'
}
).then((e) => {
    console.log(e.includes.Asset[0].fields.file.url);
})