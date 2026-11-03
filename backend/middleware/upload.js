import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        const uploadDir = path.join(
            process.cwd(),
            "uploads",
            "backgrounds"
        );

        // Create folder if it doesn't exist
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

const upload = multer({

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

export default upload;
