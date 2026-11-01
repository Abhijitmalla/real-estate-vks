
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
        fileSize: 10 * 1024 * 1024
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
