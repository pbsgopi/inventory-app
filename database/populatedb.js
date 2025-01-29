const { Client } = require("pg");
require("dotenv").config();

const dropTables = `DROP TABLE IF EXISTS inventory, categories;`;

const createSQLTable = `CREATE TABLE IF NOT EXISTS inventory ( id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY, name VARCHAR(50) UNIQUE, category_id INTEGER, quantity INTEGER, price DECIMAL(5, 2), brand VARCHAR(50), src TEXT DEFAULT '/images/fork-knife-default.svg', description VARCHAR(200), isDefault BOOLEAN);`;

const createSQLData = `
INSERT INTO inventory (name,category_id,quantity,price,brand,src,description,isdefault) VALUES
	 ('Bread',2,70,1.50,'Bakery Delights','/images/bread.svg','Soft and wholesome whole grain bread, freshly baked.',true),
	 ('Orange Juice',3,75,2.99,'Juicy Drinks','/images/orangejuice.svg','Freshly squeezed orange juice, packed with vitamin C.',false),
	 ('Apple Juice',3,80,2.50,'Juicy Drinks','/images/applejuice.svg','Delicious apple juice, perfect for breakfast or a refreshing drink.',false),
	 ('Soda',3,150,1.25,'Fizzy Pop','/images/soda.svg','A refreshing, fizzy soda to quench your thirst.',true),
	 ('Coffee',3,100,7.99,'Brewed Bliss','/images/coffee.svg','Rich and aromatic coffee beans, perfect for a morning brew.',true),
	 ('Tea',3,90,4.99,'Tea Time','/images/tea.svg','Premium tea leaves, perfect for a soothing cup of tea.',true),
	 ('Ketchup',4,70,1.50,'Saucy Stuff','/images/ketchup.svg','Classic ketchup, perfect for burgers or fries.',false),
	 ('Mustard',4,65,1.25,'Saucy Stuff','/images/mustard.svg','Tangy mustard, perfect for hot dogs and sandwiches.',false),
	 ('Eggs',5,200,0.15,'Happy Hens','/images/egg.svg','Farm-fresh eggs, ideal for breakfast or baking.',true),
	 ('Milk',5,60,1.99,'Dairy Pure','/images/milk.svg','Fresh dairy milk, perfect for drinking or adding to cereal.',true),
	 ('Cheese',5,40,2.50,'Cheesy Goodness','/images/cheese.svg','Delicious cheddar cheese, perfect for sandwiches or melting.',true),
	 ('Butter',5,70,2.99,'Creamy Bliss','/images/butter.svg','Rich and creamy butter, perfect for spreading or baking.',true),
	 ('Ice Cream',6,60,3.99,'Cool Treats','/images/icecream.svg','Creamy ice cream, perfect for dessert or a summer treat.',true),
	 ('Frozen Pizza',6,40,5.99,'Easy Meals','/images/pizza.svg','A frozen pizza, easy and quick to prepare for dinner.',false),
	 ('Apple',7,100,0.50,'Fresh Farms','/images/apple.svg','A crisp and juicy red apple, perfect for snacking or adding to salads.',false),
	 ('Banana',7,120,0.30,'Tropical Bites','/images/banana.svg','A ripe and sweet banana, ideal for smoothies or as a healthy snack.',false),
	 ('Oranges',7,110,0.40,'Citrus World','/images/orange.svg','Juicy and sweet oranges, great for fresh juice or snacking.',true),
	 ('Grapes',7,90,2.00,'Vine Valley','/images/grapes.svg','Fresh purple grapes, perfect for snacking or adding to salads.',true),
	 ('Watermelon',7,25,4.50,'Sweet Melons','/images/watermelon.svg','A large, sweet watermelon, perfect for a refreshing summer treat.',true),
	 ('Strawberries',7,65,3.25,'Berry Patch','/images/strawberry.svg','Fresh and sweet strawberries, perfect for desserts or snacking.',false),
	 ('Blueberries',7,70,3.50,'Berry Patch','/images/blueberries.svg','Plump and juicy blueberries, great for baking or snacking.',false),
	 ('Avocado',7,60,1.25,'Green Goodness','/images/avocado.svg','Creamy avocados, ideal for guacamole or adding to salads.',false),
	 ('Pasta',8,55,1.00,'Pasta Palace','/images/pasta.svg','Classic spaghetti pasta, great for Italian dishes.',true),
	 ('Olive Oil',9,45,6.50,'Golden Pressed','/images/olive-oil.svg','Extra virgin olive oil, great for cooking or salad dressings.',false),
	 ('Sugar',9,90,2.00,'Sweet Essentials','/images/sugar.svg','Granulated sugar, perfect for baking or sweetening drinks.',false),
	 ('Salt',9,100,0.99,'Basic Seasonings','/images/salt.svg','Classic table salt, essential for seasoning your meals.',false),
	 ('Salmon',10,30,8.99,'Ocean Catch','/images/salmon.svg','Premium quality salmon fillets, rich in omega-3 fatty acids.',true),
	 ('Shrimp',10,40,9.99,'Ocean Catch','/images/shrimp.svg','Fresh shrimp, perfect for grilling or adding to pasta dishes.',false),
	 ('Cookies',11,85,2.25,'Sweet Bites','/images/cookies.svg','Delicious homemade cookies, perfect for a sweet snack.',true),
	 ('Chocolate',11,100,1.50,'Choco Delight','/images/chocolate.svg','Rich and smooth chocolate, perfect for a sweet treat.',true),
	 ('Carrot',12,80,0.20,'Nature''s Own','/images/carrot.svg','Fresh orange carrots, great for cooking or munching raw.',false),
	 ('Broccoli',12,50,1.25,'Green Valley','/images/broccoli.svg','A bunch of fresh broccoli florets, perfect for steaming or roasting.',false),
	 ('Tomato',12,85,0.60,'Farm Fresh','/images/tomato.svg','Fresh, ripe tomatoes, perfect for salads or cooking.',true),
	 ('Potato',12,100,0.20,'Spud Harvest','/images/potato.svg','Fresh potatoes, perfect for mashing, baking, or frying.',true),
	 ('Onion',12,95,0.30,'Nature''s Own','/images/onion.svg','Crisp and flavorful onions, great for cooking or salads.',true),
	 ('Lettuce',12,100,0.75,'Leafy Greens','/images/lettuce.svg','Crisp and fresh lettuce, perfect for salads and sandwiches.',false),
	 ('Cucumber',12,80,0.50,'Cool Crunch','/images/cucumber.svg','Crisp cucumbers, great for salads or snacking.',false);
`;

const createCategoriesTable = `CREATE TABLE IF NOT EXISTS categories ( id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY, category VARCHAR(50) UNIQUE, color TEXT UNIQUE)`;

const createCategories = `INSERT INTO categories (category, color) VALUES ('Uncategorized', '#fefefe'),('Bakery', '#ffc26c'), ('Beverages', '#634040'), ('Condiments', '#fff952'), ('Dairy', '#fffeeb'), ('Frozen', '#b0e3ee'), ('Fruit', '#ff0062'), ('Grains', '#ffe3bc'), ('Pantry', '#11ac7b'), ('Seafood', '#0037ff'), ('Snacks', '#56157f'), ('Vegetable', '#23a112');`;

async function main() {
  console.log("Seeding...");
  const client = new Client({
    connectionString: process.env.RENDER_URL || process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
  try {
    await client.connect();
    console.log("Connected to database.");
    await client.query(dropTables);
    await client.query(createCategoriesTable);
    await client.query(createSQLTable);
    console.log("Tables created.");
    await client.query(createCategories);
    await client.query(createSQLData);
    console.log("Data created.");
  } catch (error) {
    console.error("Error occured:", error);
  } finally {
    await client.end();
    console.log("Done.");
  }
}

main();
