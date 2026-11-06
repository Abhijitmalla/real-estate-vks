import db from "../config/db.js";

export const ensureAboutUsTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS about_us (
        id INT AUTO_INCREMENT PRIMARY KEY,
        record_type VARCHAR(50) NOT NULL DEFAULT 'card',
        hero_badge VARCHAR(255) DEFAULT NULL,
        hero_title VARCHAR(255) DEFAULT NULL,
        hero_lead TEXT DEFAULT NULL,
        story_image VARCHAR(500) DEFAULT NULL,
        story_para_1 TEXT DEFAULT NULL,
        story_para_2 TEXT DEFAULT NULL,
        trust_point_1 VARCHAR(255) DEFAULT NULL,
        trust_point_2 VARCHAR(255) DEFAULT NULL,
        trust_point_3 VARCHAR(255) DEFAULT NULL,
        trust_point_4 VARCHAR(255) DEFAULT NULL,
        why_title VARCHAR(255) DEFAULT NULL,
        why_subtitle TEXT DEFAULT NULL,
        cta_title VARCHAR(255) DEFAULT NULL,
        cta_desc TEXT DEFAULT NULL,
        cta_btn1_text VARCHAR(255) DEFAULT NULL,
        cta_btn1_link VARCHAR(500) DEFAULT NULL,
        cta_btn2_text VARCHAR(255) DEFAULT NULL,
        cta_btn2_link VARCHAR(500) DEFAULT NULL,
        card_title VARCHAR(255) DEFAULT NULL,
        card_icon VARCHAR(100) DEFAULT NULL,
        card_desc TEXT DEFAULT NULL,
        sort_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (err) {
    console.warn("about_us table check warning:", err.message);
  }
};

// GET: All About Us page data dynamically from database
export const getAboutPageData = async (req, res) => {
  try {
    await ensureAboutUsTable();

    const [settings] = await db.execute(
      "SELECT * FROM about_us WHERE record_type = 'settings' ORDER BY id ASC LIMIT 1"
    );

    const [cards] = await db.execute(
      "SELECT * FROM about_us WHERE record_type = 'card' ORDER BY sort_order ASC, id ASC"
    );

    res.status(200).json({
      success: true,
      settings: settings.length ? settings[0] : null,
      cards: cards || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT / POST: Update or create About Us settings dynamically
export const updateAboutSettings = async (req, res) => {
  try {
    await ensureAboutUsTable();
    const body = req.body || {};

    let uploadedStoryImage = null;
    if (req.file) {
      uploadedStoryImage = `/uploads/about/${req.file.filename}`;
    } else if (req.files) {
      const filesList = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      for (const f of filesList) {
        if (f.fieldname === "story_image" || f.fieldname === "image") {
          uploadedStoryImage = `/uploads/about/${f.filename}`;
        }
      }
    }

    const [existing] = await db.execute(
      "SELECT * FROM about_us WHERE record_type = 'settings' ORDER BY id ASC LIMIT 1"
    );

    const prev = existing.length ? existing[0] : null;

    const hero_badge = body.hero_badge !== undefined ? body.hero_badge : (prev ? prev.hero_badge : null);
    const hero_title = body.hero_title !== undefined ? body.hero_title : (prev ? prev.hero_title : null);
    const hero_lead = body.hero_lead !== undefined ? body.hero_lead : (prev ? prev.hero_lead : null);
    const story_image = uploadedStoryImage || (body.story_image !== undefined ? body.story_image : (prev ? prev.story_image : null));
    const story_para_1 = body.story_para_1 !== undefined ? body.story_para_1 : (prev ? prev.story_para_1 : null);
    const story_para_2 = body.story_para_2 !== undefined ? body.story_para_2 : (prev ? prev.story_para_2 : null);
    const trust_point_1 = body.trust_point_1 !== undefined ? body.trust_point_1 : (prev ? prev.trust_point_1 : null);
    const trust_point_2 = body.trust_point_2 !== undefined ? body.trust_point_2 : (prev ? prev.trust_point_2 : null);
    const trust_point_3 = body.trust_point_3 !== undefined ? body.trust_point_3 : (prev ? prev.trust_point_3 : null);
    const trust_point_4 = body.trust_point_4 !== undefined ? body.trust_point_4 : (prev ? prev.trust_point_4 : null);
    const why_title = body.why_title !== undefined ? body.why_title : (prev ? prev.why_title : null);
    const why_subtitle = body.why_subtitle !== undefined ? body.why_subtitle : (prev ? prev.why_subtitle : null);
    const cta_title = body.cta_title !== undefined ? body.cta_title : (prev ? prev.cta_title : null);
    const cta_desc = body.cta_desc !== undefined ? body.cta_desc : (prev ? prev.cta_desc : null);
    const cta_btn1_text = body.cta_btn1_text !== undefined ? body.cta_btn1_text : (prev ? prev.cta_btn1_text : null);
    const cta_btn1_link = body.cta_btn1_link !== undefined ? body.cta_btn1_link : (prev ? prev.cta_btn1_link : null);
    const cta_btn2_text = body.cta_btn2_text !== undefined ? body.cta_btn2_text : (prev ? prev.cta_btn2_text : null);
    const cta_btn2_link = body.cta_btn2_link !== undefined ? body.cta_btn2_link : (prev ? prev.cta_btn2_link : null);

    if (prev) {
      await db.execute(
        `UPDATE about_us SET
          hero_badge = ?, hero_title = ?, hero_lead = ?,
          story_image = ?, story_para_1 = ?, story_para_2 = ?,
          trust_point_1 = ?, trust_point_2 = ?, trust_point_3 = ?, trust_point_4 = ?,
          why_title = ?, why_subtitle = ?,
          cta_title = ?, cta_desc = ?, cta_btn1_text = ?, cta_btn1_link = ?, cta_btn2_text = ?, cta_btn2_link = ?
        WHERE id = ?`,
        [
          hero_badge, hero_title, hero_lead,
          story_image, story_para_1, story_para_2,
          trust_point_1, trust_point_2, trust_point_3, trust_point_4,
          why_title, why_subtitle,
          cta_title, cta_desc, cta_btn1_text, cta_btn1_link, cta_btn2_text, cta_btn2_link,
          prev.id
        ]
      );
    } else {
      await db.execute(
        `INSERT INTO about_us (
          record_type, hero_badge, hero_title, hero_lead,
          story_image, story_para_1, story_para_2,
          trust_point_1, trust_point_2, trust_point_3, trust_point_4,
          why_title, why_subtitle,
          cta_title, cta_desc, cta_btn1_text, cta_btn1_link, cta_btn2_text, cta_btn2_link
        ) VALUES (
          'settings', ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?,
          ?, ?, ?, ?, ?, ?
        )`,
        [
          hero_badge, hero_title, hero_lead,
          story_image, story_para_1, story_para_2,
          trust_point_1, trust_point_2, trust_point_3, trust_point_4,
          why_title, why_subtitle,
          cta_title, cta_desc, cta_btn1_text, cta_btn1_link, cta_btn2_text, cta_btn2_link
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: "About Us settings updated successfully",
      story_image
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST: Create a Why Choose Card dynamically
export const createAboutCard = async (req, res) => {
  try {
    await ensureAboutUsTable();
    const body = req.body || {};

    const card_title = body.card_title || body.title || "";
    const card_icon = body.card_icon || body.icon || "fa-solid fa-shield-halved";
    const card_desc = body.card_desc || body.description || body.desc || "";
    const sort_order = body.sort_order !== undefined ? body.sort_order : 0;
    const is_active = body.is_active !== undefined ? body.is_active : 1;

    const [result] = await db.execute(
      `INSERT INTO about_us (
        record_type, card_title, card_icon, card_desc, sort_order, is_active
      ) VALUES ('card', ?, ?, ?, ?, ?)`,
      [card_title, card_icon, card_desc, sort_order, is_active]
    );

    res.status(201).json({
      success: true,
      message: "Feature card created successfully",
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT: Update a Why Choose Card dynamically
export const updateAboutCard = async (req, res) => {
  try {
    await ensureAboutUsTable();
    const body = req.body || {};
    const cardId = req.params.id;

    const [existing] = await db.execute(
      "SELECT * FROM about_us WHERE id = ? AND record_type = 'card'",
      [cardId]
    );
    if (!existing.length) {
      return res.status(404).json({ success: false, message: "Card not found" });
    }
    const prev = existing[0];

    const card_title = body.card_title !== undefined ? body.card_title : (body.title !== undefined ? body.title : prev.card_title);
    const card_icon = body.card_icon !== undefined ? body.card_icon : (body.icon !== undefined ? body.icon : prev.card_icon);
    const card_desc = body.card_desc !== undefined ? body.card_desc : (body.description !== undefined ? body.description : (body.desc !== undefined ? body.desc : prev.card_desc));
    const sort_order = body.sort_order !== undefined ? body.sort_order : prev.sort_order;
    const is_active = body.is_active !== undefined ? body.is_active : prev.is_active;

    await db.execute(
      `UPDATE about_us SET
        card_title = ?, card_icon = ?, card_desc = ?, sort_order = ?, is_active = ?
      WHERE id = ? AND record_type = 'card'`,
      [card_title, card_icon, card_desc, sort_order, is_active, cardId]
    );

    res.status(200).json({ success: true, message: "Feature card updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE: Remove a Why Choose Card dynamically
export const deleteAboutCard = async (req, res) => {
  try {
    await ensureAboutUsTable();
    await db.execute("DELETE FROM about_us WHERE id = ? AND record_type = 'card'", [req.params.id]);
    res.status(200).json({ success: true, message: "Feature card deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/about/ (routes router.post("/"))
export const handlePostAbout = async (req, res) => {
  const body = req.body || {};
  if (body.record_type === "card" || (body.card_title && !body.hero_title && !body.why_title)) {
    return createAboutCard(req, res);
  }
  return updateAboutSettings(req, res);
};
