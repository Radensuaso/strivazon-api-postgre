import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

export const savePictureCloudinary = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "strivazon-postgre/product-images",
  },
});
