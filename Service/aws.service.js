// class S3{
//     constructor(credentials){
//         this.cloudinary = cloudinary.v2.config({
//              cloud_name: credentials?.cloudinaryName || process.env.CLOUDINARY_NAME,
//              api_key: credentials?.cloudinaryKey || process.env.CLOUDINARY_KEY,
//              api_secret: credentials?.cloudinarySecret || process.env.CLOUDINARY_SECRET
//          });
//     }

//     async fileUpload(buffer) {
//          try {
//             const response = this.cloudinary.fileUpload(buffer);
//             return response;
//          } catch (error) {
//             throw error;
//          }
//     }
// }

// module.exports = {
//     s3: new S3(credentials),
//     sqs: 
// }