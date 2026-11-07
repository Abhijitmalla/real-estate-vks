import db from "../config/db.js";

const DEFAULT_SETTINGS = {
  page_title: "Our Real Estate Services",
  page_subtitle: "Comprehensive real estate solutions to help you buy, sell, rent and invest with confidence.",
  hero_badge: "Trusted Real Estate Experts",
  hero_bg_image: "assets/service-page-header.png",
  offer_eyebrow: "— Our Services —",
  offer_title: "What We Offer",
  offer_subtitle: "A complete range of real estate services designed to make your property journey simple, secure, and successful.",
  why_choose_image: "assets/service-page2.png",
  why_choose_eyebrow: "— Why Choose Our Services? —",
  why_choose_title: "Reliable, Transparent & Customer-Focused",
  why_choose_features: JSON.stringify([
    { icon: "fa-solid fa-shield-halved", label: "Trusted Platform" },
    { icon: "fa-solid fa-users-viewfinder", label: "Verified Properties" },
    { icon: "fa-solid fa-award", label: "Expert Guidance" },
    { icon: "fa-solid fa-bolt", label: "Quick & Easy Process" }
  ]),
  how_it_works_eyebrow: "— How It Works —",
  how_it_works_title: "A Simple and Seamless Process",
  how_it_works_subtitle: "Get your desired property or list your own in just a few easy steps.",
  how_it_works_steps: JSON.stringify([
    { step: 1, icon: "fa-solid fa-user-plus", title: "Create an Account", desc: "Sign up and set up your profile in minutes." },
    { step: 2, icon: "fa-solid fa-magnifying-glass", title: "Choose a Service", desc: "Buy, sell, rent or get property consultation." },
    { step: 3, icon: "fa-solid fa-house-chimney", title: "Explore & Connect", desc: "Browse verified listings and connect with genuine users." },
    { step: 4, icon: "fa-solid fa-handshake", title: "Complete the Deal", desc: "Finalize your property deal with our support." }
  ]),
  cta_title: "Ready to Use Our Services?",
  cta_subtitle: "Explore properties, list your own, or get expert real estate guidance today.",
  cta_btn_text: "Browse Properties →",
  cta_btn_link: "product-details.html"
};

const parseJsonField = (val) => {
  if (!val) return null;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return val;
  }
};

const formatSettingsRow = (row) => {
  if (!row) return null;
  return {
    ...row,
    why_choose_features: parseJsonField(row.why_choose_features),
    how_it_works_steps: parseJsonField(row.how_it_works_steps)
  };
};

const ensureServicesTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        record_type ENUM('settings','card') NOT NULL DEFAULT 'card',
        page_title VARCHAR(255) DEFAULT NULL,
        page_subtitle TEXT DEFAULT NULL,
        hero_badge VARCHAR(255) DEFAULT NULL,
        hero_bg_image VARCHAR(500) DEFAULT NULL,
        offer_eyebrow VARCHAR(255) DEFAULT NULL,
        offer_title VARCHAR(255) DEFAULT NULL,
        offer_subtitle TEXT DEFAULT NULL,
        why_choose_image VARCHAR(500) DEFAULT NULL,
        why_choose_eyebrow VARCHAR(255) DEFAULT NULL,
        why_choose_title VARCHAR(255) DEFAULT NULL,
        why_choose_features TEXT DEFAULT NULL,
        how_it_works_eyebrow VARCHAR(255) DEFAULT NULL,
        how_it_works_title VARCHAR(255) DEFAULT NULL,
        how_it_works_subtitle TEXT DEFAULT NULL,
        how_it_works_steps TEXT DEFAULT NULL,
        cta_title VARCHAR(255) DEFAULT NULL,
        cta_subtitle TEXT DEFAULT NULL,
        cta_btn_text VARCHAR(255) DEFAULT NULL,
        cta_btn_link VARCHAR(500) DEFAULT NULL,
        service_title VARCHAR(255) DEFAULT NULL,
        service_icon VARCHAR(100) DEFAULT NULL,
        target_url VARCHAR(500) DEFAULT NULL,
        service_description TEXT DEFAULT NULL,
        is_active TINYINT(1) DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const extraCols = [
      { name: "hero_bg_image", type: "VARCHAR(500) DEFAULT NULL" },
      { name: "offer_eyebrow", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "offer_title", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "offer_subtitle", type: "TEXT DEFAULT NULL" },
      { name: "why_choose_image", type: "VARCHAR(500) DEFAULT NULL" },
      { name: "why_choose_eyebrow", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "why_choose_title", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "why_choose_features", type: "TEXT DEFAULT NULL" },
      { name: "how_it_works_eyebrow", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "how_it_works_title", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "how_it_works_subtitle", type: "TEXT DEFAULT NULL" },
      { name: "how_it_works_steps", type: "TEXT DEFAULT NULL" },
      { name: "cta_title", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "cta_subtitle", type: "TEXT DEFAULT NULL" },
      { name: "cta_btn_text", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "cta_btn_link", type: "VARCHAR(500) DEFAULT NULL" }
    ];

    const [columns] = await db.query("SHOW COLUMNS FROM services");
    const existingColNames = new Set(columns.map(c => c.Field.toLowerCase()));

    for (const col of extraCols) {
      if (!existingColNames.has(col.name.toLowerCase())) {
        try {
          await db.query(`ALTER TABLE services ADD COLUMN ${col.name} ${col.type}`);
        } catch (alterErr) {
          // Ignored if column already exists
        }
      }
    }
  } catch (e) {
    console.warn("Services table check warning:", e.message);
  }
};

// GET: All services and page settings
export const getAllServices = async (req, res) => {
  try {
    await ensureServicesTable();
    const [settings] = await db.execute(
      "SELECT * FROM services WHERE record_type = 'settings' ORDER BY id ASC LIMIT 1"
    );

    const [cards] = await db.execute(
      "SELECT * FROM services WHERE record_type = 'card' ORDER BY sort_order ASC, id ASC"
    );

    const settingsData = settings.length ? formatSettingsRow(settings[0]) : null;

    res.status(200).json({
      success: true,
      settings: settingsData,
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
    await ensureServicesTable();
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
    await ensureServicesTable();
    const body = req.body || {};
    const service_title = body.service_title || body.title;
    const service_description = body.service_description || body.description || body.desc;
    const service_icon = (req.file ? `/uploads/services/${req.file.filename}` : null) || body.service_icon || body.icon || null;
    const target_url = body.target_url !== undefined ? body.target_url : (body.link !== undefined ? body.link : (body.url !== undefined ? body.url : "contact-us.html"));
    const is_active = body.is_active !== undefined ? body.is_active : (body.active !== undefined ? body.active : 1);
    const sort_order = body.sort_order !== undefined ? body.sort_order : (body.order !== undefined ? body.order : 0);

    if (!service_title || !service_description) {
      return res.status(400).json({
        success: false,
        message: "Service title and description are required"
      });
    }

    // Retrieve active settings or defaults for page_title, page_subtitle, hero_badge
    let page_title = body.page_title !== undefined ? body.page_title : body.title_page;
    let page_subtitle = body.page_subtitle !== undefined ? body.page_subtitle : body.subtitle_page;
    let hero_badge = body.hero_badge !== undefined ? body.hero_badge : body.badge;

    if (!page_title || !page_subtitle || !hero_badge) {
      try {
        const [settingsRows] = await db.execute(
          "SELECT page_title, page_subtitle, hero_badge FROM services WHERE record_type = 'settings' ORDER BY id ASC LIMIT 1"
        );
        if (settingsRows.length && settingsRows[0]) {
          page_title = page_title || settingsRows[0].page_title;
          page_subtitle = page_subtitle || settingsRows[0].page_subtitle;
          hero_badge = hero_badge || settingsRows[0].hero_badge;
        }
      } catch (e) {
        // Fallback to default settings
      }
    }

    page_title = page_title ? String(page_title).trim() : DEFAULT_SETTINGS.page_title;
    page_subtitle = page_subtitle ? String(page_subtitle).trim() : DEFAULT_SETTINGS.page_subtitle;
    hero_badge = hero_badge ? String(hero_badge).trim() : DEFAULT_SETTINGS.hero_badge;

    const [result] = await db.execute(
      `INSERT INTO services (
        record_type,
        page_title,
        page_subtitle,
        hero_badge,
        service_title,
        service_icon,
        target_url,
        service_description,
        is_active,
        sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "card",
        page_title,
        page_subtitle,
        hero_badge,
        String(service_title).trim(),
        service_icon,
        target_url ? String(target_url).trim() : null,
        String(service_description).trim(),
        is_active ?? 1,
        sort_order ?? 0
      ]
    );

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      id: result.insertId,
      data: {
        id: result.insertId,
        page_title,
        page_subtitle,
        hero_badge,
        service_title: String(service_title).trim(),
        service_icon,
        target_url: target_url ? String(target_url).trim() : null,
        service_description: String(service_description).trim(),
        is_active: is_active ?? 1,
        sort_order: sort_order ?? 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// PUT / POST: Update services page settings & all sections
export const updateServiceSettings = async (req, res) => {
  try {
    await ensureServicesTable();
    const body = req.body || {};

    // Check for uploaded files
    let uploadedHeroBg = null;
    let uploadedWhyImage = null;

    if (req.file) {
      const f = req.file;
      if (f.fieldname === "why_choose_image" || f.fieldname === "why_image") {
        uploadedWhyImage = `/uploads/services/${f.filename}`;
      } else {
        uploadedHeroBg = `/uploads/services/${f.filename}`;
      }
    } else if (req.files) {
      const filesList = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      for (const f of filesList) {
        if (f.fieldname === "why_choose_image" || f.fieldname === "why_image") {
          uploadedWhyImage = `/uploads/services/${f.filename}`;
        } else if (f.fieldname === "hero_bg_image" || f.fieldname === "hero_image" || f.fieldname === "hero_bg") {
          uploadedHeroBg = `/uploads/services/${f.filename}`;
        }
      }
    }

    const [existing] = await db.execute(
      "SELECT * FROM services WHERE record_type = 'settings' ORDER BY id ASC LIMIT 1"
    );
    const old = existing.length ? existing[0] : {};

    const page_title = body.page_title !== undefined ? body.page_title : (old.page_title || DEFAULT_SETTINGS.page_title);
    const page_subtitle = body.page_subtitle !== undefined ? body.page_subtitle : (old.page_subtitle || DEFAULT_SETTINGS.page_subtitle);
    const hero_badge = body.hero_badge !== undefined ? body.hero_badge : (old.hero_badge || DEFAULT_SETTINGS.hero_badge);
    const hero_bg_image = uploadedHeroBg || body.hero_bg_image || old.hero_bg_image || DEFAULT_SETTINGS.hero_bg_image;

    const offer_eyebrow = body.offer_eyebrow !== undefined ? body.offer_eyebrow : (old.offer_eyebrow || hero_badge || DEFAULT_SETTINGS.offer_eyebrow);
    const offer_title = body.offer_title !== undefined ? body.offer_title : (old.offer_title || DEFAULT_SETTINGS.offer_title);
    const offer_subtitle = body.offer_subtitle !== undefined ? body.offer_subtitle : (old.offer_subtitle || DEFAULT_SETTINGS.offer_subtitle);

    const why_choose_image = uploadedWhyImage || body.why_choose_image || old.why_choose_image || DEFAULT_SETTINGS.why_choose_image;
    const why_choose_eyebrow = body.why_choose_eyebrow !== undefined ? body.why_choose_eyebrow : (old.why_choose_eyebrow || DEFAULT_SETTINGS.why_choose_eyebrow);
    const why_choose_title = body.why_choose_title !== undefined ? body.why_choose_title : (old.why_choose_title || DEFAULT_SETTINGS.why_choose_title);

    let why_choose_features = old.why_choose_features || DEFAULT_SETTINGS.why_choose_features;
    if (body.why_choose_features !== undefined) {
      why_choose_features = typeof body.why_choose_features === "object"
        ? JSON.stringify(body.why_choose_features)
        : body.why_choose_features;
    }

    const how_it_works_eyebrow = body.how_it_works_eyebrow !== undefined ? body.how_it_works_eyebrow : (old.how_it_works_eyebrow || DEFAULT_SETTINGS.how_it_works_eyebrow);
    const how_it_works_title = body.how_it_works_title !== undefined ? body.how_it_works_title : (old.how_it_works_title || DEFAULT_SETTINGS.how_it_works_title);
    const how_it_works_subtitle = body.how_it_works_subtitle !== undefined ? body.how_it_works_subtitle : (old.how_it_works_subtitle || DEFAULT_SETTINGS.how_it_works_subtitle);

    let how_it_works_steps = old.how_it_works_steps || DEFAULT_SETTINGS.how_it_works_steps;
    if (body.how_it_works_steps !== undefined) {
      how_it_works_steps = typeof body.how_it_works_steps === "object"
        ? JSON.stringify(body.how_it_works_steps)
        : body.how_it_works_steps;
    }

    const cta_title = body.cta_title !== undefined ? body.cta_title : (old.cta_title || DEFAULT_SETTINGS.cta_title);
    const cta_subtitle = body.cta_subtitle !== undefined ? body.cta_subtitle : (old.cta_subtitle || DEFAULT_SETTINGS.cta_subtitle);
    const cta_btn_text = body.cta_btn_text !== undefined ? body.cta_btn_text : (old.cta_btn_text || DEFAULT_SETTINGS.cta_btn_text);
    const cta_btn_link = body.cta_btn_link !== undefined ? body.cta_btn_link : (old.cta_btn_link || DEFAULT_SETTINGS.cta_btn_link);

    if (existing.length) {
      await db.execute(
        `UPDATE services SET
          page_title = ?,
          page_subtitle = ?,
          hero_badge = ?,
          hero_bg_image = ?,
          offer_eyebrow = ?,
          offer_title = ?,
          offer_subtitle = ?,
          why_choose_image = ?,
          why_choose_eyebrow = ?,
          why_choose_title = ?,
          why_choose_features = ?,
          how_it_works_eyebrow = ?,
          how_it_works_title = ?,
          how_it_works_subtitle = ?,
          how_it_works_steps = ?,
          cta_title = ?,
          cta_subtitle = ?,
          cta_btn_text = ?,
          cta_btn_link = ?
         WHERE id = ? AND record_type = 'settings'`,
        [
          page_title,
          page_subtitle,
          hero_badge,
          hero_bg_image,
          offer_eyebrow,
          offer_title,
          offer_subtitle,
          why_choose_image,
          why_choose_eyebrow,
          why_choose_title,
          why_choose_features,
          how_it_works_eyebrow,
          how_it_works_title,
          how_it_works_subtitle,
          how_it_works_steps,
          cta_title,
          cta_subtitle,
          cta_btn_text,
          cta_btn_link,
          existing[0].id
        ]
      );
    } else {
      await db.execute(
        `INSERT INTO services (
          record_type,
          page_title,
          page_subtitle,
          hero_badge,
          hero_bg_image,
          offer_eyebrow,
          offer_title,
          offer_subtitle,
          why_choose_image,
          why_choose_eyebrow,
          why_choose_title,
          why_choose_features,
          how_it_works_eyebrow,
          how_it_works_title,
          how_it_works_subtitle,
          how_it_works_steps,
          cta_title,
          cta_subtitle,
          cta_btn_text,
          cta_btn_link
        ) VALUES ('settings', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          page_title,
          page_subtitle,
          hero_badge,
          hero_bg_image,
          offer_eyebrow,
          offer_title,
          offer_subtitle,
          why_choose_image,
          why_choose_eyebrow,
          why_choose_title,
          why_choose_features,
          how_it_works_eyebrow,
          how_it_works_title,
          how_it_works_subtitle,
          how_it_works_steps,
          cta_title,
          cta_subtitle,
          cta_btn_text,
          cta_btn_link
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: "Services settings updated successfully",
      settings: {
        page_title,
        page_subtitle,
        hero_badge,
        hero_bg_image,
        offer_eyebrow,
        offer_title,
        offer_subtitle,
        why_choose_image,
        why_choose_eyebrow,
        why_choose_title,
        why_choose_features: parseJsonField(why_choose_features),
        how_it_works_eyebrow,
        how_it_works_title,
        how_it_works_subtitle,
        how_it_works_steps: parseJsonField(how_it_works_steps),
        cta_title,
        cta_subtitle,
        cta_btn_text,
        cta_btn_link
      }
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
    await ensureServicesTable();
    const body = req.body || {};

    const [existing] = await db.execute(
      "SELECT * FROM services WHERE id = ? AND record_type = 'card'",
      [req.params.id]
    );

    if (!existing.length) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    const oldService = existing[0];
    const page_title = body.page_title !== undefined ? body.page_title : (oldService.page_title || DEFAULT_SETTINGS.page_title);
    const page_subtitle = body.page_subtitle !== undefined ? body.page_subtitle : (oldService.page_subtitle || DEFAULT_SETTINGS.page_subtitle);
    const hero_badge = body.hero_badge !== undefined ? body.hero_badge : (oldService.hero_badge || DEFAULT_SETTINGS.hero_badge);
    const service_title = body.service_title !== undefined ? body.service_title : (body.title !== undefined ? body.title : oldService.service_title);
    const service_description = body.service_description !== undefined ? body.service_description : (body.desc !== undefined ? body.desc : (body.description !== undefined ? body.description : oldService.service_description));
    const uploadedIcon = req.file ? `/uploads/services/${req.file.filename}` : null;
    const service_icon = uploadedIcon || (body.service_icon !== undefined ? body.service_icon : (body.icon !== undefined ? body.icon : oldService.service_icon));
    const target_url = body.target_url !== undefined ? body.target_url : (body.link !== undefined ? body.link : oldService.target_url);
    const is_active = body.is_active !== undefined ? body.is_active : (body.active !== undefined ? body.active : oldService.is_active);
    const sort_order = body.sort_order !== undefined ? body.sort_order : (body.order !== undefined ? body.order : oldService.sort_order);

    await db.execute(
      `UPDATE services SET
        page_title = ?,
        page_subtitle = ?,
        hero_badge = ?,
        service_title = ?,
        service_icon = ?,
        target_url = ?,
        service_description = ?,
        is_active = ?,
        sort_order = ?
       WHERE id = ? AND record_type = 'card'`,
      [
        page_title,
        page_subtitle,
        hero_badge,
        service_title,
        service_icon,
        target_url,
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
    await ensureServicesTable();
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


// POST / PUT: Batch synchronize services list, page settings & all section images/texts from Admin
export const batchSyncServices = async (req, res) => {
  try {
    await ensureServicesTable();
    const body = req.body || {};

    // 1. Process uploaded image files (if any)
    let uploadedHeroBg = null;
    let uploadedWhyImage = null;

    if (req.file) {
      const f = req.file;
      if (f.fieldname === "why_choose_image" || f.fieldname === "why_image") {
        uploadedWhyImage = `/uploads/services/${f.filename}`;
      } else if (f.fieldname === "hero_bg_image" || f.fieldname === "hero_image" || f.fieldname === "hero_bg") {
        uploadedHeroBg = `/uploads/services/${f.filename}`;
      }
    } else if (req.files) {
      const filesList = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      for (const f of filesList) {
        if (f.fieldname === "why_choose_image" || f.fieldname === "why_image") {
          uploadedWhyImage = `/uploads/services/${f.filename}`;
        } else if (f.fieldname === "hero_bg_image" || f.fieldname === "hero_image" || f.fieldname === "hero_bg") {
          uploadedHeroBg = `/uploads/services/${f.filename}`;
        }
      }
    }

    // 2. Fetch existing settings (if any)
    const [existingSettings] = await db.execute(
      "SELECT * FROM services WHERE record_type = 'settings' ORDER BY id ASC LIMIT 1"
    );
    const old = existingSettings.length ? existingSettings[0] : {};

    const page_title = body.page_title !== undefined ? String(body.page_title).trim() : (old.page_title || "");
    const page_subtitle = body.page_subtitle !== undefined ? String(body.page_subtitle).trim() : (old.page_subtitle || "");
    const hero_badge = body.hero_badge !== undefined ? String(body.hero_badge).trim() : (old.hero_badge || "");
    const hero_bg_image = uploadedHeroBg || (body.hero_bg_image !== undefined ? body.hero_bg_image : (old.hero_bg_image || "assets/service-page-header.png"));

    const offer_eyebrow = body.offer_eyebrow !== undefined ? String(body.offer_eyebrow).trim() : (old.offer_eyebrow || "— Our Services —");
    const offer_title = body.offer_title !== undefined ? String(body.offer_title).trim() : (old.offer_title || "What We Offer");
    const offer_subtitle = body.offer_subtitle !== undefined ? String(body.offer_subtitle).trim() : (old.offer_subtitle || "");

    const why_choose_image = uploadedWhyImage || (body.why_choose_image !== undefined ? body.why_choose_image : (old.why_choose_image || "assets/service-page2.png"));
    const why_choose_eyebrow = body.why_choose_eyebrow !== undefined ? String(body.why_choose_eyebrow).trim() : (old.why_choose_eyebrow || "— Why Choose Our Services? —");
    const why_choose_title = body.why_choose_title !== undefined ? String(body.why_choose_title).trim() : (old.why_choose_title || "Reliable, Transparent & Customer-Focused");

    let why_choose_features = old.why_choose_features || null;
    if (body.why_choose_features !== undefined) {
      why_choose_features = typeof body.why_choose_features === "object"
        ? JSON.stringify(body.why_choose_features)
        : body.why_choose_features;
    }

    const how_it_works_eyebrow = body.how_it_works_eyebrow !== undefined ? String(body.how_it_works_eyebrow).trim() : (old.how_it_works_eyebrow || "— How It Works —");
    const how_it_works_title = body.how_it_works_title !== undefined ? String(body.how_it_works_title).trim() : (old.how_it_works_title || "A Simple and Seamless Process");
    const how_it_works_subtitle = body.how_it_works_subtitle !== undefined ? String(body.how_it_works_subtitle).trim() : (old.how_it_works_subtitle || "");

    let how_it_works_steps = old.how_it_works_steps || null;
    if (body.how_it_works_steps !== undefined) {
      how_it_works_steps = typeof body.how_it_works_steps === "object"
        ? JSON.stringify(body.how_it_works_steps)
        : body.how_it_works_steps;
    }

    const cta_title = body.cta_title !== undefined ? String(body.cta_title).trim() : (old.cta_title || "Ready to Use Our Services?");
    const cta_subtitle = body.cta_subtitle !== undefined ? String(body.cta_subtitle).trim() : (old.cta_subtitle || "");
    const cta_btn_text = body.cta_btn_text !== undefined ? String(body.cta_btn_text).trim() : (old.cta_btn_text || "Browse Properties →");
    const cta_btn_link = body.cta_btn_link !== undefined ? String(body.cta_btn_link).trim() : (old.cta_btn_link || "product-details.html");

    const hasAnySettingsInput = body.page_title !== undefined || body.page_subtitle !== undefined || body.hero_badge !== undefined ||
      uploadedHeroBg || body.hero_bg_image !== undefined || body.offer_eyebrow !== undefined || body.offer_title !== undefined ||
      body.offer_subtitle !== undefined || uploadedWhyImage || body.why_choose_image !== undefined || body.why_choose_eyebrow !== undefined ||
      body.why_choose_title !== undefined || body.why_choose_features !== undefined || body.how_it_works_eyebrow !== undefined ||
      body.how_it_works_title !== undefined || body.how_it_works_subtitle !== undefined || body.how_it_works_steps !== undefined ||
      body.cta_title !== undefined || body.cta_subtitle !== undefined || body.cta_btn_text !== undefined || body.cta_btn_link !== undefined;

    if (existingSettings.length) {
      await db.execute(
        `UPDATE services SET
          page_title = ?,
          page_subtitle = ?,
          hero_badge = ?,
          hero_bg_image = ?,
          offer_eyebrow = ?,
          offer_title = ?,
          offer_subtitle = ?,
          why_choose_image = ?,
          why_choose_eyebrow = ?,
          why_choose_title = ?,
          why_choose_features = ?,
          how_it_works_eyebrow = ?,
          how_it_works_title = ?,
          how_it_works_subtitle = ?,
          how_it_works_steps = ?,
          cta_title = ?,
          cta_subtitle = ?,
          cta_btn_text = ?,
          cta_btn_link = ?
         WHERE id = ? AND record_type = 'settings'`,
        [
          page_title,
          page_subtitle,
          hero_badge,
          hero_bg_image,
          offer_eyebrow,
          offer_title,
          offer_subtitle,
          why_choose_image,
          why_choose_eyebrow,
          why_choose_title,
          why_choose_features,
          how_it_works_eyebrow,
          how_it_works_title,
          how_it_works_subtitle,
          how_it_works_steps,
          cta_title,
          cta_subtitle,
          cta_btn_text,
          cta_btn_link,
          old.id
        ]
      );
    } else if (hasAnySettingsInput) {
      await db.execute(
        `INSERT INTO services (
          record_type, page_title, page_subtitle, hero_badge, hero_bg_image,
          offer_eyebrow, offer_title, offer_subtitle, why_choose_image, why_choose_eyebrow,
          why_choose_title, why_choose_features, how_it_works_eyebrow, how_it_works_title,
          how_it_works_subtitle, how_it_works_steps, cta_title, cta_subtitle, cta_btn_text, cta_btn_link
        ) VALUES ('settings', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          page_title,
          page_subtitle,
          hero_badge,
          hero_bg_image,
          offer_eyebrow,
          offer_title,
          offer_subtitle,
          why_choose_image,
          why_choose_eyebrow,
          why_choose_title,
          why_choose_features,
          how_it_works_eyebrow,
          how_it_works_title,
          how_it_works_subtitle,
          how_it_works_steps,
          cta_title,
          cta_subtitle,
          cta_btn_text,
          cta_btn_link
        ]
      );
    }

    let servicesList = body.services;
    if (typeof servicesList === "string") {
      try {
        servicesList = JSON.parse(servicesList);
      } catch (e) {
        servicesList = [];
      }
    }

    if (Array.isArray(servicesList)) {
      const keptIds = [];

      for (let i = 0; i < servicesList.length; i++) {
        const item = servicesList[i];
        if (!item) continue;

        const title = (item.service_title || item.title || "").trim();
        const desc = (item.service_description || item.desc || item.description || "").trim();
        const icon = item.service_icon || item.icon || "🏠";
        const link = item.target_url || item.link || "contact-us.html";
        const sortOrder = item.sort_order !== undefined ? Number(item.sort_order) : i;
        const isActive = item.is_active !== undefined ? (item.is_active ? 1 : 0) : 1;

        if (!title && !desc) continue;

        const isExistingNumericId = item.id && !isNaN(Number(item.id)) && Number(item.id) > 0;

        if (isExistingNumericId) {
          const cardId = Number(item.id);
          const [checkExisting] = await db.execute(
            "SELECT id FROM services WHERE id = ? AND record_type = 'card'",
            [cardId]
          );

          if (checkExisting.length) {
            await db.execute(
              `UPDATE services SET
                service_title = ?,
                service_icon = ?,
                target_url = ?,
                service_description = ?,
                is_active = ?,
                sort_order = ?
               WHERE id = ? AND record_type = 'card'`,
              [title, icon, link, desc, isActive, sortOrder, cardId]
            );
            keptIds.push(cardId);
            continue;
          }
        }

        // Insert new card
        const [insertRes] = await db.execute(
          `INSERT INTO services (
            record_type,
            page_title,
            page_subtitle,
            hero_badge,
            service_title,
            service_icon,
            target_url,
            service_description,
            is_active,
            sort_order
          ) VALUES ('card', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            page_title,
            page_subtitle,
            hero_badge,
            title,
            icon,
            link,
            desc,
            isActive,
            sortOrder
          ]
        );
        keptIds.push(insertRes.insertId);
      }

      if (keptIds.length > 0) {
        const placeholders = keptIds.map(() => "?").join(",");
        await db.query(
          `DELETE FROM services WHERE record_type = 'card' AND id NOT IN (${placeholders})`,
          keptIds
        );
      } else {
        await db.execute("DELETE FROM services WHERE record_type = 'card'");
      }
    }

    const [finalSettings] = await db.execute(
      "SELECT * FROM services WHERE record_type = 'settings' ORDER BY id ASC LIMIT 1"
    );
    const [finalCards] = await db.execute(
      "SELECT * FROM services WHERE record_type = 'card' ORDER BY sort_order ASC, id ASC"
    );

    res.status(200).json({
      success: true,
      message: "Services and sections saved successfully",
      settings: finalSettings.length ? formatSettingsRow(finalSettings[0]) : null,
      services: finalCards
    });
  } catch (error) {
    console.error("Batch sync services error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
