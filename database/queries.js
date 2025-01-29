const pool = require("./pool");

function brightnessByColor(color) {
    var color = "" + color,
        isHEX = color.indexOf("#") == 0,
        isRGB = color.indexOf("rgb") == 0;
    if (isHEX) {
        const hasFullSpec = color.length == 7;
        var m = color.substr(1).match(hasFullSpec ? /(\S{2})/g : /(\S{1})/g);
        if (m)
            var r = parseInt(m[0] + (hasFullSpec ? "" : m[0]), 16),
                g = parseInt(m[1] + (hasFullSpec ? "" : m[1]), 16),
                b = parseInt(m[2] + (hasFullSpec ? "" : m[2]), 16);
    }
    if (isRGB) {
        var m = color.match(/(\d+){3}/g);
        if (m)
            var r = m[0],
                g = m[1],
                b = m[2];
    }
    if (typeof r != "undefined") return (r * 299 + g * 587 + b * 114) / 1000;
}

async function filterById(id) {
    const { rows } = await pool.query(
        "SELECT inventory.*, categories.category, categories.color FROM inventory JOIN categories ON inventory.category_id = categories.id WHERE inventory.id = $1",
        [id]
    );

    const newRows = rows.map((row) => {
        const brightness = brightnessByColor(row.color);
        let fontColor;

        if (brightness > 130) {
            fontColor = "#212529e0";
        } else {
            fontColor = "#fefefee0";
        }

        return { ...row, fontColor };
    });
    // If you don't do rows[0], it returns an array which will result in undefined.
    return newRows[0];
}

const fitlerProducts = async (query) => {
    let sortSQLQuery = "";
    if (query.sort) {
        const [column, direction] = query.sort
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .toLowerCase()
            .split(" ");

        if (
            !["price", "name"].includes(column) ||
            !["asc", "desc"].includes(direction)
        ) {
            sortSQLQuery = "";
        } else {
            sortSQLQuery = `ORDER BY ${column} ${direction}`;
        }
    }

    let categorySQLQuery = "";
    if (query.category && query.category.length > 0) {
        if (Array.isArray(query.category)) {
            const category = `(${query.category
                .map((cat) => `'${cat}'`)
                .join(", ")})`;
            categorySQLQuery = `WHERE categories.category IN ${category}`;
        } else {
            categorySQLQuery = `WHERE categories.category IN ('${query.category}')`;
        }
    }

    const { rows } = await pool.query(
        `SELECT inventory.*, categories.category, categories.color FROM inventory JOIN categories ON category_id = categories.id ${categorySQLQuery} ${sortSQLQuery};`
    );

    return rows;
};

const getAllProducts = async (query = null) => {
    try {
        if (query) {
            return fitlerProducts(query);
        }

        const { rows } = await pool.query(
            "SELECT inventory.*, categories.category, categories.color FROM inventory JOIN categories ON category_id = categories.id;"
        );

        return rows;
    } catch (err) {
        console.error(err);
    }
};

// async function showAllProducts() {
//   const { rows } = await pool.query(
//     "SELECT inventory.*, categories.category, categories.color FROM inventory JOIN categories ON inventory.category_id = categories.id ORDER BY inventory.name ASC"
//   );

//   const newRows = rows.map((row) => {
//     const brightness = brightnessByColor(row.color);
//     let fontColor;

//     if (brightness > 130) {
//       fontColor = "#212529e0";
//     } else {
//       fontColor = "#fefefee0";
//     }

//     return { ...row, fontColor };
//   });
//   return newRows;
// }

// async function sortByPrice({ sort = "priceASC" }) {
//   const order = sort.toUpperCase() === "PRICEDESC" ? "DESC" : "ASC";

//   const { rows } = await pool.query(
//     `SELECT inventory.*, categories.category, categories.color FROM inventory JOIN categories ON inventory.category_id = categories.id ORDER BY price ${order}`
//   );
//   return rows;
// }

// async function sortByName({ sort = "nameASC" }) {
//   const order = sort.toUpperCase() === "NAMEDESC" ? "DESC" : "ASC";

//   const { rows } = await pool.query(
//     `SELECT inventory.*, categories.category, categories.color FROM inventory JOIN categories ON inventory.category_id = categories.id ORDER BY name ${order}`
//   );
//   return rows;
// }

// async function filterByCategory({ selectedCategory }) {
//   // Make sure selectedCategory is an array to use with .map()
//   if (!Array.isArray(selectedCategory)) {
//     selectedCategory = [selectedCategory];
//   }

//   // Make placeholder for each selection "COLOR, "
//   const placeholder = selectedCategory
//     .map((_, index) => `$${index + 1}`)
//     .join(", ");
//   const query = `SELECT inventory.*, categories.category, categories.color FROM inventory JOIN categories ON inventory.category_id = categories.id WHERE categories.category IN (${placeholder})
//   ORDER BY category ASC`;

//   // Pass the query as well as the category for the placeholder function to work
//   const { rows } = await pool.query(query, selectedCategory);
//   const newRows = rows.map((row) => {
//     const brightness = brightnessByColor(row.color);
//     let fontColor;

//     if (brightness > 130) {
//       fontColor = "#212529e0";
//     } else {
//       fontColor = "#fefefee0";
//     }

//     return { ...row, fontColor };
//   });
//   return newRows;
// }

async function getCategories() {
    const { rows } = await pool.query(
        "SELECT * FROM categories ORDER BY category ASC;"
    );
    // For UI purposes
    const newRows = rows.map((row) => {
        const brightness = brightnessByColor(row.color);
        let fontColor;

        if (brightness > 130) {
            fontColor = "#212529e0";
        } else {
            fontColor = "#fefefee0";
        }

        return { ...row, fontColor };
    });
    return newRows;
}

async function getCategoryIdByName(categoryName) {
    const { rows } = await pool.query(
        `SELECT id FROM categories WHERE category = $1`,
        [categoryName]
    );
    return rows[0].id;
}

async function addCategory(newCategory) {
    await pool.query(
        "INSERT INTO categories (category, color) VALUES ($1, $2);",
        [newCategory.category, newCategory.color]
    );
}

async function addProductToDb(newProduct) {
    const categoryId = await getCategoryIdByName(newProduct.category);
    if (!categoryId) {
        throw new Error("Invalid category");
    }

    await pool.query(
        "INSERT INTO inventory ( name, quantity, price, brand, description, category_id, src,isDefault) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [
            newProduct.name,
            newProduct.quantity,
            newProduct.price,
            newProduct.brand,
            newProduct.description,
            categoryId,
            newProduct.src,
            false,
        ]
    );
}

async function deleteProduct(id) {
    await pool.query(
        "DELETE FROM inventory WHERE id = $1 AND isDefault = false",
        [id]
    );
}

async function deleteCategory(category) {
    const defaultCategoryId = 1;
    const categoryId = await getCategoryIdByName(category);
    await pool.query(
        "UPDATE inventory SET category_id = $1 WHERE category_id = $2 and isDefault = false",
        [defaultCategoryId, categoryId]
    );

    await pool.query("DELETE FROM categories WHERE category = $1", [category]);
}

async function editProduct({
    id,
    name,
    quantity,
    price,
    category,
    brand,
    src,
    description,
}) {
    const updates = [];
    const values = [];
    let index = 1;

    if (name) {
        updates.push(`name = $${index++}`);
        values.push(name);
    }
    if (quantity) {
        updates.push(`quantity = $${index++}`);
        values.push(quantity);
    }
    if (price) {
        updates.push(`price = $${index++}`);
        values.push(price);
    }
    if (category) {
        const categoryId = await getCategoryIdByName(category);
        if (categoryId) {
            updates.push(`category_id = $${index++}`);
            values.push(categoryId);
        } else {
            throw new Error("Invalid category.");
        }
    }
    if (brand) {
        updates.push(`brand = $${index++}`);
        values.push(brand);
    }
    if (src) {
        updates.push(`src = $${index++}`);
        values.push(src);
    }
    if (description) {
        updates.push(`description = $${index++}`);
        values.push(description);
    }

    if (updates.length > 0) {
        const query = `UPDATE inventory SET ${updates.join(
            ", "
        )} WHERE id = $${index}`;
        values.push(id);
        await pool.query(query, values);
    }
}

async function search(query) {
    const searchTerm = `%${query}%`;
    const { rows } = await pool.query(
        "SELECT inventory.*, categories.category, categories.color FROM inventory JOIN categories ON inventory.category_id = categories.id WHERE inventory.name ILIKE $1",
        [searchTerm]
    );

    const newRows = rows.map((row) => {
        const brightness = brightnessByColor(row.color);
        let fontColor;

        if (brightness > 130) {
            fontColor = "#212529e0";
        } else {
            fontColor = "#fefefee0";
        }

        return { ...row, fontColor };
    });
    return newRows;
}

module.exports = {
    filterById,
    getAllProducts,
    getCategories,
    addProductToDb,
    addCategory,
    deleteProduct,
    deleteCategory,
    editProduct,
    search,
};
