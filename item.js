const homeView = document.getElementById("home-view");
const detailView = document.getElementById("detail-view");

const itemForm = document.getElementById("item-form");
const formContainer = document.getElementById("form-container");

const addItemButton = document.getElementById("btn-add-item");
const cardContainer = document.getElementById("card-container");

let current = null;

const profileBox = document.createElement("div"); //ตัว portfilio
profileBox.className = "profile-box";
detailView.insertBefore(profileBox, cardContainer);

// สลับหน้า ข้อมูล portfolio
function openPortfolio(portfolio) {
    current = portfolio;

    profileBox.innerHTML = "";
    addText(profileBox, "h3", portfolio.displayName, "fw-bold mb-2");
    addText(profileBox, "p", "What I Enjoy: " + portfolio.whatEnjoy, "mb-1 small");
    addText(profileBox, "p", "What I've Tried: " + portfolio.whatTried, "mb-1 small");
    addText(profileBox, "p", "What I'm Curious About: " + portfolio.whatCurious, "mb-0 small");

    homeView.hidden = true;
    detailView.hidden = false;
    formContainer.hidden = true;
    renderItem();
}

// item
function addText(card, tag, text, className){
    const element = document.createElement(tag);
    element.textContent = text;
    element.className = className;
    card.appendChild(element);
}

function renderItem(){
    cardContainer.innerHTML = "";

    current.items.forEach(function(item) {
        const col = document.createElement("div");
        col.className = "col-item"

        const card = document.createElement("div");
        card.className = "card-item"

        addText(card, "h5", item.title, "fw-bold mb-1")
        addText(card, "p", item.type + " • " + item.date + " • " + item.role, "text-muted small mb-2");
        addText(card, "p", item.description, "mb-2");

        const skillBox = document.createElement("div");
        skillBox.className = "mb-2"
        item.skills.forEach(function(skill) {
            addText(skillBox, "span", skill, "badge bg-secondary me-1");
        });
        card.appendChild(skillBox);

        addText(card, "p", "What I did: " + item.whatIDid, "mb-1 small");
        addText(card, "p", "What I learned: " + item.whatILearned, "mb-1 small");
        addText(card, "p", "Challenge: " + item.challenge, "mb-1 small");
        addText(card, "p", "Next step: " + item.nextStep, "mb-2 small");

        const link = document.createElement("a");
        link.href = item.evidence;
        link.textContent = "Evidence";

        card.appendChild(link);
        col.appendChild(card);
        cardContainer.appendChild(col);
    })
}
addItemButton.addEventListener("click", function () {
    formContainer.hidden = !formContainer.hidden;
});

function showHome() {
    homeView.hidden = false;
    detailView.hidden = true;
}

// submit form item
itemForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const data = new FormData(itemForm);

    const item = {
        title: data.get("title").trim(),
        type: data.get("type").trim(),
        date: data.get("date"),
        role: data.get("role").trim(),
        
        skills: data.get("skills")
            .split(",")
            .map(function (s) { return s.trim(); })
            .filter(function (s) { return s !== ""; }),
       
        description: data.get("description").trim(),
        whatIDid: data.get("whatIDid").trim(),
        whatILearned: data.get("whatILearned").trim(),
        challenge: data.get("challenge").trim(),
        nextStep: data.get("nextStep").trim(),
        evidence: data.get("evidence").trim()
    };

    current.items.push(item);
    renderItem();
    itemForm.reset();
    formContainer.hidden = true;
});