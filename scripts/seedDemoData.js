import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(scriptDir, "..");
dotenv.config({ path: path.join(backendDir, ".env") });

const { default: connectDB } = await import("../config/db.js");
const { default: cloudinary } = await import("../config/cloudinary.js");
const { default: User } = await import("../models/User.js");
const { default: Restaurant } = await import("../models/Restaurant.js");
const { default: MenuItem } = await import("../models/MenuItem.js");

const DEMO_DOMAIN = "letseat.demo";
const CACHE_PATH = path.join(scriptDir, ".seed-image-cache.json");
const CREDENTIALS_PATH = path.join(scriptDir, "demo-credentials.txt");
const dryRun = process.argv.includes("--dry-run");
const resetDemo = process.argv.includes("--reset-demo");
const fixOtherCategories = process.argv.includes("--fix-other-categories");
const fixImages = process.argv.includes("--fix-images");
const confirmed = process.argv.includes("--confirm");

const sourcePhotoPools = {
  restaurant: ["958547", "5903389", "5056623", "31969434", "4570082", "33731584", "34902493", "30392962", "1517248135467-4c7edcad34c4", "1544145945-f90425340c7e", "1559339352-11d0357c1a8", "1556911220-e15b29be8c8f"],
  northIndian: ["36388454", "8818667", "5410418", "34080434", "37219215", "8818723", "4570082", "35985960", "36854500", "39815346", "618491", "29148133"],
  southIndian: ["1589302168068-964664d93dc0", "1601050690597-df0568f70950", "1601050690117-94f5f6fa8bd7", "1631515242808-497c3fbd3972", "1631452180519-c014fe946bc7", "1476224203421-9ac39bcb3327", "1504674900247-0877df9cc836", "1498837167922-ddd27525d352", "1543339308-43e59d6b73a6", "1543353071-10c8ba85a904", "1540189549336-e6e99c3679fe", "1543362906-acfc16c67564"],
  chinese: ["1585032226651-759b368d7246", "1617093727343-374698b1b08d", "1603133872878-684f208fb84b", "1585238342024-78d387f4a707", "1603894584373-5ac82b2ae398", "1625944525533-473f1a3d54e7", "1626082927389-6cd097cdc6ec", "1626074353765-517a681e40be", "1626645738196-c2a7c87a8f58", "1627662168223-7df99068099b", "1632778149955-e80f8ceca2e8", "1604908176997-125f25cc6f3d"],
  pizza: ["6068717", "5903382", "31596394", "9685264", "9993754", "36178132", "19786235", "31587831", "32763320", "34718116", "5903315", "31094832"],
  biryani: ["36388454", "8818667", "5410418", "34080434", "37219215", "8818723", "4570082", "35985960", "36854500", "39815346", "618491", "29148133"],
  burger: ["5179783", "5374419", "40294660", "9207184", "34973505", "8202811", "28902883", "4315148", "28736404", "15010285", "5488052", "38908865"],
  dessert: ["18784859", "1123252", "18580208", "14996603", "15062601", "18416956", "37124654", "16544183", "19314163", "39585674", "4187673", "7134298"],
  healthy: ["34902493", "6065181", "19150338", "4828100", "4828098", "13803823", "5337687", "4099231", "842545", "13350112", "4828105", "4828104"],
  chaat: ["1601050690117-94f5f6fa8bd7", "1601050690597-df0568f70950", "1631515242808-497c3fbd3972", "1631452180519-c014fe946bc7", "1476224203421-9ac39bcb3327", "1504674900247-0877df9cc836", "1498837167922-ddd27525d352", "1543339308-43e59d6b73a6", "1543353071-10c8ba85a904", "1540189549336-e6e99c3679fe", "1543362906-acfc16c67564", "1547592180-85f173990554"],
  mughlai: ["1529042410759-befb1204b468", "1544025162-d76694265947", "1588168333986-40e981c0c6a9", "1603894584373-5ac82b2ae398", "1626082927389-6cd097cdc6ec", "1626074353765-517a681e40be", "1626645738196-c2a7c87a8f58", "1631452180519-c014fe946bc7", "1632778149955-e80f8ceca2e8", "1604908176997-125f25cc6f3d", "1590080875515-8a3a8dc5735e", "1586190848861-99aa4a171e90"],
  rolls: ["1626700051175-6818013e1d4f", "1551892374-ecf8754cf8b0", "1551782450-a2132b4ba21d", "1568901346375-23c9450c58cd", "1586190848861-99aa4a171e90", "1593560708920-61dd98c8c8f0", "1594007654729-407eedc4be65", "1606851094655-b259c4ba3c13", "1617093727343-374698b1b08d", "1625944525533-473f1a3d54e7", "1627662168223-7df99068099b", "1550547660-d9450f859349"],
  beverage: ["3948523", "28010210", "6463666", "28010208", "4557152", "4234510", "11299733", "39948188", "5005919", "8743863", "33694865", "28525198"],
};
sourcePhotoPools.generalFood = [
  ...new Set(
    Object.entries(sourcePhotoPools)
      .filter(([key]) => key !== "restaurant" && key !== "generalFood")
      .flatMap(([, values]) => values),
  ),
];

const restaurants = [
  ["Saffron Courtyard", "North Indian", "Sector 29, Gurugram", "122001", "122002", 30, 4.4, 68, "northIndian"],
  ["Dakshin Dabba", "South Indian", "Sushant Lok 1, Gurugram", "122009", "122010", 25, 4.2, 45, "southIndian"],
  ["Jade Wok House", "Chinese", "Sector 56, Gurugram", "122011", "122003", 35, 4.1, 39, "chinese"],
  ["Olive Ember Kitchen", "Pizza & Italian", "Golf Course Road, Gurugram", "122018", "122001", 28, 4.5, 82, "pizza"],
  ["Dum Pukht Junction", "Biryani", "Sector 14, Gurugram", "122001", "122002", 32, 4.6, 74, "biryani"],
  ["Stacked Street Co.", "Burgers & Fast Food", "Sector 49, Gurugram", "122018", "122001", 24, 4.0, 27, "burger"],
  ["Whisk & Crumb", "Desserts & Bakery", "Sector 31, Gurugram", "122001", "122009", 26, 4.3, 51, "dessert"],
  ["Green Grain Lab", "Healthy Bowls", "DLF Phase 4, Gurugram", "122009", "122010", 30, 4.2, 33, "healthy"],
  ["Tawa Tales", "Chaat & Street Food", "Sector 15 Market, Gurugram", "122001", "122003", 22, 3.9, 18, "chaat"],
  ["Silk Route Handi", "Mughlai", "Sector 40, Gurugram", "122018", "122001", 38, 4.5, 61, "mughlai"],
  ["Kathi Craft", "Rolls & Wraps", "Sector 46, Gurugram", "122003", "122001", 27, 4.0, 24, "rolls"],
  ["Froth & Fruit Bar", "Beverages & Shakes", "Sector 22, Gurugram", "122001", "122002", 20, 4.1, 29, "beverage"],
].map((item, index) => ({
  name: item[0],
  cuisine: item[1],
  address: item[2],
  pincodes: [item[3], item[4], index % 2 === 0 ? "122010" : "122009"],
  contact: `98100${String(12000 + index).slice(-5)}`,
  preparationTime: item[5],
  rating: item[6],
  totalRatings: item[7],
  imageKey: item[8],
  isOpen: index !== 8,
  ownerName: `${item[0]} Demo Owner`,
  ownerEmail: `owner${index + 1}@${DEMO_DOMAIN}`,
}));

const menuSets = {
  northIndian: [
    ["Paneer Tikka", "tandoori", true, "spicy", 240], ["Dal Makhani", "dal", true, "mild", 190], ["Butter Chicken", "curry", false, "medium", 320],
    ["Amritsari Fish", "starter", false, "spicy", 290], ["Garlic Naan", "naan", true, "mild", 70], ["Lachha Paratha", "paratha", true, "mild", 110],
    ["Chole Bhature", "chole", true, "medium", 180], ["Kadhai Paneer", "curry", true, "spicy", 230], ["Jeera Rice", "rice", true, "mild", 150],
    ["Mango Lassi", "beverage", true, "mild", 120], ["Gulab Jamun", "dessert", true, "mild", 95], ["Tandoori Chicken", "tandoori", false, "spicy", 350],
  ],
  southIndian: [
    ["Masala Dosa", "dosa", true, "medium", 150], ["Idli Sambar", "idli", true, "mild", 100], ["Medu Vada", "vada", true, "mild", 110],
    ["Podi Uttapam", "uttapam", true, "spicy", 145], ["Mysore Bonda", "snack", true, "mild", 95], ["Vegetable Upma", "upma", true, "mild", 110],
    ["Ghee Roast Dosa", "dosa", true, "medium", 190], ["Chicken Chettinad", "curry", false, "spicy", 310], ["Lemon Rice", "rice", true, "mild", 130],
    ["Curd Rice", "rice", true, "mild", 120], ["Filter Coffee", "beverage", true, "mild", 80], ["Payasam", "dessert", true, "mild", 125],
  ],
  chinese: [
    ["Veg Hakka Noodles", "noodles", true, "medium", 210], ["Chilli Paneer", "starter", true, "spicy", 240], ["Veg Manchurian", "starter", true, "medium", 220],
    ["Chicken Fried Rice", "rice", false, "medium", 280], ["Schezwan Momos", "momos", true, "spicy", 180], ["Spring Rolls", "starter", true, "mild", 160],
    ["Kung Pao Chicken", "chicken", false, "spicy", 330], ["Mushroom Chilli", "starter", true, "spicy", 230], ["Burnt Garlic Rice", "rice", true, "medium", 220],
    ["Tofu Teriyaki Bowl", "rice bowl", true, "mild", 260], ["Hot & Sour Soup", "soup", true, "spicy", 140], ["Honey Chilli Potato", "starter", true, "medium", 190],
  ],
  pizza: [
    ["Margherita Pizza", "pizza", true, "mild", 299], ["Farmhouse Pizza", "pizza", true, "medium", 399], ["Pesto Penne", "pasta", true, "mild", 320],
    ["Pepperoni Pizza", "pizza", false, "medium", 449], ["Four Cheese Pizza", "pizza", true, "mild", 449], ["Arrabbiata Pasta", "pasta", true, "spicy", 290],
    ["Garlic Bread", "sides", true, "mild", 160], ["Chicken Lasagna", "pasta", false, "medium", 390], ["Bruschetta", "starter", true, "mild", 190],
    ["Mushroom Risotto", "rice", true, "mild", 340], ["Tiramisu Cup", "dessert", true, "mild", 210], ["Basil Lemonade", "beverage", true, "mild", 130],
  ],
  biryani: [
    ["Hyderabadi Veg Biryani", "biryani", true, "medium", 240], ["Chicken Dum Biryani", "biryani", false, "spicy", 330], ["Mutton Biryani", "biryani", false, "spicy", 410],
    ["Egg Biryani", "biryani", false, "medium", 270], ["Paneer Biryani", "biryani", true, "spicy", 290], ["Mirchi Ka Salan", "curry", true, "spicy", 130],
    ["Chicken 65", "starter", false, "spicy", 260], ["Seekh Kebab", "kebab", false, "spicy", 320], ["Haleem", "stew", false, "medium", 280],
    ["Double Ka Meetha", "dessert", true, "mild", 150], ["Raita", "side", true, "mild", 80], ["Irani Chai", "beverage", true, "mild", 100],
  ],
  burger: [
    ["Smoky Aloo Burger", "burger", true, "medium", 160], ["Crispy Chicken Burger", "burger", false, "spicy", 240], ["Paneer Melt Burger", "burger", true, "spicy", 220],
    ["Classic Veg Burger", "burger", true, "mild", 140], ["Peri Peri Fries", "fries", true, "spicy", 150], ["Chicken Popcorn", "snack", false, "medium", 230],
    ["Loaded Nachos", "snack", true, "medium", 210], ["BBQ Chicken Wings", "snack", false, "spicy", 290], ["Grilled Corn", "snack", true, "mild", 110],
    ["Cheese Fries", "fries", true, "mild", 180], ["Chocolate Brownie", "dessert", true, "mild", 150], ["Cold Coffee", "beverage", true, "mild", 160],
  ],
  dessert: [
    ["Belgian Chocolate Cake", "dessert", true, "mild", 220], ["Red Velvet Slice", "dessert", true, "mild", 190], ["Baked Cheesecake", "dessert", true, "mild", 240],
    ["Mango Mousse", "dessert", true, "mild", 160], ["Classic Brownie", "dessert", true, "mild", 130], ["Saffron Rasmalai", "dessert", true, "mild", 150],
    ["Blueberry Tart", "dessert", true, "mild", 210], ["Cinnamon Roll", "bakery", true, "mild", 140], ["Butter Croissant", "bakery", true, "mild", 120],
    ["Pistachio Macaron", "bakery", true, "mild", 180], ["Vanilla Cupcake", "bakery", true, "mild", 110], ["Hot Chocolate", "beverage", true, "mild", 170],
  ],
  healthy: [
    ["Paneer Protein Bowl", "bowl", true, "medium", 280], ["Chickpea Buddha Bowl", "bowl", true, "mild", 240], ["Grilled Chicken Bowl", "bowl", false, "medium", 340],
    ["Avocado Toast", "toast", true, "mild", 260], ["Quinoa Salad", "salad", true, "mild", 230], ["Tofu Teriyaki Bowl", "bowl", true, "medium", 270],
    ["Falafel Pita", "wrap", true, "medium", 220], ["Egg White Scramble", "breakfast", false, "mild", 210], ["Fruit & Granola", "breakfast", true, "mild", 180],
    ["Peanut Butter Smoothie", "smoothie", true, "mild", 190], ["Lentil Soup", "soup", true, "mild", 160], ["Green Detox Juice", "beverage", true, "mild", 150],
  ],
  chaat: [
    ["Raj Kachori", "chaat", true, "medium", 150], ["Aloo Tikki Chaat", "chaat", true, "spicy", 120], ["Pani Puri", "chaat", true, "spicy", 90],
    ["Dahi Bhalla", "chaat", true, "mild", 130], ["Papdi Chaat", "chaat", true, "medium", 120], ["Samosa", "snack", true, "spicy", 70],
    ["Kachori Sabzi", "snack", true, "spicy", 110], ["Paneer Kathi Chaat", "chaat", true, "spicy", 180], ["Masala Corn", "snack", true, "medium", 100],
    ["Chole Kulche", "chole", true, "spicy", 160], ["Jalebi", "dessert", true, "mild", 100], ["Kesar Lassi", "beverage", true, "mild", 130],
  ],
  mughlai: [
    ["Mughlai Chicken", "curry", false, "medium", 360], ["Mutton Rogan Josh", "curry", false, "spicy", 420], ["Paneer Lababdar", "curry", true, "medium", 280],
    ["Chicken Seekh Kebab", "kebab", false, "spicy", 330], ["Galouti Kebab", "kebab", false, "medium", 390], ["Nawabi Veg Korma", "curry", true, "mild", 260],
    ["Roomali Roti", "roti", true, "mild", 70], ["Sheermal", "bread", true, "mild", 110], ["Chicken Changezi", "curry", false, "spicy", 370],
    ["Mutton Korma", "curry", false, "medium", 410], ["Shahi Tukda", "dessert", true, "mild", 160], ["Mint Shikanji", "beverage", true, "mild", 100],
  ],
  rolls: [
    ["Paneer Tikka Roll", "roll", true, "spicy", 190], ["Chicken Kathi Roll", "roll", false, "medium", 240], ["Aloo Masala Wrap", "wrap", true, "medium", 140],
    ["Egg Double Roll", "roll", false, "spicy", 210], ["Mushroom Cheese Wrap", "wrap", true, "mild", 200], ["Peri Peri Chicken Wrap", "wrap", false, "spicy", 260],
    ["Falafel Roll", "roll", true, "medium", 180], ["Achari Paneer Roll", "roll", true, "spicy", 210], ["Cheese Corn Wrap", "wrap", true, "mild", 170],
    ["Mutton Seekh Roll", "roll", false, "spicy", 290], ["Masala Fries", "fries", true, "spicy", 130], ["Rose Lemonade", "beverage", true, "mild", 120],
  ],
  beverage: [
    ["Mango Shake", "shake", true, "mild", 170], ["Oreo Shake", "shake", true, "mild", 190], ["Cold Coffee", "beverage", true, "mild", 160],
    ["Strawberry Smoothie", "smoothie", true, "mild", 180], ["Banana Peanut Shake", "shake", true, "mild", 190], ["Watermelon Cooler", "beverage", true, "mild", 130],
    ["Masala Lemon Soda", "beverage", true, "medium", 100], ["Blue Lagoon", "beverage", true, "mild", 140], ["Chocolate Thick Shake", "shake", true, "mild", 210],
    ["Pineapple Juice", "juice", true, "mild", 120], ["Kesar Badam Milk", "beverage", true, "mild", 180], ["Iced Tea", "beverage", true, "mild", 110],
  ],
};

const summary = {
  usersCreated: 0,
  usersSkipped: 0,
  restaurantsCreated: 0,
  restaurantsSkipped: 0,
  menuCreated: 0,
  menuSkipped: 0,
  failed: 0,
  imagesFailed: 0,
  imagesWithoutSource: 0,
  imageRestaurantsUpdated: 0,
  imageItemsUpdated: 0,
  imageItemsWithoutSource: 0,
  imageRestaurantsWithoutSource: 0,
  categoriesFixed: 0,
};

function log(message) {
  console.log(`[seed-demo] ${message}`);
}

function parseMongoTarget() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is missing from Backend/.env.");
  let parsed;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error("MONGO_URI is not a valid MongoDB connection string.");
  }
  const host = parsed.hostname || "unknown";
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(host.toLowerCase());
  return { host, isLocal };
}

async function loadCache() {
  try {
    return JSON.parse(await fs.readFile(CACHE_PATH, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

async function saveCache(cache) {
  if (!dryRun) await fs.writeFile(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
}

function sourceUrl(photoId) {
  if (/^\d+$/.test(photoId)) {
    return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=800&q=80`;
  }
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=800&q=80`;
}

function candidatePhotoPool(poolKey) {
  return [
    ...(sourcePhotoPools[poolKey] || []),
    ...(poolKey === "generalFood" ? [] : sourcePhotoPools.generalFood),
  ].filter((value, position, values) => values.indexOf(value) === position);
}

function sourceImageUrl(poolKey, index, attempt = 0) {
  const pool = candidatePhotoPool(poolKey);
  if (pool.length === 0) return "";
  return sourceUrl(pool[(index + attempt) % pool.length]);
  if (pool.length === 0) return "";
  return sourceUrl(pool[(index + attempt) % pool.length]);
}

function shortImage(value) {
  if (!value) return "(empty)";
  const withoutQuery = value.split("?")[0];
  return withoutQuery.length > 72 ? `${withoutQuery.slice(0, 34)}...${withoutQuery.slice(-32)}` : withoutQuery;
}

async function verifyImageSource(url) {
  if (!url) throw new Error("no source URL");
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("image/")) {
    throw new Error(`content-type ${contentType || "missing"}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length <= 10 * 1024) throw new Error(`image is only ${buffer.length} bytes`);
  return {
    buffer,
    contentType: contentType.split(";")[0],
    sha256: crypto.createHash("sha256").update(buffer).digest("hex"),
  };
}

async function getImageForKey(key, poolKey, index, cache, usedHashes, maxUses, label, blockedHashes = new Set()) {
  const cached = cache[key];
  if (cached && typeof cached === "object" && cached.secureUrl && cached.sha256) {
    if (blockedHashes.has(cached.sha256) || (usedHashes.get(cached.sha256) || 0) >= maxUses) return null;
    usedHashes.set(cached.sha256, (usedHashes.get(cached.sha256) || 0) + 1);
    blockedHashes.add(cached.sha256);
    return cached;
  }
  const candidateCount = candidatePhotoPool(poolKey).length;
  for (let attempt = 0; attempt < candidateCount; attempt += 1) {
    const url = sourceImageUrl(poolKey, index, attempt);
    try {
      const verified = await verifyImageSource(url);
      if (blockedHashes.has(verified.sha256) || (usedHashes.get(verified.sha256) || 0) >= maxUses) continue;
      let secureUrl = url;
      if (!dryRun) {
        let uploadError;
        for (let uploadAttempt = 0; uploadAttempt < 2; uploadAttempt += 1) {
          try {
            secureUrl = (await cloudinary.uploader.upload(
              `data:${verified.contentType};base64,${verified.buffer.toString("base64")}`,
              { folder: "letseat-demo" },
            )).secure_url;
            uploadError = null;
            break;
          } catch (error) {
            uploadError = error;
          }
        }
        if (uploadError) throw uploadError;
      }
      const entry = { sourceUrl: url, secureUrl, sha256: verified.sha256 };
      usedHashes.set(verified.sha256, (usedHashes.get(verified.sha256) || 0) + 1);
      blockedHashes.add(verified.sha256);
      cache[key] = entry;
      return entry;
    } catch (error) {
      if (attempt === candidateCount - 1) log(`Image source failed for ${label}: ${error.message}`);
    }
  }
  summary.imagesFailed += 1;
  summary.imagesWithoutSource += 1;
  if (label.includes("/")) summary.imageItemsWithoutSource += 1;
  else summary.imageRestaurantsWithoutSource += 1;
  log(`No verified unique image available for ${label}; leaving image empty.`);
  return null;
}

async function mapWithConcurrency(items, concurrency, callback) {
  const results = [];
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await callback(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

function makeMenuItems(restaurant) {
  return menuSets[restaurant.imageKey].map((item, index) => {
    const [name, category, isVeg, spiceLevel, price] = item;
    const useVariants = [1, 4, 7, 10].includes(index);
    const data = {
      name,
      category,
      isVeg,
      spiceLevel,
      description: `${name} prepared fresh with balanced seasoning and homestyle flavour, ideal for a satisfying ${restaurant.cuisine.toLowerCase()} meal.`,
      tags: [category, isVeg ? "vegetarian" : "non-vegetarian", spiceLevel],
      allergens: category === "beverage" || category === "juice" ? [] : ["dairy"],
      imagePoolKey: restaurant.imageKey,
      imageIndex: index,
      isAvailable: !(restaurant.name === "Whisk & Crumb" && ["Pistachio Macaron", "Hot Chocolate"].includes(name)) && !(restaurant.name === "Silk Route Handi" && name === "Galouti Kebab"),
      aiGenerated: false,
    };
    if (useVariants) {
      data.variants = [
        { name: "Half", price: Math.max(50, Math.round(price * 0.65)) },
        { name: "Full", price },
      ];
    } else {
      data.price = price;
    }
    return data;
  });
}

async function ensureOwner(restaurant) {
  let owner = await User.findOne({ email: restaurant.ownerEmail });
  if (owner) {
    summary.usersSkipped += 1;
    if (dryRun) log(`Would skip existing owner ${restaurant.ownerEmail}.`);
    if (owner.role !== "restaurant_owner" && !dryRun) {
      owner.role = "restaurant_owner";
      owner.isBlocked = false;
      owner.availabilityStatus = "online";
      await owner.save();
    }
    return owner;
  }
  if (dryRun) {
    summary.usersCreated += 1;
    log(`Would create owner ${restaurant.ownerEmail}.`);
    return { _id: new mongoose.Types.ObjectId(), email: restaurant.ownerEmail };
  }
  const password = process.env.DEMO_OWNER_PASSWORD;
  if (!password) throw new Error("DEMO_OWNER_PASSWORD is missing from Backend/.env.");
  const passwordHash = await bcrypt.hash(password, 10);
  owner = await User.create({
    name: restaurant.ownerName,
    email: restaurant.ownerEmail,
    password: passwordHash,
    phone: restaurant.contact,
    role: "restaurant_owner",
    isBlocked: false,
    availabilityStatus: "online",
  });
  summary.usersCreated += 1;
  return owner;
}

async function seedRestaurant(restaurant, cache, usedHashes) {
  try {
    const owner = await ensureOwner(restaurant);
    const itemHashes = new Set();
    const restaurantHashes = new Set();
    let existing = await Restaurant.findOne({ restaurant_name: restaurant.name, ownerId: owner._id });
    if (existing) {
      summary.restaurantsSkipped += 1;
      if (dryRun) log(`Would skip existing restaurant "${restaurant.name}".`);
    } else if (dryRun) {
      summary.restaurantsCreated += 1;
      log(`Would create restaurant "${restaurant.name}" (${restaurant.cuisine}) with ${restaurant.pincodes.join(", ")}.`);
      existing = { _id: new mongoose.Types.ObjectId() };
    } else {
      const imageEntry = await getImageForKey(
        `restaurant:${restaurant.name}`,
        "restaurant",
        restaurants.findIndex((item) => item.name === restaurant.name),
        cache,
        usedHashes,
        2,
        restaurant.name,
        restaurantHashes,
      );
      existing = await Restaurant.create({
        ownerId: owner._id,
        image: imageEntry?.secureUrl || "",
        restaurant_name: restaurant.name,
        restaurant_address: restaurant.address,
        restaurant_contact: restaurant.contact,
        restaurant_deliveryPincodes: restaurant.pincodes,
        preparationTime: restaurant.preparationTime,
        isOpen: restaurant.isOpen,
        averageRating: restaurant.rating,
        totalRatings: restaurant.totalRatings,
      });
      summary.restaurantsCreated += 1;
    }

    const menuItems = makeMenuItems(restaurant);
    const existingNames = new Set((await MenuItem.find({ restaurant: existing._id }).select("name").lean()).map((item) => item.name));
    let menuCreatedForRestaurant = 0;
    let menuSkippedForRestaurant = 0;
    await mapWithConcurrency(menuItems, 3, async (item) => {
      if (existingNames.has(item.name)) {
        summary.menuSkipped += 1;
        menuSkippedForRestaurant += 1;
        return;
      }
      if (dryRun) {
        summary.menuCreated += 1;
        menuCreatedForRestaurant += 1;
        return;
      }
      const imageEntry = await getImageForKey(
        `item:${restaurant.name}:${item.name}`,
        item.imagePoolKey,
        item.imageIndex,
        cache,
        usedHashes,
        2,
        `${restaurant.name}/${item.name}`,
        itemHashes,
      );
      const { imagePoolKey, imageIndex, ...itemData } = item;
      await MenuItem.create({ ...itemData, image: imageEntry?.secureUrl || "", restaurant: existing._id });
      summary.menuCreated += 1;
      menuCreatedForRestaurant += 1;
    });
    if (dryRun) log(`Would create ${menuCreatedForRestaurant} menu items and skip ${menuSkippedForRestaurant} existing menu items for "${restaurant.name}".`);
  } catch (error) {
    summary.failed += 1;
    log(`Failed ${restaurant.name}: ${error.message}`);
  }
}

const categoryRules = [
  [/\b(pasta|macaroni|spaghetti|penne)\b/i, "pasta"], [/\bpizza\b/i, "pizza"], [/\bburger\b/i, "burger"],
  [/\bbiryani\b/i, "biryani"], [/\b(cake|ice cream|gulab|brownie|dessert|rasmalai)\b/i, "dessert"],
  [/\b(shake|lassi|juice|coffee|tea|soda|beverage)\b/i, "beverage"], [/\b(noodle|chowmein)\b/i, "noodles"],
  [/\b(momo)\b/i, "momos"], [/\b(paratha)\b/i, "paratha"], [/\b(chaat|pani puri|kachori)\b/i, "chaat"],
  [/\b(roll|wrap)\b/i, "roll"], [/\b(bowl|salad)\b/i, "bowl"], [/\b(bread|naan|roti)\b/i, "bread"],
];

async function fixCategories() {
  const items = await MenuItem.find({ category: "other" }).select("_id name category").lean();
  for (const item of items) {
    const match = categoryRules.find(([pattern]) => pattern.test(item.name));
    if (!match) continue;
    log(`${dryRun ? "Would change" : "Changing"} "${item.name}": other -> ${match[1]}`);
    if (!dryRun) await MenuItem.updateOne({ _id: item._id }, { $set: { category: match[1] } });
    summary.categoriesFixed += 1;
  }
}

async function reportInvalidPincodes() {
  const allRestaurants = await Restaurant.find({}).select("restaurant_name restaurant_deliveryPincodes").lean();
  for (const restaurant of allRestaurants) {
    const invalid = (restaurant.restaurant_deliveryPincodes || []).filter((pincode) => !/^\d{6}$/.test(String(pincode)));
    if (invalid.length) log(`Invalid delivery pincodes (not modified) for "${restaurant.restaurant_name}": ${invalid.join(", ")}`);
  }
}

async function currentImageHash(imageUrl, memo) {
  if (!imageUrl) return null;
  if (memo.has(imageUrl)) return memo.get(imageUrl);
  try {
    const verified = await verifyImageSource(imageUrl);
    memo.set(imageUrl, verified.sha256);
    return verified.sha256;
  } catch (error) {
    log(`Current image could not be verified (${shortImage(imageUrl)}): ${error.message}`);
    memo.set(imageUrl, null);
    return null;
  }
}

async function fixDemoImages(cache) {
  const demoUsers = await User.find({
    email: new RegExp(`@${DEMO_DOMAIN.replace(".", "\\.")}$`, "i"),
  }).select("_id email").lean();
  const ownerIds = demoUsers.map((user) => user._id);
  const demoRestaurants = await Restaurant.find({ ownerId: { $in: ownerIds } })
    .select("_id restaurant_name ownerId image")
    .lean();
  const restaurantIds = demoRestaurants.map((restaurant) => restaurant._id);
  const demoItems = await MenuItem.find({ restaurant: { $in: restaurantIds } })
    .select("_id restaurant name image")
    .lean();
  const itemsByRestaurant = new Map();
  for (const item of demoItems) {
    const key = item.restaurant.toString();
    if (!itemsByRestaurant.has(key)) itemsByRestaurant.set(key, []);
    itemsByRestaurant.get(key).push(item);
  }

  const allCurrentUrls = [
    ...demoRestaurants.map((restaurant) => restaurant.image).filter(Boolean),
    ...demoItems.map((item) => item.image).filter(Boolean),
  ];
  const distinctCurrentUrls = new Set(allCurrentUrls);
  log(`Current demo image URLs: ${distinctCurrentUrls.size} distinct URLs across ${allCurrentUrls.length} populated fields.`);

  const currentHashMemo = new Map();
  await mapWithConcurrency([...distinctCurrentUrls], 3, (url) => currentImageHash(url, currentHashMemo));
  const restaurantHashCounts = new Map();
  const itemHashCounts = new Map();
  const itemRestaurantHashCounts = new Map();
  for (const restaurant of demoRestaurants) {
    const hash = await currentImageHash(restaurant.image, currentHashMemo);
    if (hash) restaurantHashCounts.set(hash, (restaurantHashCounts.get(hash) || 0) + 1);
  }
  for (const item of demoItems) {
    const hash = await currentImageHash(item.image, currentHashMemo);
    if (hash) {
      itemHashCounts.set(hash, (itemHashCounts.get(hash) || 0) + 1);
      const restaurantKey = item.restaurant.toString();
      const key = `${restaurantKey}:${hash}`;
      itemRestaurantHashCounts.set(key, (itemRestaurantHashCounts.get(key) || 0) + 1);
    }
  }
  log(`Current demo content hashes: ${restaurantHashCounts.size} restaurant hashes, ${itemHashCounts.size} item hashes.`);

  const usedHashes = new Map();
  const restaurantHashes = new Set();
  const reserve = (hash) => {
    if (hash) usedHashes.set(hash, (usedHashes.get(hash) || 0) + 1);
  };
  for (const restaurant of demoRestaurants) {
    const hash = await currentImageHash(restaurant.image, currentHashMemo);
    const cacheEntry = cache[`restaurant:${restaurant.restaurant_name}`];
    if (hash && restaurantHashCounts.get(hash) === 1 && cacheEntry?.secureUrl === restaurant.image) {
      reserve(hash);
      restaurantHashes.add(hash);
    }
  }
  for (const item of demoItems) {
    const hash = await currentImageHash(item.image, currentHashMemo);
    const restaurantKey = item.restaurant.toString();
    const cacheEntry = cache[`item:${demoRestaurants.find((restaurant) => restaurant._id.toString() === restaurantKey)?.restaurant_name}:${item.name}`];
    if (hash && itemHashCounts.get(hash) <= 2 && itemRestaurantHashCounts.get(`${restaurantKey}:${hash}`) === 1 && cacheEntry?.secureUrl === item.image) reserve(hash);
  }

  const planned = [];
  for (const restaurant of demoRestaurants) {
    const restaurantIndex = restaurants.findIndex((item) => item.name === restaurant.restaurant_name);
    if (restaurantIndex < 0) continue;
    const restaurantHash = await currentImageHash(restaurant.image, currentHashMemo);
    const restaurantNeedsUpdate = !restaurant.image || !restaurantHash || restaurantHashCounts.get(restaurantHash) > 1;
    const itemPlans = [];
    const localItemHashes = new Set();
    for (const item of itemsByRestaurant.get(restaurant._id.toString()) || []) {
      const itemHash = await currentImageHash(item.image, currentHashMemo);
      const itemNeedsUpdate = !item.image || !itemHash
        || itemHashCounts.get(itemHash) > 2
        || itemRestaurantHashCounts.get(`${restaurant._id}:${itemHash}`) > 1;
      if (itemNeedsUpdate) {
        const entry = await getImageForKey(
          `item:${restaurant.restaurant_name}:${item.name}`,
          restaurants[restaurantIndex].imageKey,
          menuSets[restaurants[restaurantIndex].imageKey].findIndex((menuItem) => menuItem[0] === item.name),
          cache,
          usedHashes,
          2,
          `${restaurant.restaurant_name}/${item.name}`,
          localItemHashes,
        );
        itemPlans.push({ item, entry });
        if (!dryRun) {
          await MenuItem.updateOne({ _id: item._id }, { $set: { image: entry?.secureUrl || "" } });
        }
        summary.imageItemsUpdated += 1;
      } else {
        localItemHashes.add(itemHash);
      }
    }
    let restaurantPlan = null;
    if (restaurantNeedsUpdate) {
      restaurantPlan = await getImageForKey(
        `restaurant:${restaurant.restaurant_name}`,
        "restaurant",
        restaurantIndex,
        cache,
        usedHashes,
        2,
        restaurant.restaurant_name,
        restaurantHashes,
      );
      if (!dryRun) {
        await Restaurant.updateOne({ _id: restaurant._id }, { $set: { image: restaurantPlan?.secureUrl || "" } });
      }
      summary.imageRestaurantsUpdated += 1;
    }
    planned.push({ restaurant, restaurantPlan, restaurantNeedsUpdate, itemPlans });
  }

  for (const plan of planned) {
    log(`${plan.restaurant.restaurant_name}: current=${shortImage(plan.restaurant.image)} planned=${plan.restaurantPlan ? shortImage(plan.restaurantPlan.sourceUrl) : plan.restaurantNeedsUpdate ? "(unchanged)" : "(kept)"}`);
    if (plan.itemPlans.length) {
      log(`  items to change: ${plan.itemPlans.map(({ item, entry }) => `${item.name} -> ${entry ? shortImage(entry.sourceUrl) : "(empty)"}`).join("; ")}`);
    }
  }
  log(`Fix-images totals: restaurants to update=${summary.imageRestaurantsUpdated}, items to update=${summary.imageItemsUpdated}, items with no image=${summary.imageItemsWithoutSource}, restaurants with no image=${summary.imageRestaurantsWithoutSource}.`);
}

async function resetDemoData() {
  const demoUsers = await User.find({ email: new RegExp(`@${DEMO_DOMAIN.replace(".", "\\.")}$`, "i") }).select("_id email").lean();
  const ownerIds = demoUsers.map((user) => user._id);
  const demoRestaurants = await Restaurant.find({ ownerId: { $in: ownerIds } }).select("_id restaurant_name").lean();
  const restaurantIds = demoRestaurants.map((restaurant) => restaurant._id);
  log(`${dryRun ? "Would delete" : "Deleting"} ${restaurantIds.length} demo restaurants, their menu items, and ${demoUsers.length} demo owner users.`);
  if (!dryRun) {
    await MenuItem.deleteMany({ restaurant: { $in: restaurantIds } });
    await Restaurant.deleteMany({ _id: { $in: restaurantIds } });
    await User.deleteMany({ _id: { $in: ownerIds } });
  }
}

async function writeCredentialsFile() {
  if (dryRun) return;
  const lines = restaurants.map((restaurant) => `${restaurant.name}\n${restaurant.ownerEmail}\nPassword: see DEMO_OWNER_PASSWORD in .env`).join("\n\n");
  await fs.writeFile(CREDENTIALS_PATH, `${lines}\n`, "utf8");
}

async function main() {
  const target = parseMongoTarget();
  await connectDB();
  log(`Using database host=${mongoose.connection.host}, name=${mongoose.connection.name}`);
  if (!dryRun && !target.isLocal && !confirmed) {
    throw new Error("Refusing to write to a non-local MongoDB URI without --confirm.");
  }
  if (!dryRun && !resetDemo && !fixOtherCategories && !fixImages && !process.env.DEMO_OWNER_PASSWORD) {
    throw new Error("DEMO_OWNER_PASSWORD is missing from Backend/.env.");
  }

  if (resetDemo) await resetDemoData();
  if (fixOtherCategories) await fixCategories();
  if (fixImages) {
    const cache = await loadCache();
    await fixDemoImages(cache);
    await saveCache(cache);
  } else if (!resetDemo && !fixOtherCategories) {
    const cache = await loadCache();
    const usedHashes = new Map();
    await mapWithConcurrency(restaurants, 1, (restaurant) => seedRestaurant(restaurant, cache, usedHashes));
    await saveCache(cache);
    await writeCredentialsFile();
  }
  await reportInvalidPincodes();
  log(`Summary: users created=${summary.usersCreated}, skipped=${summary.usersSkipped}; restaurants created=${summary.restaurantsCreated}, skipped=${summary.restaurantsSkipped}; menu items created=${summary.menuCreated}, skipped=${summary.menuSkipped}; category changes=${summary.categoriesFixed}; image restaurant updates=${summary.imageRestaurantsUpdated}; image item updates=${summary.imageItemsUpdated}; items without image=${summary.imageItemsWithoutSource}; restaurants without image=${summary.imageRestaurantsWithoutSource}; image failures=${summary.imagesFailed}; failed=${summary.failed}.`);
}

try {
  await main();
} catch (error) {
  console.error(`[seed-demo] ERROR: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
