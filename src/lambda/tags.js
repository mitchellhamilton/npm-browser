let https = require("https");

export async function handler(event) {
  let url =
    "https://registry.npmjs.org/" +
    event.path.match(/([^/]+$|@[^/]+\/[^/]+)/)[0];
  return new Promise(resolve => {
    https.get(url, function(res) {
      if (res.statusCode !== 200) {
        console.log(res.statusCode, url, JSON.stringify(event, null, 2));
        res.destroy();
        resolve({ statusCode: 400, body: "Something went wrong" });
        return;
      }

      let buffers = [];
      res.on("data", buffers.push.bind(buffers));
      res.on("end", function() {
        let data = Buffer.concat(buffers);
        resolve({
          statusCode: 200,
          body: JSON.stringify(JSON.parse(data)["dist-tags"])
        });
      });
    });
  });
}
