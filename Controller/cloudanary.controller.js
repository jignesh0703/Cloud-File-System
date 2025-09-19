// import { v2 as cloudinary } from 'cloudinary'

// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_NAME,
//     api_key: process.env.CLOUDINARY_KEY,
//     api_secret: process.env.CLOUDINARY_SECRET
// });

// class ClodanaryServices {
//     async ReadFile(req, res) {

//         const public_id = req.body.public_id

//         const fileUrl = cloudinary.url(public_id, { resource_type: 'auto' });

//         console.log("✅ Cloudinary URL:", fileUrl);

//         return res.status(200).json({ message: 'Success' })
//     }
// }

// export default new ClodanaryServices


// // https://res.cloudinary.com/dfaktrlxe/auto/upload/c_scale,w_500/v1/uploads/psyvacw7mvy1cb9gyzsk?_a=BAMAK+ce0 : dont word

// // https://res.cloudinary.com/dfaktrlxe/video/authenticated/s--z6iD-6eZ--/v1/uploads/psyvacw7mvy1cb9gyzsk.mp4?_a=BAMAK+ce0 : works