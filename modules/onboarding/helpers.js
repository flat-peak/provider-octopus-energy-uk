const {FlatpeakService} = require('@flatpeak/api-service');
const {isValidAuthMetadata} = require('../octopus/octopus.service');

/**
 * @param {string} last_error
 * @param {string} callback_url
 * @param {FlatPeak.Account} account
 * @return {Object}
 */
function populateTemplate({last_error, callback_url, account}) {
  const displaySettings = account.display_settings;
  const hasAssets = Array.isArray(displaySettings?.language_assets) && displaySettings?.language_assets.length;
  const langAssets = hasAssets ?
        (
            displaySettings.language_assets
                .find((entry) => entry.language_code === displaySettings.default_language) ||
            displaySettings.language_assets[0]
            ) :
        {};

  return {
    lastError: last_error,
    callbackUrl: callback_url,
    ProviderDisplayName: 'Octopus Energy',
    ManufacturerDisplayName: langAssets.display_name,
    ManufacturerTermsUrl: langAssets.terms_url,
    ManufacturerPolicyUrl: langAssets.privacy_url,
    ManufacturerAccentColor: langAssets.accent_color || '#333333',
    ManufacturerLogoUrl: langAssets.logo_url,
  };
}

function captureInputParams(req, res, {pub_key, product_id, customer_id, callback_url}) {
  const service = new FlatpeakService(process.env.FLATPEAK_API_URL, pub_key);
  if (!pub_key) {
    respondWithError(req, res, 'Publishable key is required to proceed');
    return;
  }
  service
      .getAccount()
      .then((account) => {
        if (account.object === 'error') {
          respondWithError(req, res, account.message);
          return;
        }
        req.session.last_error = '';
        req.session.account = account;
        req.session.pub_key = pub_key;
        req.session.product_id = product_id;
        req.session.customer_id = customer_id;
        req.session.callback_url = callback_url;
        res.redirect('/auth');
      });
}

function captureAuthMetaData(req, res, {email, password}) {
  isValidAuthMetadata({email, password})
      .then(({token, error}) => {
        if (error) {
          req.session.last_error = error;
          res.redirect('/auth');
          return;
        }
        req.session.last_error = '';
        req.session.auth_metadata = {email, password};
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
  respondWithError,
};
