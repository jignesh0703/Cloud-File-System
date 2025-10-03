import helmet from "helmet";

const helmetMiddleware = () => {
    return [
        helmet(), // default protections
        helmet.frameguard({ action: 'deny' }),
        helmet.noSniff(),
        helmet.xssFilter(),
        helmet.hsts({
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        }),
        helmet.contentSecurityPolicy({
            directives: {
                defaultSrc: ["'self'"],       // ✅ MUST have single quotes inside string
                scriptSrc: ["'self'"],        // only your scripts
                connectSrc: ["'self'"],       // for fetch/XHR (add AWS S3 if needed)
                imgSrc: ["'self'"],           // add AWS S3 URLs if loading images
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        }),
    ];
};

export default helmetMiddleware;