const form = document.querySelector("#create-portfolio-form");
 
form.addEventListener("submit", function (event) {
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

    // 1. Read values from the HTML form
    const data = new FormData(form);
 
    // 2. Create a JavaScript object
    const portfolio = {
        displayName: data.get("displayName").trim(),
        whatEnjoy: data.get("whatEnjoy").trim(),
        whatTried: data.get("whatTried").trim(),
        whatCurious: data.get("whatCurious").trim(),
        items: []   // Portfolio Items will be pushed in here later
    };

    addPortfolio(portfolio);
    form.reset();
    bootstrap.Modal.getOrCreateInstance(document.getElementById("createPortfolioModal")).hide();

});

//------------Done--------------

const portfolios = []; 

const PORTFOLIO_STORAGE_KEY = "cs100-power-up-portfolios";

function savePortfolios() {
    // Do not replace saved data with an empty initial state.
    if (portfolios.length === 0) return;
    try {
        localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(portfolios));
    } catch (error) {
        console.warn("Unable to save portfolios to LocalStorage.", error);
    }
}

function loadPortfolios() {
    let savedData;
    try {
        savedData = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    } catch (error) {
        console.warn("Unable to read portfolios from LocalStorage.", error);
        return;
    }
    if (!savedData) return;

    try {
        const savedPortfolios = JSON.parse(savedData);
        if (!Array.isArray(savedPortfolios)) return;
        savedPortfolios.forEach(function (portfolio) {
            if (!portfolio || typeof portfolio !== "object" ||
                typeof portfolio.displayName !== "string") return;
            if (!Array.isArray(portfolio.items)) portfolio.items = [];
            addPortfolio(portfolio);
        });
    } catch (error) {
        console.warn("Saved portfolio data is invalid JSON.", error);
    }
}

function addPortfolio(portfolio){
    portfolios.push(portfolio); // เก็บ portfolioที่สร้างมา
    savePortfolios();

    const list = document.getElementById("portfolio-list");

    //card
    const card = document.createElement("div");
    card.className = "portfolio-card";

    function addText(tag,text) {
        const element = document.createElement(tag);
        element.textContent = text;
        card.appendChild(element);
    }

    addText("h1" , portfolio.displayName);
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
