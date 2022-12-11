const fetch = require("node-fetch");
const {Buffer} = require("buffer");
const {convertToTariffPlan: convertToTariff} = require("../tariff-processors");

class FlatpeakService {
    #publishableKey;
    #host;

    constructor(host, publishableKey) {
        this.#publishableKey = publishableKey;
        this.#host = host;
    }

    /**
     * @private
     * @return {string}
     */
    authWithPublishableKey() {
        return `Basic ${Buffer.from(this.#publishableKey + ":").toString("base64")}`;
    }

    /**
     * @param {RequestInit} init
     * @return {Promise<RequestInit>}
     */
    async authoriseRequest(init) {
        const headers = {
            "Content-Type": "application/json",
            Authorization: this.authWithPublishableKey(),
        };
        if (!init) {
            return {
                headers,
            };
        }
        if (!init.headers) {
            init.headers = headers;
        } else {
            init.headers = { ...init.headers, ...headers };
        }
        return init;
    }

    async performRequest(input, init = 0) {
        init = await this.authoriseRequest(init);
        console.log("performRequest", input, init);
        return await fetch(input, init);
    }

    /**
     * @return {Promise<FlatPeak.Account>}
     */
    async getAccount() {
        const response = await this.performRequest(`${this.#host}/account`, {
            method: "GET"
        });
        return await response.json();
    }

    /**
     * @param {string} productId
     * @return {Promise<FlatPeak.Product>}
     */
    async getProduct(productId) {
        const response = await this.performRequest(
            `${this.#host}/products/${productId}`
        );
        return await response.json();
    }

    /**
     * Create a tariff plan
     * @param {FlatPeak.TariffCreate} data
     * @return {Promise<FlatPeak.Tariff>}
     */
    async createTariff(data) {
        const response = await this.performRequest(`${this.#host}/tariffs`, {
            method: "POST",
            body: JSON.stringify(data),
        });
        return await response.json();
    }

    /**
     * @param {string} customerId
     * @return {Promise<FlatPeak.Customer>}
     */
    async getCustomer(customerId) {
        const response = await this.performRequest(
            `${this.#host}/customers/${customerId}`
        );
        return await response.json();
    }

    /**
     * Create a customer
     * @param {FlatPeak.CustomerCreate} data
     * @return {Promise<FlatPeak.Customer>}
     */
    async createCustomer(data) {
        const response = await this.performRequest(`${this.#host}/customers`, {
            method: "POST",
            body: JSON.stringify(data),
        });
        return await response.json();
    }

    /**
     * Create a product.
     * @param {FlatPeak.ProductCreate} data
     * @return {Promise<FlatPeak.Product>}
     */
    async createProduct(data) {
        const response = await this.performRequest(`${this.#host}/products`, {
            method: "POST",
            body: JSON.stringify(data),
        });
        return await response.json();
    }

    /**
     * Update a product.
     * @param {string} id
     * @param {FlatPeak.ProductUpdate} data
     * @return {Promise<FlatPeak.Product>}
     */
    async updateProduct(id, data) {
        const response = await this.performRequest(`${this.#host}/products/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
        return await response.json();
    }
}


const throwIfError = async (request) => {
    const result = await request;
    if (result.object === "error") {
        throw new Error(result.message);
    }
    return result;
}

const connectTariff = async (octopusDetails, productId, customerId, credentials, publishableKey) => {
    const { agreement: octopusAgreement, tariffCode, clientReferenceId } = octopusDetails;
    const service = new FlatpeakService(process.env.FLATPEAK_API_URL, publishableKey)
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
    FlatpeakService,
    connectTariff
}
