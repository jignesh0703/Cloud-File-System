import { AWSService } from "./aws.service.js";
import { Cloudanary } from "./cloudinary.service.js";

const providers = {
    aws: AWSService,
    cloudinary: Cloudanary
};

function getCloudService(provider, credentials) {
    const ServiceClass = providers[provider];
    if (!ServiceClass) throw new Error("Unsupported provider");
    return new ServiceClass(credentials);
}

export default getCloudService;