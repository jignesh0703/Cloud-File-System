// import Cloudinary from "../Clouds/cloudanary.js";
// import dotenv from 'dotenv'
// dotenv.config()

// const PROVIDER = process.env.CLOUD_PROVIDER;  // "cloudinary" | "aws" | "Google"

// const UploadFile = async (filepath, socket, CompletedUploads, sessionId, TotalFile) => {
//     try {
//         if (PROVIDER === 'cloudinary') {
//             console.log('Cloudinary processing...');
//             return Cloudinary(filepath, socket, CompletedUploads, sessionId, TotalFile)
//         } else {
//             console.log("No provider matched!");
//         }
//     } catch (error) {
//         console.log('Something went wrong while uploading to cloud', error);
//     }
// };

// export default UploadFile;