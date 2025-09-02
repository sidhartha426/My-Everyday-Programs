const historyTableDiv = document.querySelector("#app > div.vertical-layout.h-100.vertical-menu-modern.menu-expanded.navbar-floating.footer-static > div.app-content.content > div.content-wrapper > div > div > div.card > div.b-overlay-wrap.position-relative > div");
const historyTableBody = historyTableDiv.querySelector("tbody");

const copyButton = document.createElement("button");

const copyLinks = () => {

    let linksData = '';
    let tableRows = historyTableBody.querySelectorAll("tr");
    tableRows.forEach((row) => {
        linksData += row.querySelector("td:nth-child(2) > a").href + "\n";
    });
    navigator.clipboard.writeText(linksData).then(() => {
    
        console.log('Content copied to clipboard');
        console.log('Data');
        console.log(linksData);
        alert("Links Copied.");
  
    });
    
}

copyButton.classList.add("btn", "mr-2", "btn-gradient-primary");
copyButton.textContent = "Copy Links";
copyButton.setAttribute("type","button");
copyButton.onclick = copyLinks;
historyTableDiv.appendChild(copyButton);
