const API_BASE_URL = "api";
const form = document.querySelector("#create-portfolio-form");
 
form.addEventListener("submit", async function (event) {
    event.preventDefault();
    
    // Profile Validation
    const displayName = document.querySelector("#portfolio-name").value.trim();
    const whatEnjoy = document.querySelector("#portfolio-enjoy").value.trim();
    const whatTried = document.querySelector("#portfolio-tried").value.trim();
    const whatCurious = document.querySelector("#portfolio-curious").value.trim();

    const error = document.querySelector("#profile-error");

    if (displayName === "") {
        error.textContent = "Please enter your name.";
        return;
    }
    if (whatEnjoy === "") {
        error.textContent = "Please enter what you enjoy.";
        return;
    }
    if (whatTried === "") {
        error.textContent = "Please enter what you've tried.";
        return;
    }
    if (whatCurious === "") {
        error.textContent = "Please enter what you're curious about.";
        return;
    }

    console.log("Profile Validiation Passed!! Still running.");

    error.textContent = "";

    try {
        const saved = await createPortfolioOnServer(new FormData(form));
        addPortfolio(saved);
        form.reset();
        bootstrap.Modal.getOrCreateInstance(document.getElementById("createPortfolioModal")).hide();
    } catch (e) {
        error.textContent = e.message;
    }
});



const portfolios = []; 

async function createPortfolioOnServer(formData) {
    const response = await fetch(`${API_BASE_URL}/portfolios.php`, {
        method: "POST",
        body: formData
    });
    const result = await response.json().catch(function () { return {}; });
    if (!response.ok) {
        throw new Error(result.error || ("บันทึกไม่สำเร็จ (HTTP " + response.status + ")"));
    }
    return result;
}

async function loadPortfolios() {
    try {
        const response = await fetch(`${API_BASE_URL}/portfolios.php`);
        if (!response.ok) throw new Error("Failed to load from server");
        
        const savedPortfolios = await response.json();
        if (!Array.isArray(savedPortfolios)) return;
        
        savedPortfolios.forEach(function (portfolio) {
            if (!portfolio || typeof portfolio !== "object" || 
                typeof portfolio.displayName !== "string") return;
            if (!Array.isArray(portfolio.items)) portfolio.items = [];
            addPortfolio(portfolio);
        });
    } catch (error) {
        console.warn("Unable to load portfolios from AWS server.", error);
    }
}

// ---------- Export Portfolio ----------

// GET: ask the server for all Portfolios
async function exportPortfolio(portfolio) {
    try {
        const response = await fetch(`${API_BASE_URL}/portfolios.php`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Could not retrieve Portfolio from server');
        }

        // Find the Portfolio to export
        const currentPortfolio = result.find(p => p.id === portfolio.id);

        if (!currentPortfolio) {
            throw new Error('Portfolio not found on server');
        }

        // Convert Portfolio to JSON
        // null,2 is format for JSON, so it's easy to read
        const json = JSON.stringify(currentPortfolio, null, 2);

        // Create a downloadable file
        const blob = new Blob([json], {
            type: "application/json"
        });

        // Create Temporary URL for download
        const url = URL.createObjectURL(blob);

        // Download the JSON file
        const link = document.createElement("a");
        link.href = url;
        link.download = "my-portfolio.json"; // FIle name is my-portfolio.json
        link.click();

        URL.revokeObjectURL(url);

    } catch (error) {
        console.error(error);
        alert("Unable to export Portfolio.");
    }
}

function addPortfolio(portfolio){
    portfolios.push(portfolio); // เก็บ portfolioที่สร้างมา

    const list = document.getElementById("portfolio-list");

    //card
    const card = document.createElement("div");
    card.className = "portfolio-card position-relative";

    function addText(tag,text) {
        const element = document.createElement(tag);
        element.textContent = text;
        card.appendChild(element);
    }

    // Portfolio Header
    const header = document.createElement("div");
    header.className = "d-flex align-items-center";

    const name = document.createElement("h1");
    name.textContent = portfolio.displayName;

    // Export Button
    const exportBtn = document.createElement("button");
    exportBtn.className = "export-button btn btn-outline-primary btn-sm position-absolute";
    exportBtn.textContent = "Export";

    exportBtn.addEventListener("click", function(event) {
        event.stopPropagation();
        exportPortfolio(portfolio);
    });

    header.appendChild(name);
    header.appendChild(exportBtn);
    card.appendChild(header);
    addText("p" , "What I Enjoy: " + portfolio.whatEnjoy);
    addText("p" , "What I've Tried: " + portfolio.whatTried);
    addText("p" , "What I'm Curious About: " + portfolio.whatCurious);

    list.appendChild(card); // การ์ดใหม่จะอยู่ต่อการ์ดเก่า

    card.addEventListener("click", function (){
        openPortfolio(portfolio);
    });

    // navbar
    const navList = document.getElementById("portfolio-nav-links");

    const li = document.createElement("li");
    li.className = "nav-item";

    const a = document.createElement("a");
    a.className = "nav-link";
    a.href = "#";
    a.textContent = portfolio.displayName;

    a.addEventListener("click", function (event){
        event.preventDefault();
        openPortfolio(portfolio);
    });

    li.appendChild(a);
    navList.appendChild(li);
}

document.querySelector("#home-link")
.addEventListener("click" , function(event){
    event.preventDefault();
    showHome();
});

loadPortfolios();