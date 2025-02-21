module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { links } = req.body;
    if (!links || !Array.isArray(links)) {
        return res.status(400).json({ error: "Invalid request format" });
    }

    // Function to fetch recipe data (Placeholder)
    async function fetchRecipe(url) {
        return {
            title: "Sample Recipe",
            ingredients: [
                "2 onions",
                "3 cloves garlic",
                "1 cup flour",
                "1/2 tsp salt",
                "1/4 tsp black pepper",
                "1 tbsp olive oil"
            ]
        };
    }

    const results = await Promise.all(links.map(url => fetchRecipe(url)));

    let consolidatedIngredients = {};
    results.forEach(recipe => {
        recipe.ingredients.forEach(ingredient => {
            consolidatedIngredients[ingredient] = (consolidatedIngredients[ingredient] || 0) + 1;
        });
    });

    let output = "Consolidated Ingredients:\n";
    for (const [ingredient, count] of Object.entries(consolidatedIngredients)) {
        output += `- ${ingredient} (x${count})\n`;
    }

    return res.json({ ingredients: output });
};
