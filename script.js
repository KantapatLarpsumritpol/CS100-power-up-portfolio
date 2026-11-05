const form = document.querySelector("#create-portfolio-form");
 
form.addEventListener("submit", function (event) {
    event.preventDefault();
 
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
    
});

//------------Done--------------

const portfolios = []; 

function addPortfolio(portfolio){
    portfolios.push(portfolio); // เก็บ portfolioที่สร้างมา
    displayCard(portfolio);
    addNavItem(portfolio);
}

const list = document.getElementById("portfolio-list");

//card
function displayCard(portfolio) {
    const card = document.createElement("div"); 
    card.className = "portfolio-card card p-3 mb-3" 

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
}

// navbar
const navList = document.getElementById("portfolio-nav-links");

function addNavItem(portfolio) {
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

// item รอแก้ไข
/* function displayCard(item) {
    const container = document.getElementById("card-container");

    const card = document.createElement("div");
    card.className = "col-md-6 col-lg-4";

    const content = document.createElement("div");
    content.className = "card p-3 shadow-sm h-100";

    function addText(tag, text){
        const element = document.createElement(tag);
        element.textContent = text ?? "";
        content.appendChild(element);
    }

    addText("h1", item.title);
    addText("p", "Type: " + item.type);
    addText("p", "Date: " + item.date);
    addText("p", "Role: " + item.role);
    addText("p", "Description: " + item.description);
    addText("p", "Skills: " + item.skills);

    addText("h1", "Reflection");
    addText("p", "What I Did: " + item.reflection.WhatIid);
    addText("p", "What I Lerned: " + item.reflection.whatILearned);
    addText("p", "Challenge: " + item.reflection.challenge);
    addText("p", "Next Step: " + item.reflection.nextStep);

    addText("p", "Evidence: " + item.evidence.join(", "));

    card.appendChild(content);
} */