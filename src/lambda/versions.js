let getVersions = require("npm-package-versions");

export async function handler(event) {
  let pkg = event.path.match(/[^/]+$/)[0];

  return new Promise(resolve => {
    getVersions(pkg, (err, body) => {
      if (err) {
        return resolve({
          statusCode: 400,
          body: "Something went wrong"
        });
      }
      return resolve({ statusCode: 200, body: JSON.stringify(body) });
    });
  });
}
