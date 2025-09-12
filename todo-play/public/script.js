document.addEventListener('DOMContentLoaded', () => {
  let data;
  const randomLength = 5;
  
  /*
  const rd = {};
  let ccount = 0;
  const ecount = 19;
  */
  
  
  const portraitArrow =  {'d':'↓', 'dd':'⇊', 'u':'↑', 'uu':'⇈' };
  const landscapeArrow = {'d':'→', 'dd':'⇉', 'u':'←', 'uu':'⇇' };
  
  // Fetch the initial data from the server
  const fetchData = async () => {
    const response = await fetch('/api/data');
    data = await response.json();
    data.search = [];
    data.clear = [];
    renderLists();
    /*
    for(let i=0;i<data.remaining.length;i+=1){
      rd[data.remaining[i]]=0;
    }
    */
  };
  
  const getLogicalOrientation = () => {
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  }

  // Render the data in the lists
  const renderLists = () => {
  
    document.getElementById('list').querySelector('h3').textContent = `List ( ${data.list.length} )`;
    document.getElementById('done').querySelector('h3').textContent = `Done ( ${data.done.length} )`;
    
    const remainingListTitle = document.getElementById('remaining').querySelector('h3').textContent;
    const remainingListTitleHeader = remainingListTitle.split(" (")[0];
    const remainingList = remainingListTitle.includes("Search")? data.search:data.remaining;
    document.getElementById('remaining').querySelector('h3').textContent = `${remainingListTitleHeader} ( ${remainingList.length} )`;
    
    const orientation = getLogicalOrientation();
    const {d, dd, u, uu} = (orientation === 'portrait') ? portraitArrow : landscapeArrow;
    
    document.getElementById('remainingList').innerHTML = remainingList.map(item => `
      <li draggable="true" ondragstart="drag(event)">
        <div>${item}</div>
        <div>
            <button class="small-btn" onclick="moveTo('remaining', 'done', '${item}')">${dd}</button>
            <button class="small-btn" onclick="moveTo('remaining', 'list', '${item}')">${d}</button>
        </div>
      </li>`).join('');
    document.getElementById('listList').innerHTML = data.list.map(item => `
      <li draggable="true" ondragstart="drag(event)">
        <div>${item}</div>
        <div>
            <button class="small-btn" onclick="moveTo('list', 'remaining', '${item}')">${u}</button>
            <button class="small-btn" onclick="moveTo('list', 'done', '${item}')">${d}</button>
        </div>
      </li>`).join('');
    document.getElementById('doneList').innerHTML = data.done.map(item => `
      <li draggable="true" ondragstart="drag(event)">
        <div>${item}</div>
        <div>
            <button class="small-btn" onclick="moveTo('done', 'remaining', '${item}')">${uu}</button>
            <button class="small-btn" onclick="moveTo('done', 'list', '${item}')">${u}</button>
        </div>
      </li>`).join('');
  };

  // Handle the search input to filter items in 'remaining'
  document.getElementById('search').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filteredItems = data.remaining.filter(item => item.toLowerCase().includes(query));
    data.search =  filteredItems;
    
    const orientation = getLogicalOrientation();
    const {d, dd, u, uu} = (orientation === 'portrait') ? portraitArrow : landscapeArrow;
    
    const title = (filteredItems.length === data.remaining.length)? 'Remaining' : 'Search Results';
    document.getElementById('remaining').querySelector('h3').textContent = `${title} ( ${filteredItems.length} )`
    document.getElementById('remainingList').innerHTML = filteredItems.map(item => `
      <li draggable="true" ondragstart="drag(event)">
        <div>${item}</div>
        <div>
            <button class="small-btn" onclick="moveTo('remaining', 'done', '${item}')">${dd}</button>
            <button class="small-btn" onclick="moveTo('remaining', 'list', '${item}')">${d}</button>
        </div>
      </li>`).join('');
  });

  // Handle drag start
  window.drag = (event) => {
    event.dataTransfer.setData('text', event.target.children[0].textContent);
    event.dataTransfer.setData('from', event.target.closest('.list').id);
  };

  // Allow drop
  window.allowDrop = (event) => {
    event.preventDefault();
  };

  // Handle drop
  window.drop = (event) => {
    event.preventDefault();
    const data = event.dataTransfer.getData('text');
    const from = event.dataTransfer.getData('from');
    const targetList = event.target.closest('.list');
    const targetListId = targetList.id;
    
    //console.log(`from:${from}, to:${targetListId}, data:${data}`);
    // Find where to move the item
    if (targetListId !== 'remaining' && targetListId !== 'list' && targetListId !== 'done') return;

    // Move item in the data object
    moveTo(from, targetListId, data);
    renderLists();
  };

  // Move item between lists
  window.moveTo = (from, to, item) => {
    if(from === 'remaining'){
        const index = data.search.indexOf(item);
        if (index > -1) {
          data.search.splice(index, 1);
        }
    }
    const fromList = data[from];
    const toList = data[to];
    const index = fromList.indexOf(item);
    if (index > -1) {
      fromList.splice(index, 1);
    }
    toList.push(item);

    renderLists();
  };

  // Choose 10 random items and move to 'list'
  document.getElementById('randomizeButton').addEventListener('click', () => {
    const randomItems = [];
    while (randomItems.length < randomLength && data.remaining.length > 0) {
      //const randomIndex = Math.floor(Math.random() * data.remaining.length);
      const len = data.remaining.length;
      const randomNum = crypto.getRandomValues(new Uint32Array(1))[0];
      const randomIndex = (randomNum % (len));
      const randomItem = data.remaining.splice(randomIndex, 1)[0];
      //rd[randomItem]+=1;
      randomItems.push(randomItem);
    }

    /*
    ccount+=1;
    
    if(ccount===ecount){
      console.log(rd);
      const a=[],b=[];
      let randCalc=0;
      
      for (const [key, kcount] of Object.entries(rd)){
        
        if(kcount===0){
          a.push(key);
        }
        b.push({t:key,c:kcount});
        randCalc+=kcount;
      }
      console.log(a);
      b.sort((x,y)=>y.c-x.c);
      console.log(b);
      console.log("rcalc",randCalc);
      ccount=0;   
    }
    */
    
    data.list = data.list.concat(randomItems);
    document.getElementById('search').value = '';
    document.getElementById('remaining').querySelector('h3').textContent = 'Remaining';
    renderLists();
  });
  
  document.getElementById('moveListButton').addEventListener('click', () => {
    data.remaining = data.remaining.concat(data.list);
    data.list = [];
    document.getElementById('search').value = '';
    document.getElementById('remaining').querySelector('h3').textContent = 'Remaining';
    renderLists();
  });
  
  document.getElementById('moveDoneButton').addEventListener('click', () => {
    data.list = data.list.concat(data.done);
    data.done = [];
    document.getElementById('search').value = '';
    document.getElementById('remaining').querySelector('h3').textContent = 'Remaining';
    renderLists();
  });
  document.getElementById('clearDoneButton').addEventListener('click', () => {
    data.clear = data.done.concat(data.clear);
    data.done = [];
    document.getElementById('search').value = '';
    document.getElementById('remaining').querySelector('h3').textContent = 'Remaining';
    renderLists();
  });

  // Update data on the server
  document.getElementById('updateButton').addEventListener('click', async () => {
    const userConfirmed = confirm("Are you sure you want to proceed?");
    if(!userConfirmed) return;
    
    const { remaining, list, done, clear } = data;
    const response = await fetch('/api/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ remaining, list, done, clear }),
    });

    if (response.ok) {
      alert('Data updated successfully!');
    } else {
      alert('Failed to update data!');
    }
    data.clear = [];
  });
  
  document.getElementById('refreshButton').addEventListener('click', () => {
    document.getElementById('search').value = '';
    document.getElementById('remaining').querySelector('h3').textContent = 'Remaining';
    renderLists();
  });
  
  screen.orientation.addEventListener('change', () => {
    renderLists();
  });
  window.addEventListener('resize', () => {
    renderLists();
  });
  window.addEventListener('orientationchange', () => {
    renderLists();
  });
  // Initial data fetch
  fetchData();
});


