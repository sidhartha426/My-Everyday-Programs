const buttonTable = document.querySelector("#content > div > div > table > tbody");

const copyButton = document.createElement("button");
const copyRow = document.createElement("tr");

const copyLinks = () => {

  const linkRows = document.querySelectorAll("#form1 > table > tbody > tr");
  
  let linksData = '';

  console.log(linkRows);
  
  linkRows.forEach((tr)=>{
    const link = tr.querySelector("a");
    if(link)
      linksData += link.href + "\n";
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

copyRow.appendChild(copyButton);
buttonTable.prepend(copyRow);
