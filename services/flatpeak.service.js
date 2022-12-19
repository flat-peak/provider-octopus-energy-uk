const {FlatpeakService} = require("@flat-peak/api-service");
const {convertToTariffPlan: convertToTariff} = require("../tariff-processors");

const throwIfError = async (request) => {
    const result = await request;
    if (result.object === "error") {
        throw new Error(result.message);
    }
    return result;
}

const connectTariff = async (octopusDetails, productId, customerId, credentials, publishableKey) => {
    const { agreement: octopusAgreement, tariffCode, clientReferenceId } = octopusDetails;
    const service = new FlatpeakService(process.env.FLATPEAK_API_URL, publishableKey, true);
    const plan = convertToTariff(octopusAgreement);
    const customer = await throwIfError((customerId ? service.getCustomer(customerId) : service.createCustomer({})));
    let product = await throwIfError((productId ? service.getProduct(productId) : service.createProduct({
        customer_id: customer.id,
        provider_id: process.env.PROVIDER_ID,
        timezone: plan.timezone,
    })));
    plan.product_id = product.id;

    const tariff = await throwIfError(service.createTariff(plan))

    product = await throwIfError(service.updateProduct(product.id, {
        "tariff_settings": {
            "reference_id": clientReferenceId,
            "display_name": tariffCode,
            "is_enabled": true,
            "integrated": true,
            "tariff_id": tariff.id,
            "auth_metadata": {
                "data": credentials
            }
        },
    }));

    return {
        customer_id: customer.id,
        product_id: product.id,
        tariff_id: tariff.id
    }
}

module.exports = {
    connectTariff
}
