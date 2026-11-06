import db from "../config/db.js";

const DEFAULT_CONTACT_SETTINGS = {
  hero_badge: "CONTACT US",
  hero_title: "Let's Start a Conversation",
  hero_subtitle: "Need help with homes for sale, rental properties, studio apartments or duplex housing? Connect with trusted property agents for clear guidance.",
  hero_image: "assets/cat_agricultural.webp",
  hero_feature_1: "Expert Support",
  hero_feature_2: "Verified Assistance",
  hero_feature_3: "Quick Response",

  help_title: "How Can We Help You?",
  help_subtitle: "Our team is here to help you with buying, selling, renting and property-related queries.",

  operating_title: "Operating Hours",
  operating_days: "Monday – Saturday",
  operating_hours: "9:00 AM – 6:00 PM",
  operating_sunday: "Sunday",
  operating_sunday_status: "Closed",
  urgent_help_label: "Need urgent help?",
  urgent_help_email: "support@bilabadi.com",
  urgent_help_link: "mailto:support@bilabadi.com",

  locations_label: "Our Locations",

  map_embed_url: "https://maps.google.com/maps?q=Plot No: 1632/15509, Khata No: 1330/10531, Satya Vihar, Rasulgarh, Bhubaneswar, Odisha - 751017+122011&t=&z=15&ie=UTF8&iwloc=&output=embed",
  map_address: "Plot No: 1632/15509, Khata No: 1330/10531, Satya Vihar, Rasulgarh, Bhubaneswar, Odisha - 751017",
  map_rating: "4.0",
  map_reviews_count: "(2,084)",
  map_open_url: "https://maps.google.com/?q=Plot No: 1632/15509, Khata No: 1330/10531, Satya Vihar, Rasulgarh, Bhubaneswar, Odisha - 751017",

  trust_features: JSON.stringify([
    { title: "Quick Response", sub: "We reply within 2 hours" },
    { title: "Trusted Support", sub: "Get reliable assistance" },
    { title: "Property Guidance", sub: "Buy, sell or rent with ease" },
    { title: "Dedicated Team", sub: "Real estate experts for you" }
  ]),

  cta_title: "Find Your Next Home",
  cta_desc: "Browse new apartments, luxury houses, furnished apartments for rent, and flats for sale across India Homes - start your real estate journey with no brokerage.",
  cta_btn1_text: "Become a Reseller →",
  cta_btn1_link: "register.html",
  cta_btn2_text: "Get Started →",
  cta_btn2_link: "product-details.html"
};

const DEFAULT_HELP_CARDS = [
  {
    card_title: "Call Our Team",
    card_subtitle: "Speak directly with our property experts.",
    card_icon: "fa-solid fa-phone",
    card_info_text: "+91 99108 77219",
    card_info_link: "tel:+919910877219",
    card_btn_text: "Call Now",
    card_btn_link: "tel:+919910877219",
    card_badge: "",
    sort_order: 1
  },
  {
    card_title: "Email Support",
    card_subtitle: "Send your questions to our support team.",
    card_icon: "fa-solid fa-envelope",
    card_info_text: "support@bilabadi.com",
    card_info_link: "mailto:support@bilabadi.com",
    card_btn_text: "Email Us",
    card_btn_link: "mailto:support@bilabadi.com",
    card_badge: "",
    sort_order: 2
  },
  {
    card_title: "Visit Our Office",
    card_subtitle: "Meet our team in person for personalized assistance.",
    card_icon: "fa-solid fa-location-dot",
    card_info_text: "Gurgaon, Haryana",
    card_info_link: "#mapSection",
    card_btn_text: "Get Directions",
    card_btn_link: "#mapSection",
    card_badge: "",
    sort_order: 3
  },
  {
    card_title: "Working Hours",
    card_subtitle: "Monday – Saturday: 9:00 AM – 6:00 PM",
    card_icon: "fa-solid fa-clock",
    card_info_text: "9:00 AM – 6:00 PM",
    card_info_link: "",
    card_btn_text: "Sunday Closed",
    card_btn_link: "",
    card_badge: "Sunday Closed",
    sort_order: 4
  }
];

const DEFAULT_LOCATIONS = [
  {
    location_title: "Head Office",
    city_state: "Bhubaneswar, Odisha",
    address: "Plot No: 1632/15509, Khata No: 1330/10531, Satya Vihar, Rasulgarh, Bhubaneswar, Odisha - 751017",
    phone: "+91 99108 77219",
    image: "assets/city_delhi.jpg",
    map_query: "Plot No: 1632/15509, Khata No: 1330/10531, Satya Vihar, Rasulgarh, Bhubaneswar, Odisha - 751017+122011",
    sort_order: 1
  },
  {
    location_title: "Branch Office",
    city_state: "Bhubaneswar, Odisha",
    address: "4th Floor, New Annex Building Arch Bishop's House, Satya Nagar, Bhubaneswar, Odisha 751007",
    phone: "+91 99108 77219",
    image: "assets/banner_land_sale.webp",
    map_query: "4th Floor, New Annex Building Arch Bishop's House, Satya Nagar, Bhubaneswar, Odisha 751007",
    sort_order: 2
  }
];

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
    trust_features: parseJsonField(row.trust_features)
  };
};

const ensureContactUsTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS contact_us (
        id INT AUTO_INCREMENT PRIMARY KEY,
        record_type VARCHAR(50) NOT NULL DEFAULT 'card',
        hero_badge VARCHAR(255) DEFAULT NULL,
        hero_title VARCHAR(255) DEFAULT NULL,
        hero_subtitle TEXT DEFAULT NULL,
        hero_image VARCHAR(500) DEFAULT NULL,
        hero_feature_1 VARCHAR(255) DEFAULT NULL,
        hero_feature_2 VARCHAR(255) DEFAULT NULL,
        hero_feature_3 VARCHAR(255) DEFAULT NULL,
        help_title VARCHAR(255) DEFAULT NULL,
        help_subtitle TEXT DEFAULT NULL,
        operating_title VARCHAR(255) DEFAULT NULL,
        operating_days VARCHAR(255) DEFAULT NULL,
        operating_hours VARCHAR(255) DEFAULT NULL,
        operating_sunday VARCHAR(255) DEFAULT NULL,
        operating_sunday_status VARCHAR(255) DEFAULT NULL,
        urgent_help_label VARCHAR(255) DEFAULT NULL,
        urgent_help_email VARCHAR(255) DEFAULT NULL,
        urgent_help_link VARCHAR(500) DEFAULT NULL,
        locations_label VARCHAR(255) DEFAULT NULL,
        map_embed_url TEXT DEFAULT NULL,
        map_address TEXT DEFAULT NULL,
        map_rating VARCHAR(50) DEFAULT NULL,
        map_reviews_count VARCHAR(50) DEFAULT NULL,
        map_open_url TEXT DEFAULT NULL,
        trust_features TEXT DEFAULT NULL,
        cta_title VARCHAR(255) DEFAULT NULL,
        cta_desc TEXT DEFAULT NULL,
        cta_btn1_text VARCHAR(255) DEFAULT NULL,
        cta_btn1_link VARCHAR(500) DEFAULT NULL,
        cta_btn2_text VARCHAR(255) DEFAULT NULL,
        cta_btn2_link VARCHAR(500) DEFAULT NULL,
        card_title VARCHAR(255) DEFAULT NULL,
        card_subtitle TEXT DEFAULT NULL,
        card_icon VARCHAR(100) DEFAULT NULL,
        card_info_text VARCHAR(255) DEFAULT NULL,
        card_info_link VARCHAR(500) DEFAULT NULL,
        card_btn_text VARCHAR(255) DEFAULT NULL,
        card_btn_link VARCHAR(500) DEFAULT NULL,
        card_badge VARCHAR(100) DEFAULT NULL,
        location_title VARCHAR(255) DEFAULT NULL,
        city_state VARCHAR(255) DEFAULT NULL,
        address TEXT DEFAULT NULL,
        phone VARCHAR(100) DEFAULT NULL,
        image VARCHAR(500) DEFAULT NULL,
        map_query TEXT DEFAULT NULL,
        sort_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        client_name VARCHAR(255) DEFAULT NULL,
        client_email VARCHAR(255) DEFAULT NULL,
        client_phone VARCHAR(30) DEFAULT NULL,
        interested_service VARCHAR(255) DEFAULT NULL,
        subject VARCHAR(255) DEFAULT NULL,
        message TEXT DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure record_type is VARCHAR(50)
    try {
      await db.query(`ALTER TABLE contact_us MODIFY COLUMN record_type VARCHAR(50) NOT NULL DEFAULT 'card'`);
    } catch (e) {}

    // Check columns and add missing ones
    const extraCols = [
      { name: "hero_badge", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "hero_title", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "hero_subtitle", type: "TEXT DEFAULT NULL" },
      { name: "hero_image", type: "VARCHAR(500) DEFAULT NULL" },
      { name: "hero_feature_1", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "hero_feature_2", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "hero_feature_3", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "help_title", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "help_subtitle", type: "TEXT DEFAULT NULL" },
      { name: "operating_title", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "operating_days", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "operating_hours", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "operating_sunday", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "operating_sunday_status", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "urgent_help_label", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "urgent_help_email", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "urgent_help_link", type: "VARCHAR(500) DEFAULT NULL" },
      { name: "locations_label", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "map_embed_url", type: "TEXT DEFAULT NULL" },
      { name: "map_address", type: "TEXT DEFAULT NULL" },
      { name: "map_rating", type: "VARCHAR(50) DEFAULT NULL" },
      { name: "map_reviews_count", type: "VARCHAR(50) DEFAULT NULL" },
      { name: "map_open_url", type: "TEXT DEFAULT NULL" },
      { name: "trust_features", type: "TEXT DEFAULT NULL" },
      { name: "cta_title", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "cta_desc", type: "TEXT DEFAULT NULL" },
      { name: "cta_btn1_text", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "cta_btn1_link", type: "VARCHAR(500) DEFAULT NULL" },
      { name: "cta_btn2_text", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "cta_btn2_link", type: "VARCHAR(500) DEFAULT NULL" },
      { name: "card_title", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "card_subtitle", type: "TEXT DEFAULT NULL" },
      { name: "card_icon", type: "VARCHAR(100) DEFAULT NULL" },
      { name: "card_info_text", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "card_info_link", type: "VARCHAR(500) DEFAULT NULL" },
      { name: "card_btn_text", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "card_btn_link", type: "VARCHAR(500) DEFAULT NULL" },
      { name: "card_badge", type: "VARCHAR(100) DEFAULT NULL" },
      { name: "location_title", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "city_state", type: "VARCHAR(255) DEFAULT NULL" },
      { name: "address", type: "TEXT DEFAULT NULL" },
      { name: "phone", type: "VARCHAR(100) DEFAULT NULL" },
      { name: "image", type: "VARCHAR(500) DEFAULT NULL" },
      { name: "map_query", type: "TEXT DEFAULT NULL" },
      { name: "sort_order", type: "INT DEFAULT 0" },
      { name: "is_active", type: "TINYINT(1) DEFAULT 1" }
    ];

    const [columns] = await db.query("SHOW COLUMNS FROM contact_us");
    const existingColNames = new Set(columns.map(c => c.Field.toLowerCase()));

    for (const col of extraCols) {
      if (!existingColNames.has(col.name.toLowerCase())) {
        try {
          await db.query(`ALTER TABLE contact_us ADD COLUMN ${col.name} ${col.type}`);
        } catch (alterErr) {}
      }
    }

    // Seed initial settings if empty
    const [settings] = await db.execute("SELECT id FROM contact_us WHERE record_type = 'settings' LIMIT 1");
    if (!settings.length) {
      await db.execute(
        `INSERT INTO contact_us (
          record_type, hero_badge, hero_title, hero_subtitle, hero_image,
          hero_feature_1, hero_feature_2, hero_feature_3,
          help_title, help_subtitle,
          operating_title, operating_days, operating_hours, operating_sunday, operating_sunday_status,
          urgent_help_label, urgent_help_email, urgent_help_link,
          locations_label,
          map_embed_url, map_address, map_rating, map_reviews_count, map_open_url,
          trust_features,
          cta_title, cta_desc, cta_btn1_text, cta_btn1_link, cta_btn2_text, cta_btn2_link
        ) VALUES (
          'settings', ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?,
          ?, ?, ?, ?, ?,
          ?,
          ?, ?, ?, ?, ?, ?
        )`,
        [
          DEFAULT_CONTACT_SETTINGS.hero_badge,
          DEFAULT_CONTACT_SETTINGS.hero_title,
          DEFAULT_CONTACT_SETTINGS.hero_subtitle,
          DEFAULT_CONTACT_SETTINGS.hero_image,
          DEFAULT_CONTACT_SETTINGS.hero_feature_1,
          DEFAULT_CONTACT_SETTINGS.hero_feature_2,
          DEFAULT_CONTACT_SETTINGS.hero_feature_3,
          DEFAULT_CONTACT_SETTINGS.help_title,
          DEFAULT_CONTACT_SETTINGS.help_subtitle,
          DEFAULT_CONTACT_SETTINGS.operating_title,
          DEFAULT_CONTACT_SETTINGS.operating_days,
          DEFAULT_CONTACT_SETTINGS.operating_hours,
          DEFAULT_CONTACT_SETTINGS.operating_sunday,
          DEFAULT_CONTACT_SETTINGS.operating_sunday_status,
          DEFAULT_CONTACT_SETTINGS.urgent_help_label,
          DEFAULT_CONTACT_SETTINGS.urgent_help_email,
          DEFAULT_CONTACT_SETTINGS.urgent_help_link,
          DEFAULT_CONTACT_SETTINGS.locations_label,
          DEFAULT_CONTACT_SETTINGS.map_embed_url,
          DEFAULT_CONTACT_SETTINGS.map_address,
          DEFAULT_CONTACT_SETTINGS.map_rating,
          DEFAULT_CONTACT_SETTINGS.map_reviews_count,
          DEFAULT_CONTACT_SETTINGS.map_open_url,
          DEFAULT_CONTACT_SETTINGS.trust_features,
          DEFAULT_CONTACT_SETTINGS.cta_title,
          DEFAULT_CONTACT_SETTINGS.cta_desc,
          DEFAULT_CONTACT_SETTINGS.cta_btn1_text,
          DEFAULT_CONTACT_SETTINGS.cta_btn1_link,
          DEFAULT_CONTACT_SETTINGS.cta_btn2_text,
          DEFAULT_CONTACT_SETTINGS.cta_btn2_link
        ]
      );
    }

    // Seed initial help cards if empty
    const [cards] = await db.execute("SELECT id FROM contact_us WHERE record_type = 'card' LIMIT 1");
    if (!cards.length) {
      for (const c of DEFAULT_HELP_CARDS) {
        await db.execute(
          `INSERT INTO contact_us (
            record_type, card_title, card_subtitle, card_icon, card_info_text,
            card_info_link, card_btn_text, card_btn_link, card_badge, sort_order, is_active
          ) VALUES ('card', ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            c.card_title,
            c.card_subtitle,
            c.card_icon,
            c.card_info_text,
            c.card_info_link,
            c.card_btn_text,
            c.card_btn_link,
            c.card_badge || null,
            c.sort_order
          ]
        );
      }
    }

    // Seed initial locations if empty
    const [locations] = await db.execute("SELECT id FROM contact_us WHERE record_type = 'location' LIMIT 1");
    if (!locations.length) {
      for (const loc of DEFAULT_LOCATIONS) {
        await db.execute(
          `INSERT INTO contact_us (
            record_type, location_title, city_state, address, phone,
            image, map_query, sort_order, is_active
          ) VALUES ('location', ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            loc.location_title,
            loc.city_state,
            loc.address,
            loc.phone,
            loc.image,
            loc.map_query,
            loc.sort_order
          ]
        );
      }
    }
  } catch (e) {
    console.warn("contact_us table check warning:", e.message);
  }
};

// GET: All contact us data (settings, cards, locations, inquiries)
export const getContactPageData = async (req, res) => {
  try {
    await ensureContactUsTable();

    const [settings] = await db.execute(
      "SELECT * FROM contact_us WHERE record_type = 'settings' ORDER BY id ASC LIMIT 1"
    );

    const [cards] = await db.execute(
      "SELECT * FROM contact_us WHERE record_type = 'card' ORDER BY sort_order ASC, id ASC"
    );

    const [locations] = await db.execute(
      "SELECT * FROM contact_us WHERE record_type = 'location' ORDER BY sort_order ASC, id ASC"
    );

    const [inquiries] = await db.execute(
      "SELECT * FROM contact_us WHERE record_type = 'inquiry' ORDER BY id DESC"
    );

    const settingsData = settings.length ? formatSettingsRow(settings[0]) : DEFAULT_CONTACT_SETTINGS;

    res.status(200).json({
      success: true,
      settings: settingsData,
      cards: cards.length ? cards : DEFAULT_HELP_CARDS,
      locations: locations.length ? locations : DEFAULT_LOCATIONS,
      inquiries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// PUT / POST: Update contact settings & page sections
export const updateContactSettings = async (req, res) => {
  try {
    await ensureContactUsTable();
    const body = req.body || {};

    let uploadedHeroImage = null;
    if (req.file) {
      uploadedHeroImage = `/uploads/contact/${req.file.filename}`;
    } else if (req.files) {
      const filesList = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      for (const f of filesList) {
        if (f.fieldname === "hero_image" || f.fieldname === "hero_img") {
          uploadedHeroImage = `/uploads/contact/${f.filename}`;
        }
      }
    }

    const [existing] = await db.execute(
      "SELECT * FROM contact_us WHERE record_type = 'settings' ORDER BY id ASC LIMIT 1"
    );

    const prev = existing.length ? existing[0] : DEFAULT_CONTACT_SETTINGS;

    const hero_badge = body.hero_badge !== undefined ? body.hero_badge : prev.hero_badge;
    const hero_title = body.hero_title !== undefined ? body.hero_title : prev.hero_title;
    const hero_subtitle = body.hero_subtitle !== undefined ? body.hero_subtitle : prev.hero_subtitle;
    const hero_image = uploadedHeroImage || (body.hero_image !== undefined ? body.hero_image : prev.hero_image);
    const hero_feature_1 = body.hero_feature_1 !== undefined ? body.hero_feature_1 : prev.hero_feature_1;
    const hero_feature_2 = body.hero_feature_2 !== undefined ? body.hero_feature_2 : prev.hero_feature_2;
    const hero_feature_3 = body.hero_feature_3 !== undefined ? body.hero_feature_3 : prev.hero_feature_3;

    const help_title = body.help_title !== undefined ? body.help_title : prev.help_title;
    const help_subtitle = body.help_subtitle !== undefined ? body.help_subtitle : prev.help_subtitle;

    const operating_title = body.operating_title !== undefined ? body.operating_title : prev.operating_title;
    const operating_days = body.operating_days !== undefined ? body.operating_days : prev.operating_days;
    const operating_hours = body.operating_hours !== undefined ? body.operating_hours : prev.operating_hours;
    const operating_sunday = body.operating_sunday !== undefined ? body.operating_sunday : prev.operating_sunday;
    const operating_sunday_status = body.operating_sunday_status !== undefined ? body.operating_sunday_status : prev.operating_sunday_status;
    const urgent_help_label = body.urgent_help_label !== undefined ? body.urgent_help_label : prev.urgent_help_label;
    const urgent_help_email = body.urgent_help_email !== undefined ? body.urgent_help_email : prev.urgent_help_email;
    const urgent_help_link = body.urgent_help_link !== undefined ? body.urgent_help_link : prev.urgent_help_link;

    const locations_label = body.locations_label !== undefined ? body.locations_label : prev.locations_label;

    const map_embed_url = body.map_embed_url !== undefined ? body.map_embed_url : prev.map_embed_url;
    const map_address = body.map_address !== undefined ? body.map_address : prev.map_address;
    const map_rating = body.map_rating !== undefined ? body.map_rating : prev.map_rating;
    const map_reviews_count = body.map_reviews_count !== undefined ? body.map_reviews_count : prev.map_reviews_count;
    const map_open_url = body.map_open_url !== undefined ? body.map_open_url : prev.map_open_url;

    let trust_features = prev.trust_features;
    if (body.trust_features !== undefined) {
      trust_features = typeof body.trust_features === "object" ? JSON.stringify(body.trust_features) : body.trust_features;
    }

    const cta_title = body.cta_title !== undefined ? body.cta_title : prev.cta_title;
    const cta_desc = body.cta_desc !== undefined ? body.cta_desc : prev.cta_desc;
    const cta_btn1_text = body.cta_btn1_text !== undefined ? body.cta_btn1_text : prev.cta_btn1_text;
    const cta_btn1_link = body.cta_btn1_link !== undefined ? body.cta_btn1_link : prev.cta_btn1_link;
    const cta_btn2_text = body.cta_btn2_text !== undefined ? body.cta_btn2_text : prev.cta_btn2_text;
    const cta_btn2_link = body.cta_btn2_link !== undefined ? body.cta_btn2_link : prev.cta_btn2_link;

    if (existing.length) {
      await db.execute(
        `UPDATE contact_us SET
          hero_badge = ?, hero_title = ?, hero_subtitle = ?, hero_image = ?,
          hero_feature_1 = ?, hero_feature_2 = ?, hero_feature_3 = ?,
          help_title = ?, help_subtitle = ?,
          operating_title = ?, operating_days = ?, operating_hours = ?, operating_sunday = ?, operating_sunday_status = ?,
          urgent_help_label = ?, urgent_help_email = ?, urgent_help_link = ?,
          locations_label = ?,
          map_embed_url = ?, map_address = ?, map_rating = ?, map_reviews_count = ?, map_open_url = ?,
          trust_features = ?,
          cta_title = ?, cta_desc = ?, cta_btn1_text = ?, cta_btn1_link = ?, cta_btn2_text = ?, cta_btn2_link = ?
        WHERE id = ?`,
        [
          hero_badge, hero_title, hero_subtitle, hero_image,
          hero_feature_1, hero_feature_2, hero_feature_3,
          help_title, help_subtitle,
          operating_title, operating_days, operating_hours, operating_sunday, operating_sunday_status,
          urgent_help_label, urgent_help_email, urgent_help_link,
          locations_label,
          map_embed_url, map_address, map_rating, map_reviews_count, map_open_url,
          trust_features,
          cta_title, cta_desc, cta_btn1_text, cta_btn1_link, cta_btn2_text, cta_btn2_link,
          existing[0].id
        ]
      );
    } else {
      await db.execute(
        `INSERT INTO contact_us (
          record_type, hero_badge, hero_title, hero_subtitle, hero_image,
          hero_feature_1, hero_feature_2, hero_feature_3,
          help_title, help_subtitle,
          operating_title, operating_days, operating_hours, operating_sunday, operating_sunday_status,
          urgent_help_label, urgent_help_email, urgent_help_link,
          locations_label,
          map_embed_url, map_address, map_rating, map_reviews_count, map_open_url,
          trust_features,
          cta_title, cta_desc, cta_btn1_text, cta_btn1_link, cta_btn2_text, cta_btn2_link
        ) VALUES (
          'settings', ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?,
          ?, ?, ?, ?, ?,
          ?,
          ?, ?, ?, ?, ?, ?
        )`,
        [
          hero_badge, hero_title, hero_subtitle, hero_image,
          hero_feature_1, hero_feature_2, hero_feature_3,
          help_title, help_subtitle,
          operating_title, operating_days, operating_hours, operating_sunday, operating_sunday_status,
          urgent_help_label, urgent_help_email, urgent_help_link,
          locations_label,
          map_embed_url, map_address, map_rating, map_reviews_count, map_open_url,
          trust_features,
          cta_title, cta_desc, cta_btn1_text, cta_btn1_link, cta_btn2_text, cta_btn2_link
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: "Contact settings updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// POST: Create a Help Card
export const createContactCard = async (req, res) => {
  try {
    await ensureContactUsTable();
    const body = req.body || {};

    const [result] = await db.execute(
      `INSERT INTO contact_us (
        record_type, card_title, card_subtitle, card_icon, card_info_text,
        card_info_link, card_btn_text, card_btn_link, card_badge, sort_order, is_active
      ) VALUES ('card', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.card_title || "New Help Option",
        body.card_subtitle || "",
        body.card_icon || "fa-solid fa-headset",
        body.card_info_text || "",
        body.card_info_link || "",
        body.card_btn_text || "Contact Now",
        body.card_btn_link || "",
        body.card_badge || null,
        body.sort_order || 0,
        body.is_active ?? 1
      ]
    );

    res.status(201).json({
      success: true,
      message: "Help card created successfully",
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT: Update a Help Card
export const updateContactCard = async (req, res) => {
  try {
    await ensureContactUsTable();
    const body = req.body || {};
    const cardId = req.params.id;

    await db.execute(
      `UPDATE contact_us SET
        card_title = ?, card_subtitle = ?, card_icon = ?, card_info_text = ?,
        card_info_link = ?, card_btn_text = ?, card_btn_link = ?, card_badge = ?,
        sort_order = ?, is_active = ?
      WHERE id = ? AND record_type = 'card'`,
      [
        body.card_title || "Help Option",
        body.card_subtitle || "",
        body.card_icon || "fa-solid fa-headset",
        body.card_info_text || "",
        body.card_info_link || "",
        body.card_btn_text || "Contact Now",
        body.card_btn_link || "",
        body.card_badge || null,
        body.sort_order || 0,
        body.is_active ?? 1,
        cardId
      ]
    );

    res.status(200).json({ success: true, message: "Help card updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE: Remove a Help Card
export const deleteContactCard = async (req, res) => {
  try {
    await ensureContactUsTable();
    await db.execute("DELETE FROM contact_us WHERE id = ? AND record_type = 'card'", [req.params.id]);
    res.status(200).json({ success: true, message: "Help card deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST: Create an Office Location
export const createContactLocation = async (req, res) => {
  try {
    await ensureContactUsTable();
    const body = req.body || {};

    let uploadedImage = null;
    if (req.file) {
      uploadedImage = `/uploads/contact/${req.file.filename}`;
    } else if (req.files) {
      const filesList = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      if (filesList.length > 0) {
        uploadedImage = `/uploads/contact/${filesList[0].filename}`;
      }
    }

    const image = uploadedImage || body.image || "assets/city_delhi.jpg";

    const [result] = await db.execute(
      `INSERT INTO contact_us (
        record_type, location_title, city_state, address, phone,
        image, map_query, sort_order, is_active
      ) VALUES ('location', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.location_title || "Branch Office",
        body.city_state || "Bhubaneswar, Odisha",
        body.address || "",
        body.phone || "+91 99108 77219",
        image,
        body.map_query || body.address || "",
        body.sort_order || 0,
        body.is_active ?? 1
      ]
    );

    res.status(201).json({
      success: true,
      message: "Office location created successfully",
      id: result.insertId,
      image
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT: Update an Office Location
export const updateContactLocation = async (req, res) => {
  try {
    await ensureContactUsTable();
    const body = req.body || {};
    const locId = req.params.id;

    let uploadedImage = null;
    if (req.file) {
      uploadedImage = `/uploads/contact/${req.file.filename}`;
    } else if (req.files) {
      const filesList = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      if (filesList.length > 0) {
        uploadedImage = `/uploads/contact/${filesList[0].filename}`;
      }
    }

    const [existing] = await db.execute(
      "SELECT image FROM contact_us WHERE id = ? AND record_type = 'location'",
      [locId]
    );

    const prevImage = existing.length ? existing[0].image : "assets/city_delhi.jpg";
    const image = uploadedImage || body.image || prevImage;

    await db.execute(
      `UPDATE contact_us SET
        location_title = ?, city_state = ?, address = ?, phone = ?,
        image = ?, map_query = ?, sort_order = ?, is_active = ?
      WHERE id = ? AND record_type = 'location'`,
      [
        body.location_title || "Office",
        body.city_state || "",
        body.address || "",
        body.phone || "",
        image,
        body.map_query || body.address || "",
        body.sort_order || 0,
        body.is_active ?? 1,
        locId
      ]
    );

    res.status(200).json({ success: true, message: "Office location updated successfully", image });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE: Remove an Office Location
export const deleteContactLocation = async (req, res) => {
  try {
    await ensureContactUsTable();
    await db.execute("DELETE FROM contact_us WHERE id = ? AND record_type = 'location'", [req.params.id]);
    res.status(200).json({ success: true, message: "Office location deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST: Submit a client inquiry from contact-us.html
export const submitInquiry = async (req, res) => {
  try {
    await ensureContactUsTable();
    const body = req.body || {};

    const client_name = (body.client_name || body.name || body.firstName || "").trim();
    const client_email = (body.client_email || body.email || "").trim();
    const client_phone = (body.client_phone || body.phone || "").trim();
    const interested_service = (body.interested_service || body.service || "").trim();
    const subject = (body.subject || "Contact Form Inquiry").trim();
    const message = (body.message || body.msg || "").trim();

    if (!client_name || !client_email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required"
      });
    }

    const [result] = await db.execute(
      `INSERT INTO contact_us (
        record_type, client_name, client_email, client_phone,
        interested_service, subject, message, status
      ) VALUES ('inquiry', ?, ?, ?, ?, ?, ?, 'new')`,
      [client_name, client_email, client_phone, interested_service, subject, message]
    );

    res.status(201).json({
      success: true,
      message: "Thank you! Your message has been sent successfully.",
      inquiry_id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT: Update inquiry status (new, contacted, resolved)
export const updateInquiryStatus = async (req, res) => {
  try {
    await ensureContactUsTable();
    const { status } = req.body;
    await db.execute(
      "UPDATE contact_us SET status = ? WHERE id = ? AND record_type = 'inquiry'",
      [status || "contacted", req.params.id]
    );
    res.status(200).json({ success: true, message: "Inquiry status updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE: Remove an inquiry
export const deleteInquiry = async (req, res) => {
  try {
    await ensureContactUsTable();
    await db.execute("DELETE FROM contact_us WHERE id = ? AND record_type = 'inquiry'", [req.params.id]);
    res.status(200).json({ success: true, message: "Inquiry deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
