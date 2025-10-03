import rateLimit from "express-rate-limit"

export  const UploadLimit = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: 'Too many file uploads, please wait a while.',
});

export const RateLimit = rateLimit({
    windowMs: 1 * 60 * 10000,
    max: 1,
    message: 'Too many request, please wait a while.'
})

// {
//     UploadLimit,
//     RateLimit
// }