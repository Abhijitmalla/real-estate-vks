import bcrypt from "bcrypt";
import db from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const createAdmin = async () => {
    try {
        const name = "Super Admin";
        const email = "admin@gmail.com";
        const password = "Admin@123";

        const hashedPassword = await bcrypt.hash(password, 12);

        await db.query(
            `INSERT INTO admin_users (name, email, password)
             VALUES (?, ?, ?)`,
            [name, email, hashedPassword]
        );

        console.log("Admin created successfully");
        process.exit(0);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

createAdmin();