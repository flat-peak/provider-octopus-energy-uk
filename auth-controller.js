const {FlatpeakService} = require("./services/flatpeak.service");
const {obtainKrakenToken} = require("./services/octopus.service");

function populateTemplate(session) {
    return {
        lastError: session.last_error,
        callbackUrl: session.callback_url,
        ProviderDisplayName: 'OctopusEnergy', // FIXME: wording?
        ManufacturerDisplayName: '{ManufacturerDisplayName}', // FIXME: connect
        ManufacturerTermsUrl: '#', // FIXME: connect
        ManufacturerPolicyUrl: '#' // FIXME: connect
    }
}
function captureInputParams(req, res, {pub_key, product_id, customer_id, callback_url}) {
    const service = new FlatpeakService(process.env.FLATPEAK_API_URL, pub_key);
    if (!pub_key) {
        respondWithError(req, res, 'Publishable key is required to proceed')
        return;
    }
    service
        .getAccount()
        .then((account) => {
            if (account.object === 'error') {;
                respondWithError(req, res, account.message)
                return;
            }
            req.session.last_error = '';
            req.session.account = account;
            req.session.pub_key = pub_key;
            req.session.product_id = product_id;
            req.session.customer_id = customer_id;
            req.session.callback_url = callback_url;
            res.redirect('/auth')
        });
}


function captureAuthMetaData(req, res, {email, password}) {
    obtainKrakenToken({ email, password })
        .then(({token, error}) => {
            if (error) {
                req.session.last_error = error;
                res.redirect('/auth');
                return;
            }
            req.session.last_error = '';
            req.session.auth_metadata =  { email, password };
            res.redirect('/share');
        });
}

function respondWithError(req, res, error) {
    res.render('error', {
        title: 'Error',
        error: error,
        callbackUrl: req.session?.callback_url,
    });
}

module.exports = {
    captureInputParams,
    captureAuthMetaData,
    populateTemplate,
    respondWithError
}
