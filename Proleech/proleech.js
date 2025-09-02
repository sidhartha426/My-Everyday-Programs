


const buttonDiv = document.querySelector("#ajaxform > div:nth-child(7)");

const copyButton = document.createElement("button");

const copyLinks = () => {

  const successDivs = document.querySelectorAll("div.alert.success");
  
  let linksData = '';

  //console.log(successDivs);
  
  successDivs.forEach((div)=>{
    linksData += div.querySelectorAll("a")[1].href + "\n";
    //console.log(div.querySelector("a").href);
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

buttonDiv.appendChild(copyButton);
