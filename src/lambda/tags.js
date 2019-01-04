let https = require("https");

export async function handler(event) {
  console.log(event.path);
  let url = "https://registry.npmjs.org/" + event.path.replace("/tags/", "");
  console.log(url);
  return new Promise(resolve => {
    https.get(url, function(res) {
      if (res.statusCode !== 200) {
        res.destroy();
        resolve({ statusCode: 400, body: "Something went wrong" });
        return;
      }

      let buffers = [];
      res.on("data", buffers.push.bind(buffers));
      res.on("end", function() {
        let data = Buffer.concat(buffers);
        console.log(JSON.parse(data)["dist-tags"]);
        resolve({
          statusCode: 200,
          body: JSON.stringify(JSON.parse(data)["dist-tags"])
        });
      });
    });
  });
}
