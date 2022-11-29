const fetch = require("node-fetch");
const {Buffer} = require("buffer");
const hasValidCredentials = async (pubKey) => {
    await fetch(process.env.FLATPEAK_API_URL + '/account', {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(pubKey + ":").toString("base64")}`
        }
    });
    return true;
}

module.exports = {
    hasValidCredentials
}
