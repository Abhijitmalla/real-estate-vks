
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "bilabadi_real_estate",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
const testConnection = async () => {
    try {
        const connection = await db.getConnection();

        console.log("Database connected successfully!");

        connection.release();

    } catch (error) {
        console.error("Database connection failed:", error.message);
    }
};

testConnection();

export default db;
