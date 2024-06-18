//Set 0 for Dev Data
var incrementVar = 0;
var trackCount = 3;
var dialogHidden = true;
const githubRepo = 'Guinewok/vinylWishlist';
const fileName = 'test.json';

function pivotToggle(e, pivotNum) {
  var pivotArray = ["carousel","addForm","collection","na"];
  e.preventDefault();
  for(i = 0; i < pivotArray.length; i++){
    if(i === Number(pivotNum)){
      var div = document.getElementById(pivotArray[pivotNum])
      div.classList.add('pivotHide');
      div.classList.remove('pivotHide');
    }else{
      var div = document.getElementById(pivotArray[i])
      div.classList.add('pivotHide');
    }
  }
  if(pivotNum === 1) {
    mapFormTracklist();
  }
  if(pivotNum === 2) {
    renderCollection();
  }
};

async function getData() {
  const response = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${fileName}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  //TODO test if the first JSON.parse can be removed
  const dataParsed = JSON.parse(atob(data.content));
  localStorage.setItem("wishlist", JSON.stringify(dataParsed.wishlist, null, 2));
  localStorage.setItem("collection", JSON.stringify(dataParsed.collection, null, 2));
  localStorage.setItem("removed", JSON.stringify(dataParsed.removed, null, 2));
  localStorage.setItem("sha", data.sha);
  console.log("Wishlist: ", JSON.parse(localStorage.getItem("wishlist")));
  console.log("Collection: ", JSON.parse(localStorage.getItem("collection")));
  console.log("Removed: ", JSON.parse(localStorage.getItem("removed")));
  console.log("sha: ", localStorage.getItem("sha"));
};

function parseFormData() {
  //Get form
  let form = document.querySelector('form');
  var myFormData = new FormData(form);
  const formDataObj = {};
  myFormData.forEach((value, key) => (formDataObj[key] = value));
  console.log(formDataObj);
  
  const curDate = new Date();
 
  const newListItem = {
    albumName: formDataObj.albumName,
    artistName: formDataObj.artistName,
    color: formDataObj.color,
    description: formDataObj.description,
    price: formDataObj.price,
    releaseDate: formDataObj.releaseDate,
    shopurl: formDataObj.shopurl,
    imageurl: formDataObj.imageurl,
    musicurl: formDataObj.musicurl,
    tracklist: [],
    devData: {
      id: "w" + JSON.parse(localStorage.getItem("wishlist")).length,
      status: "TESTING",
      wishlistedDate: curDate
    }
	};

  for(var i = 0; i < trackCount; i++) {
    const curr = document.getElementById(`tracklist${i + 1}`).value;
    newListItem.tracklist.push({
      trackName: curr,
      trackNum: i + 1,
    })
  }
  console.log(newListItem);
  return newListItem;
}

async function addToWishlist(){
  const apiUrl = `https://api.github.com/repos/Guinewok/vinylWishlist/contents/test.json`;
  const newObject = await parseFormData();
  const authToken = localStorage.getItem("authToken");
  
  //Check for Auth Token
  if(authToken === "") {
    showDialog();
    console.log("Invalid Token");
  }else{
    const newArray = JSON.parse(localStorage.getItem("wishlist"));
    newArray.push(newObject);
    
    const commitMessage = `Add ${newObject.albumName} by ${newObject.artistName} to the vinyl wishlist`;
    
    console.log("newArray: ", newArray);
    const base64Content = btoa(JSON.stringify(newArray, null, 2)); 

    const requestBody = {
      message: commitMessage,
      content: base64Content,
      sha: localStorage.getItem("sha"),
    };
    console.log(requestBody);

    fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    console.log('File updated and changes pushed to GitHub.');
  }
};

function renderWishlist(e, increment){
    e = e || window.event;
    e.preventDefault();
  
    if(increment === true) {
      incrementVar++;
    }else{
      if(increment === false) {
        incrementVar--;
      }
    }
  
    const wishlist = JSON.parse(localStorage.getItem("wishlist"));
    const i = incrementVar;
  
    if(incrementVar === 0){
      lBtn = document.getElementById('lBtn');
      lBtn.setAttribute('disabled', 'disabled');
    }else{
      lBtn = document.getElementById('lBtn');
      lBtn.removeAttribute('disabled');
    }
    if(incrementVar + 1 === wishlist.length){
      rBtn = document.getElementById('rBtn');
      rBtn.setAttribute('disabled', 'disabled');
    }else{
      rBtn = document.getElementById('rBtn');
      rBtn.removeAttribute('disabled');
    }

    const title = document.getElementById('wishTitle');
    title.innerHTML = `Album Name: ${wishlist[i].albumName}`;

    const subtitle = document.getElementById('wishArtist');
    subtitle.innerHTML = `Artist: ${wishlist[i].artistName}`;

    const image = document.getElementById('wishImg');
    image.src = wishlist[i].imageurl;
    image.alt = "test text for now";

    const oldTrackList = document.getElementById('wishTracklist');
    oldTrackList.remove();

    const trackList = document.createElement('ul');
    trackList.setAttribute('id', 'wishTracklist');

    var currTrackList = wishlist[i].tracklist;

    for(x = 0; x < currTrackList.length; x++){
      const createLi = document.createElement('li');
      createLi.innerHTML = currTrackList[x].trackName;
      trackList.append(...[createLi]);
    }

    const desc = document.getElementById('wishDesc');
    desc.innerHTML = wishlist[i].description;

    const link = document.getElementById('wishShopLink');
    link.href = wishlist[i].shopurl;
    link.innerHTML = wishlist[i].shopurl;

    const displayContainer = document.getElementById('display');
    displayContainer.append(...[title, subtitle, image, trackList, desc, link]);
  };

function renderCollection(){
  const collection = JSON.parse(localStorage.getItem("collection"));

  const colDiv = document.getElementById('collectionList');
  while (colDiv.hasChildNodes()) {
    colDiv.removeChild(colDiv.firstChild);
  }

  for(i = 0; i < collection.length; i++){
    const colImg = document.createElement('img');
    colImg.src = collection[i].imageurl;
    //colImg.alt = data.collection[i].albumName;
    colImg.classList.add('colVinylImage');

    colDiv.append(...[colImg]);
  }
};

function mapFormTracklist() {
  for(var i = 0; i < trackCount; i++) {
    var curr = i + 1;
    document.getElementById('tracklistList').innerHTML += 
    `<label for="tracklist${curr}" id="tracklist${curr}Lbl" class="formTrack">Track ${curr}:</label>
    <input type="text" name="tracklist${curr}" id="tracklist${curr}" class="formTrack"></input>`;
  }
}

//TODO adjust this approach, when selecting add the other fields are cleared.
  //IDEA: Add another function that quickly saves each input field to an array or localStorage and run the function at the beginning of both addTrack and removeTrack
function addTrack(event) {
  event.preventDefault()
  trackCount += 1;
  document.getElementById('tracklistList').innerHTML += 
    `<label for="tracklist${trackCount}" id="tracklist${trackCount}Lbl" class="formTrack">Track ${trackCount}:</label>
    <input type="text" name="tracklist${trackCount}" id="tracklist${trackCount}" class="formTrack"></input>`;
}

function removeTrack(event) {
  event.preventDefault();
  if (trackCount > 0) {
document.getElementById(`tracklist${trackCount}Lbl`).remove();
   document.getElementById(`tracklist${trackCount}`).remove();
  trackCount -= 1;
  }else{
    //TODO add a css effect to the button to indicate it isn't usable.
    console.log('No more tracks to remove');
  }
}

function showDialog(e) {
  e.preventDefault();
  const authTokenVal = document.getElementById("authToken");
  authTokenVal.value = localStorage.getItem("authToken");
  const dialog = document.getElementById('authDialog');
  dialog.showModal();
};

function hideDialog() {
  const dialog = document.getElementById('authDialog');
  dialog.close();
};

function getAuthToken(e) {
  e.preventDefault();
  const authTokenVal = document.getElementById("authToken").value;
  if (authTokenVal.length > 0) {
    localStorage.setItem("authToken", authTokenVal);
    console.log(authTokenVal);
    hideDialog();
  }else{
    //Handle errors here, display error message
    console.log("Invalid Auth Token entered");
  }
};

//DEV FUNCTION TO REPLACE PAGE TITLE WITH CURRENT WISHLIST PAGE COUNT
async function updateCount(){
  const test = document.getElementById('test');
  test.innerHTML = `value: ${incrementVar}`;
  return false;
};

function mapDevData() {
  const preElement = document.getElementById('preElement');
  preElement.innerHTML = `"Wishlist":` + localStorage.getItem("wishlist");
  preElement.innerHTML += `,\n"Collection":` + localStorage.getItem("collection");
  preElement.innerHTML += `,\n"Removed":` + localStorage.getItem("removed");
};
