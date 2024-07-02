document.getElementById('searchForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const categories = document.getElementById('categories').value.split(',').map(cat => cat.trim());
    try {
        await init(username, categories);
    } catch (error) {
        document.getElementById('error').textContent = 'An error occurred: ' + error.message;
        console.error(error);
    }
});

async function fetchContributions(username) {
    try {
        const response = await fetch(`https://justapedia.org/api.php?action=query&list=usercontribs&ucuser=${username}&uclimit=max&format=json&origin=*`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Contributions:', data);
        return data.query.usercontribs;
    } catch (error) {
        throw new Error('Failed to fetch contributions: ' + error.message);
    }
}

async function fetchCategoryPages(category) {
    try {
        const response = await fetch(`https://justapedia.org/api.php?action=query&list=categorymembers&cmtitle=Category:${category}&cmlimit=max&format=json&origin=*`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Pages in category ${category}:`, data);
        return data.query.categorymembers.map(page => page.title);
    } catch (error) {
        throw new Error('Failed to fetch category pages for ' + category + ': ' + error.message);
    }
}

async function analyzeContributions(username, categories) {
    const contributions = await fetchContributions(username);
    const categoryPages = {};

    for (const category of categories) {
        categoryPages[category] = await fetchCategoryPages(category);
    }

    let editsInCategories = 0;
    let editsNotInCategories = 0;

    for (const contribution of contributions) {
        let foundInCategory = false;
        for (const category of categories) {
            if (categoryPages[category].includes(contribution.title)) {
                foundInCategory = true;
                break;
            }
        }
        if (foundInCategory) {
            editsInCategories++;
        } else {
            editsNotInCategories++;
        }
    }

    return {
        editsInCategories,
        editsNotInCategories
    };
}

function generateSummary(data) {
    const { editsInCategories, editsNotInCategories } = data;
    let summary = `<p>Edits in categories: ${editsInCategories}</p>`;
    summary += `<p>Edits not in categories: ${editsNotInCategories}</p>`;
    document.getElementById('summary').innerHTML = summary;
}

function generateChart(data) {
    const { editsInCategories, editsNotInCategories } = data;

    new Chart(document.getElementById('categoryChart'), {
        type: 'pie',
        data: {
            labels: ['Edits in categories', 'Edits not in categories'],
            datasets: [{
                label: 'Edits',
                data: [editsInCategories, editsNotInCategories],
                backgroundColor: ['#ff6384', '#36a2eb']
            }]
        },
        options: {
            responsive: true,
        }
    });
}

async function init(username, categories) {
    const data = await analyzeContributions(username, categories);
    generateSummary(data);
    generateChart(data);
}
