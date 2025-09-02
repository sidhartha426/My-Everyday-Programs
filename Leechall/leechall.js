// const buttonDiv = document.querySelector("#app > div.vertical-layout.h-100.vertical-menu-modern.menu-expanded.navbar-floating.footer-static > div.app-content.content > div.content-wrapper > div > div > div:nth-child(2) > div.col-lg-8 > div > div > div > span > form > div");

const buttonDiv = document.querySelector("#app > div.vertical-layout.h-100.vertical-menu-modern.menu-expanded.navbar-floating.footer-static > div.app-content.content > div.content-wrapper > div > div > div:nth-child(2) > div.col-lg-8 > div > div");

const copyButton = document.createElement("button");

const copyLinks = () => {

  const successDivs = document.querySelectorAll("#app > div.vertical-layout.h-100.vertical-menu-modern.menu-expanded.navbar-floating.footer-static > div.app-content.content > div.content-wrapper > div > div > div:nth-child(2) > div.col-lg-8 > div.card.bg-primary");
  
  let linksData = '';

  console.log(successDivs);
  
  successDivs.forEach((div)=>{
    linksData += div.querySelector("a").href + "\n";
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
