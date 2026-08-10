// Every product name/price here is exactly what's in the user's own supplied
// plan — nothing invented. Shopping categories, shopping types, and subtab
// labels are pulled verbatim from the real app's compiled code, not guessed.

export const MEAL_CATEGORIES = [
  "Fruit & Veg",
  "Meat",
  "Dairy / Fridge",
  "Chilled Meals",
  "Bakery",
  "Snacks",
  "Pantry",
  "Other",
] as const;

export const SHOPPING_LIST_TYPES = [
  "FULL RESTOCK",
  "TOP-UP SHOP",
  "CHILLED MEAL RESTOCK",
  "WORK FOOD RESTOCK",
  "SNACK RESTOCK",
] as const;

export const MEAL_SUBTABS: { id: string; label: string }[] = [
  { id: "plan", label: "Current plan" },
  { id: "chilled", label: "Chilled meals" },
  { id: "stock", label: "Pantry & coverage" },
  { id: "shopping", label: "Shopping" },
  { id: "backups", label: "Backup plans" },
];

export const FOOD_PREP_STEPS = [
  "Check work shifts ahead",
  "Check chilled meal stock",
  "Check wrap supplies",
  "Check snack-set stock",
  "Make/prepare wraps as preferred",
  "Assemble shift snack bags",
  "Add missing items to shopping list",
];

export const DEFAULT_FORWARD_GROCERY_BUDGET = 120;
export const DEFAULT_TAKEAWAY_CONVENIENCE_BUDGET = 45;

export interface PantryItemSeed {
  id?: string; // fixed id where the app logic looks it up directly (wraps/snacks)
  itemType: "CHILLED_MEAL" | "FRUIT_POUCH" | "WRAP_COMPONENT" | "SNACK_COMPONENT";
  title: string;
  category: (typeof MEAL_CATEGORIES)[number];
  /** Individual consumable units currently on hand — what coverage/snack-set
   * math uses (12 individual Le Snaks, not "1 pack"). */
  currentStock: number;
  /** How many priced units to buy — separate from currentStock, since one
   * purchase (e.g. one 12-pack) stocks many individual units. */
  purchaseQuantity: number;
  price: number;
  pricePer100g?: number;
  unitNote?: string;
}

// The 19 chilled meals — each starts at one unit in stock (one of each
// variety), matching "19 chilled meals" everywhere in the source plan.
const CHILLED_MEAL_NAMES = [
  "Woolworths Spinach & Ricotta Tortellini Napolitana Sauce Chilled Meal 350g",
  "Woolworths Spaghetti Bolognese Chilled Meal 350g",
  "Woolworths Bangers & Mash 350g",
  "Woolworths Beef Lasagne 350g",
  "Woolworths Curried Sausages & Mash 350g",
  "Woolworths Chicken Stroganoff & Rice 350g",
  "Woolworths Chicken & Leek Potato Pie 350g",
  "Woolworths Asian Teriyaki Chicken With Jasmine Rice 350g",
  "Woolworths Pork Fennel & Roasted Capsicum Penne 350g",
  "Woolworths Asian Sweet & Sour Chicken With Jasmine Rice 350g",
  "Woolworths Cottage Pie 350g",
  "Woolworths Beef Tortellini With Creamy Mushroom Sauce Chilled Meal 350g",
  "Woolworths Beef & Black Bean With Rice 350g",
  "Woolworths Asian Satay Chicken With Jasmine Rice 350g",
  "Woolworths Calorie Controlled Beef Casserole With Mash 350g",
  "Woolworths Bolognese Pasta Bake 350g",
  "Woolworths Indian Chicken Tikka Masala With Basmati Rice 350g",
  "Woolworths Indian Butter Chicken With Basmati Rice 350g",
  "Woolworths Spinach & Ricotta Cannelloni 350g",
];

const FRUIT_POUCH_FLAVOURS = [
  "Woolworths Apple Puree in Pouch 90g",
  "Woolworths Apple & Strawberry Puree in Pouch 90g",
  "Woolworths Apple & Peach Puree in Pouch 90g",
  "Woolworths Apple & Mango Puree in Pouch 90g",
];

export const PANTRY_SEED: PantryItemSeed[] = [
  ...CHILLED_MEAL_NAMES.map((title) => ({
    itemType: "CHILLED_MEAL" as const,
    title,
    category: "Chilled Meals" as const,
    currentStock: 1,
    purchaseQuantity: 1,
    price: 8.0,
  })),
  ...FRUIT_POUCH_FLAVOURS.map((title) => ({
    itemType: "FRUIT_POUCH" as const,
    title,
    category: "Pantry" as const,
    currentStock: 2,
    purchaseQuantity: 2,
    price: 0.95,
  })),
  {
    id: "stock-wraps",
    itemType: "WRAP_COMPONENT",
    title: "Woolworths White Wrap 8 Pack",
    category: "Bakery",
    currentStock: 8, // 8 individual wraps in the pack
    purchaseQuantity: 1, // 1 pack bought
    price: 2.2,
  },
  {
    itemType: "WRAP_COMPONENT",
    title: "Woolworths Greek Salad Kit 270g",
    category: "Fruit & Veg",
    currentStock: 1,
    purchaseQuantity: 1,
    price: 6.0,
  },
  {
    itemType: "WRAP_COMPONENT",
    title: "D'Orsogna Champagne Leg Ham Shaved From The Deli",
    category: "Meat",
    currentStock: 5,
    purchaseQuantity: 5, // 5 × 100g
    price: 0,
    pricePer100g: 2.4,
    unitNote: "× 100g",
  },
  {
    itemType: "WRAP_COMPONENT",
    title: "Woolworths Colby Cheese Slices 500g",
    category: "Dairy / Fridge",
    currentStock: 1,
    purchaseQuantity: 1,
    price: 7.5,
  },
  {
    itemType: "WRAP_COMPONENT",
    title: "Woolworths Essentials Parmesan Cheese 100g",
    category: "Dairy / Fridge",
    currentStock: 1,
    purchaseQuantity: 1,
    price: 2.0,
    unitNote: "Pantry seasoning — not a required wrap ingredient",
  },
  {
    id: "stock-lesnak",
    itemType: "SNACK_COMPONENT",
    title: "Uncle Tobys Le Snak Cheddar Cheese Dip & Crackers 12 Pack",
    category: "Snacks",
    currentStock: 12, // 12 individual snacks in the pack
    purchaseQuantity: 1, // 1 pack bought
    price: 8.8,
  },
  {
    id: "stock-grainwaves",
    itemType: "SNACK_COMPONENT",
    title: "Sunbites Grain Waves Sour Cream & Chives 22g × 8 Pack",
    category: "Snacks",
    currentStock: 8,
    purchaseQuantity: 1,
    price: 6.0,
  },
  {
    id: "stock-belvita",
    itemType: "SNACK_COMPONENT",
    title: "Belvita Chocolate Breakfast Biscuits 300g / 6 Pack",
    category: "Snacks",
    currentStock: 6,
    purchaseQuantity: 1,
    price: 2.25,
  },
];

export const BACKUP_PLANS = [
  { name: "Theme Week", note: "Weekly themed menu — retained as an editable secondary option." },
  { name: "Ready Meal rotation", note: "Older ready-meal templates, kept where non-duplicative." },
  { name: "Emergency / No-Spoon Meals", note: "Backup stock, not pulled into every shopping list automatically." },
  { name: "90-Minute Batch Prep", note: "Optional — no longer the forced default meal-prep routine." },
];
