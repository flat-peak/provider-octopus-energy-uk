const {FlatpeakService} = require('@flat-peak/javascript-sdk');
const {isValidAuthMetadata} = require('../octopus/octopus.service');
const {logger} = require('../logger/cloudwatch');

/**
 * @param {DisplaySettings} display_settings
 * @return {LanguageAsset}
 */
function extractLanguageAssets(display_settings) {
  const hasAccountAssets = Array.isArray(display_settings?.language_assets) && display_settings?.language_assets.length;
  return hasAccountAssets ?
        (
            display_settings.language_assets
                .find((entry) => entry.language_code === display_settings.default_language) ||
            display_settings.language_assets[0]
        ) :
        {};
}

/**
 * @param {string} last_error
 * @param {string} callback_url
 * @param {Account} account
 * @param {Provider} provider
 * @return {Object}
 */
function populateTemplate({last_error, callback_url, account, provider}) {
  const accountLanguageSettings = extractLanguageAssets(account.display_settings);
  const providerLanguageSettings = extractLanguageAssets(provider.display_settings);

  return {
    lastError: last_error,
    callbackUrl: callback_url,

    ProviderDisplayName: providerLanguageSettings.display_name,
    ProviderPrivacyUrl: providerLanguageSettings.privacy_url,
    ProviderSupportUrl: providerLanguageSettings.support_url,
    ProviderTermsUrl: providerLanguageSettings.support_url,
    ProviderLogoUrl: providerLanguageSettings.logo_url,
    ProviderAccentColor: provider.display_settings?.graphic_assets?.accent_color || '#333333',

    ManufacturerDisplayName: accountLanguageSettings.display_name,
    ManufacturerTermsUrl: accountLanguageSettings.terms_url,
    ManufacturerPolicyUrl: accountLanguageSettings.privacy_url,
    ManufacturerLogoUrl: accountLanguageSettings.logo_url,
    ManufacturerAccentColor: account.display_settings?.graphic_assets?.accent_color || '#333333',
  };
}

function captureInputParams(req, res, {pub_key, product_id, customer_id, callback_url}) {
  const service = new FlatpeakService(
      process.env.FLATPEAK_API_URL,
      pub_key,
      (message) => logger.info(`[SERVICE] ${message}`),
  );
  if (!pub_key) {
    respondWithError(req, res, 'Publishable key is required to proceed');
    return;
  }

  Promise.all([
    service.getAccount(),
    service.getProvider(process.env.PROVIDER_ID),
  ]).then(([account, provider]) => {
    if (account.object === 'error') {
      respondWithError(req, res, account.message);
      return;
    }
    if (provider.object === 'error') {
      respondWithError(req, res, provider.message);
      return;
    }
    req.session.last_error = '';
    req.session.account = account;
    req.session.provider = provider;
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
