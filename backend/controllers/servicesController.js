
import db from "../config/db.js";

// GET: All services and page settings
export const getAllServices = async (req, res) => {
  try {
    const [settings] = await db.execute(
      "SELECT * FROM services WHERE record_type = 'settings' ORDER BY id ASC LIMIT 1"
    );

    const [cards] = await db.execute(
      "SELECT * FROM services WHERE record_type = 'card' ORDER BY sort_order ASC, id DESC"
    );

    res.status(200).json({
      success: true,
      settings: settings[0] || null,
      services: cards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// GET: Single service card
export const getServiceById = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM services WHERE id = ? AND record_type = 'card'",
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    res.status(200).json({
      success: true,
      service: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// POST: Add new service card
export const createService = async (req, res) => {
  try {
    const {
      service_title,
      service_icon,
      target_url,
      service_description,
      is_active,
      sort_order
    } = req.body;

    if (!service_title || !service_description) {
      return res.status(400).json({
        success: false,
        message: "Service title and description are required"
      });
    }

    const [result] = await db.execute(
      `INSERT INTO services (
        record_type,
        service_title,
        service_icon,
        target_url,
        service_description,
        is_active,
        sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "card",
        service_title,
        service_icon || null,
        target_url || null,
        service_description,
        is_active ?? 1,
        sort_order ?? 0
      ]
    );

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// PUT: Update services page settings
export const updateServiceSettings = async (req, res) => {
  try {
    const {
      page_title,
      page_subtitle,
      hero_badge
    } = req.body;

    const [existing] = await db.execute(
      "SELECT id FROM services WHERE record_type = 'settings' ORDER BY id ASC LIMIT 1"
    );

    if (existing.length) {
      await db.execute(
        `UPDATE services SET
          page_title = ?,
          page_subtitle = ?,
          hero_badge = ?
         WHERE id = ?`,
        [
          page_title || null,
          page_subtitle || null,
          hero_badge || null,
          existing[0].id
        ]
      );
    } else {
      await db.execute(
        `INSERT INTO services (
          record_type,
          page_title,
          page_subtitle,
          hero_badge
        ) VALUES ('settings', ?, ?, ?)`,
        [
          page_title || null,
          page_subtitle || null,
          hero_badge || null
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: "Services settings updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// PUT: Edit service card
export const updateService = async (req, res) => {
  try {
    const {
      service_title,
      service_icon,
      target_url,
      service_description,
      is_active,
      sort_order
    } = req.body;

    const [existing] = await db.execute(
      "SELECT id FROM services WHERE id = ? AND record_type = 'card'",
      [req.params.id]
    );

    if (!existing.length) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    await db.execute(
      `UPDATE services SET
        service_title = ?,
        service_icon = ?,
        target_url = ?,
        service_description = ?,
        is_active = ?,
        sort_order = ?
       WHERE id = ? AND record_type = 'card'`,
      [
        service_title,
        service_icon || null,
        target_url || null,
        service_description,
        is_active ?? 1,
        sort_order ?? 0,
        req.params.id
      ]
    );

    res.status(200).json({
      success: true,
      message: "Service updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// DELETE: Remove service card
export const deleteService = async (req, res) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM services WHERE id = ? AND record_type = 'card'",
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Service deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
