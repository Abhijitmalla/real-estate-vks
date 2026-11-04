import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const createUpload = (directory) => {
    const storage = multer.diskStorage({

        destination: (req, file, cb) => {
            const uploadDir = path.join(__dirname, "..", "uploads", directory);

            fs.mkdirSync(uploadDir, { recursive: true });

            cb(null, uploadDir);
        },

        filename: (req, file, cb) => {

            const uniqueName =
                Date.now() +
                "-" +
                Math.round(Math.random() * 1e9) +
                path.extname(file.originalname);

            cb(null, uniqueName);
        }
    });

    return multer({

        storage,

        limits: {
            fileSize: 25 * 1024 * 1024, // 25 MB max file upload
            fieldSize: 50 * 1024 * 1024  // 50 MB max field value size (fixes LIMIT_FIELD_VALUE)
        },

        fileFilter: (req, file, cb) => {

            const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp"
            ];

            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error("Only JPG, PNG and WebP images are allowed"));
            }
        }
    });
};

export default createUpload;
