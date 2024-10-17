var incrementVar = 0;
//TODO implement a way to exclude devData with this value.  Currently only works with the collection
var devData = 1;
var trackCount = 3;
var dialogHidden = true;
const githubRepo = 'Guinewok/vinylWishlist';
//const fileName = 'vinylWishlist.json';
//const status = 'wishlisted';
const fileName = 'test.json';
const status = 'TESTING';
var searchResultsArr = [];
const statusArr = ["TESTING", "wishlisted", "collected", "removed"];

window.addEventListener("load", () => {
  //localStorage.clear();
  testGetData()
  renderWishlist();
  pivotToggle(0);
  populateGenres();
  localStorage.removeItem("pageToken");
});


// #region parseFormData
function parseFormData() {
  //Get form
  let form = document.querySelector('form');
  var myFormData = new FormData(form);
  const formDataObj = {};
  myFormData.forEach((value, key) => (formDataObj[key] = value));
  console.log("Form Values: ", formDataObj);
  
  for(var i in formDataObj){
    if(formDataObj[i].length < 1){
      formDataObj[i] = "None";
    }
  }
  console.log("Form Values: ", formDataObj);
  const curDate = new Date();
 
  const newListItem = {
			albumName: formDataObj.albumName,
			artistName: formDataObj.artistName,
      description: formDataObj.description,
			design: {
        color: formDataObj.color,
        colorSec: formDataObj.colorSec,
        vinylStyle: formDataObj.vinylStyle
      },
			price: formDataObj.price,
			releaseDate: formDataObj.releaseDate,
			shopurl: formDataObj.shopurl,
			imageurl: formDataObj.imageurl,
			musicurl: formDataObj.musicurl,
      tracklist: [],
			devData: {
				id: "w" + JSON.parse(localStorage.getItem("wishlist")).length,
				status: status,
				wishlistedDate: curDate
			}
		};
//TODO Add error catching
  for(var i = 0; i < trackCount; i++) {
    const curr = document.getElementById(`tracknum${i + 1}`).value;
    newListItem.tracklist.push({
      trackName: curr,
      trackNum: i + 1,
    })
  }
  console.log("Form Converted to JSON Object: ", newListItem);
  return newListItem;
}

// #region addToWishlist
async function addToWishlist(){
  const apiUrl = `https://api.github.com/repos/${githubRepo}/contents/${fileName}`;
  const newObject = await parseFormData();
  const authToken = localStorage.getItem("authToken");
  //Check for Auth Token
  if(!authToken) {
    showAuthDialog();
  }else{
    const wishlist = JSON.parse(localStorage.getItem("wishlist"));
    wishlist[wishlist.length] = newObject;
    const fullObj = JSON.parse(localStorage.getItem("fullList"));
    fullObj.wishlist = wishlist;
    console.log("Updated Object: ", fullObj);
   
    const commitMessage = `Add ${newObject.albumName} by ${newObject.artistName} to the vinyl wishlist`;
    const base64Content = btoa(JSON.stringify(fullObj, null, 2)); 

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
    }).then((response) => {
      if(response.ok) {
        showSubmitDialog("Success <br> File updated and changes pushed to GitHub.");
      }
        showSubmitDialog(`Failed to add album "${newObject.albumName} by ${newObject.artistName}": ${response.status}`);
    });
    pivotToggle(0);
    };
};

function renderWishlist(increment){
    const wishlist = JSON.parse(localStorage.getItem("wishlist"));
    const display = document.getElementById('display');
    const i = incrementVar;
    var tracklist = ""; 
  
    if(increment === true) {
      incrementVar++;
    }else{
      if(increment === false) {
        incrementVar--;
      }
    }
  
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
         
    wishlist[i].tracklist.forEach((item) => {
      tracklist += `<li>${item.trackName}</li>`;
    })
  
    const vinyl = `
      <span id="wishlistButtonMenu">
        <a href="#" id="markAsOwned" onclick="showAddToColDialog(event)">Mark as Owned</a>
        <a href="#" id="wishlistEditBtn">Edit Item</a>
        <a href="#" onclick="refreshWishlist(event)">Refresh</a>
      </span>
      <p class="titleText" id="wishTitle">${wishlist[i].albumName}</p>
      <p class="subTitleText" id="wishArtist">${wishlist[i].artistName}</p>
      <p class="releaseText" id="releaseDate">${wishlist[i].releaseDate}</p>
      <img 
        class="vinylImage" 
        src="${wishlist[i].imageurl}" 
        alt="The vinyl for ${wishlist[i].albumName} by ${wishlist[i].artistName}" 
        id="wishImg">
      </img>
      <p id="wishDesc">${wishlist[i].description}</p>
      <ul id="wishTracklist">${tracklist}</ul>
      <p id="shopLinkLbl" class="wishLinkLbl">Buy Here: </p>
      <a href="" id="wishShopLink" class="wishLinks">${wishlist[i].shopurl}</a>
      <p id="musicLinkLbl" class="wishLinkLbl">Listen Here: </p>
      <a href="" id="wishMusicLink" class="wishLinks">${wishlist[i].musicurl}</a>
    `;
  display.innerHTML = vinyl;
};

// #region renderCollection
function renderCollection(){
  const collection = JSON.parse(localStorage.getItem("collection"));

  const colDiv = document.getElementById('collectionList');
  while (colDiv.hasChildNodes()) {
    colDiv.removeChild(colDiv.firstChild);
  }

  for(i = devData; i < collection.length; i++){
    const colItem = document.createElement('div');
    colItem.classList.add('colItem');
    colItem.innerHTML = `<a href="#" class="colEditBtn" onclick="editItem(event, '${collection[i].devData.id}');">edit</a><p>${collection[i].albumName}</p>`;
    const colImg = document.createElement('img');
    colImg.src = collection[i].imageurl;
    //colImg.alt = data.collection[i].albumName;
    colImg.classList.add('colVinylImage');
    colItem.append(...[colImg]);
    colDiv.append(...[colItem]);
  }
};

// #region Tracklist Logic
function mapFormTracklist(totalCount) {
  document.getElementById('tracklistList').innerHTML = "<label>Tracklist:</label><br>";
  trackCount = totalCount;
  for(var i = 0; i < totalCount; i++) {
    var curr = i + 1;
    document.getElementById('tracklistList').innerHTML += 
    `<label for="tracknum${curr}" id="tracknum${curr}Lbl" class="formTrack">Track ${curr}:</label>
    <input type="text" name="tracknum${curr}" id="tracknum${curr}" class="formTrack"></input>`;
  }
}

function addTrack(e) {
  e = e || window.event;
  e.preventDefault();
  trackCount += 1;
  console.log(trackCount);
  /*document.getElementById('tracklistList').innerHTML += 
    `<label for="tracknum${trackCount}" id="tracklist${trackCount}Lbl" class="formTrack">Track ${trackCount}:</label>
    <input type="text" name="tracknum${trackCount}" id="tracknum${trackCount}" class="formTrack"></input>`;*/
  document.getElementById('tracklistList').insertAdjacentHTML('beforeend',
    `<label for="tracknum${trackCount}" id="tracknum${trackCount}Lbl" class="formTrack">Track ${trackCount}:</label>
    <input type="text" name="tracknum${trackCount}" id="tracknum${trackCount}" class="formTrack"></input>`);
}

function removeTrack(event) {
  event.preventDefault();
  if (trackCount > 0) {
document.getElementById(`tracknum${trackCount}Lbl`).remove();
   document.getElementById(`tracknum${trackCount}`).remove();
  trackCount -= 1;
  }else{
    //TODO add a css effect to the button to indicate it isn't usable.
    console.log('No more tracks to remove');
  }
}

// #region Dialog functions
function showAuthDialog() {
  const authTokenVal = document.getElementById("authToken");
  authTokenVal.value = localStorage.getItem("authToken");
  const dialog = document.getElementById('authDialog');
  dialog.showModal();
};

function hideAuthDialog() {
  const dialog = document.getElementById('authDialog');
  dialog.close();
};

function showAddToColDialog(e, id) {
  e = e || window.event;
  e.preventDefault();
  const dialog = document.getElementById('addToColDialog');
  dialog.showModal();
};

function hideAddToColDialog() {
  const dialog = document.getElementById('addToColDialog');
  dialog.close();
};

function showSubmitDialog(status) {
  const dialogText = document.getElementById('submissionStatus');
  dialogText.innerHTML = status;
  const dialog = document.getElementById('submitDialog');
  dialog.showModal();
};

function hideSubmitDialog() {
  const dialog = document.getElementById('submitDialog');
  dialog.close();
};

function getAuthToken(e) {
  e = e || window.event;
  e.preventDefault();
  const authTokenVal = document.getElementById("authToken").value;
  if (authTokenVal.length > 0) {
    localStorage.setItem("authToken", authTokenVal);
    console.log("Auth Token: ", authTokenVal);
    hideAuthDialog();
  }else{
    //Handle errors here, display error message
    console.log("Invalid Auth Token entered");
  }
};

// #region getItem
function getItem (currVal) {
  var firstChar = currVal.toString().charAt(0);
  switch(firstChar) {
    case 'w':
      var list = localStorage.getItem("wishlist");
      break;
    case 'c':
      var list = localStorage.getItem("collection");
      break;
    case 'r':
      var list = localStorage.getItem("removed");
      break;
    default:
      console.error(`[script.js - getItem] Invalid list id, received: ${firstChar}`);
      break;
  }
  console.log(currVal);
  const array = JSON.parse(list);
  var index = currVal.replace(firstChar, "");
  var item = array[index];
  return item;
};

// #region mapExistingToForm
function mapExistingToForm(item) {
  let form = document.querySelector('form');
  var myFormData = new FormData(form);
  for(var i in item){
    if(i === "devData"){
      break;
    }else{
      if(i === "design"){
        for(var d in item[i]){
          var field = document.getElementById(d);
          field.value = item[i][d];
        }
      }else{
        if(i === "tracklist"){
          for(let x = 0; x < item[i].length; x++){
            var trackField = document.getElementById(`tracknum${x + 1}`);
            trackField.value = item[i][x].trackName;
          }
        }else{
          console.log(item[i]);
          var field = document.getElementById(i);
          field.value = item[i];
        }
      }
    }
  }
  const trackList = item.tracklist;
  for(var i = 0; i < trackList.length; i++){
      var trackField = document.getElementById(`tracknum${i+1}`);
      trackField.value = trackList[i].trackName;
  }
};

// #region loadEditForm
function loadEditForm(item) {
  document.getElementById('formTitle').innerHTML = `Update ${item.albumName} by ${item.artistName}`;
  document.getElementById('formBtns').innerHTML = "";
  document.getElementById('formBtns').innerHTML = 
    `<input type="submit" id="update" onclick="updateList(${item.devData.id.substring(1)});" target="#" value="Update">
    <input type="button" id="remove" value="Remove">
    <input type="button" id="cancel" value="Cancel" onclick="document.forms[0].reset();pivotToggle(0);">`;
};

// #region editItem
function editItem(e, currVal) {
  e = e || window.event;
  e.preventDefault();
  const item = getItem(currVal);
  loadEditForm(item);
  pivotToggle(1);
  mapFormTracklist(item.tracklist.length);
  mapExistingToForm(item);
};

// #region updateList
//TODO test and ensure the correct item is the one being modified, avoid duplicates
async function updateList(index){
  const apiUrl = `https://api.github.com/repos/${githubRepo}/contents/${fileName}`;
  const updateObject = await parseFormData();
  const authToken = localStorage.getItem("authToken");
  console.log(authToken);
  if(!authToken) {
    showAuthDialog();
    console.log("Invalid Token");
  }else{
    const wishlist = JSON.parse(localStorage.getItem("wishlist"));
    console.log("Original Item: ", wishlist[index]);
    //This is a bandaid, the approach must be reworked as parseFormData() automatically generates the date value as it wasn't engineered to be used like this.  Current approach grabs the unedited version of devData and manually overwrites it evertime.
    const ogDevData = wishlist[index].devData;
    wishlist[index] = updateObject;
    wishlist[index].devData = ogDevData;
    const fullObj = JSON.parse(localStorage.getItem("fullList"));
    fullObj.wishlist = wishlist;
    console.log("Updated Object: ", fullObj);
   
    const commitMessage = `Update details for ${updateObject.albumName} by ${updateObject.artistName} in the vinyl wishlist`;
    const base64Content = btoa(JSON.stringify(fullObj, null, 2)); 

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
      body: JSON.stringify(requestBody)
    });
    console.log('File updated and changes pushed to GitHub.');
    pivotToggle(0);
  };
};

// #region updateColorHex
function updateColorHex(currElement) {
  const inputField = document.getElementById(`${currElement}`);
  const fieldId = currElement + "Hex";
  const colorField = document.getElementById(`${fieldId}`);
  inputField.value = colorField.value;
};

// #region refreshWishlist
function refreshWishlist(){
    getData();
    renderWishlist();
};

// #region updateWishToCol
function updateWishToCol(id) {
  const authToken = localStorage.getItem("authToken");
  if(!authToken) {
    showAuthDialog();
  }else{
    console.log('token present: ', authToken);
    //do something
  }
};

// #region Dev Functions
async function updateCount(){
  const test = document.getElementById('test');
  test.innerHTML = `value: ${incrementVar}`;
};

function mapDevData() {
  const preElement = document.getElementById('preElement');
  preElement.innerHTML = `"Wishlist":` + localStorage.getItem("wishlist");
  preElement.innerHTML += `,\n"Collection":` + localStorage.getItem("collection");
  preElement.innerHTML += `,\n"Removed":` + localStorage.getItem("removed");
};

const topicSelected = "";

// #region Youtube API Logic

//TODO - The "search" endpoint has a single query cost of 100 units, meaning each time this query is called it costs 100 units of the 10000 units alloted for the key.  Need to store the results in an array and parse it to avoid excess query calls.  If the quota is hit this feature will not work until 2am the next day.
async function youtubeSearch(hasPageToken) {
  const key = localStorage.getItem("YoutubeAPIKey");
  const maxResults = 100;
  const displayResults = 5;
  const q = document.getElementById('searchtest').value;
  const type = "";
  const order = "relevance";
  const topic = localStorage.getItem("topic");
  const pageToken = hasPageToken ? hasPageToken : null;
  const response = await 
  fetch(`https://www.googleapis.com/youtube/v3/search?` +
    `key=${key}` +
    `&maxResults${maxResults}` +
    `&topicId=${topic}` +
    `&order=${order}` +
    `&part=snippet` +
    `&type=${type}${(pageToken != "undefined" && pageToken != null) ? "".concat("&pageToken=",pageToken) : ""}` +
    `&q=${q}`, 
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  
  localStorage.setItem("apiData", data);
  for(var item in data) {
    searchResultsArr.push([item, data[item]]);
  }
  console.log(searchResultsArr);
  
  
  // const prevBtn = document.getElementById('wipPrev');
  // prevBtn.onclick = `youtubeSearch(data.prevPageToken)`;
  // const nextBtn = document.getElementById('wipNext');
  // nextBtn.onclick = `youtubeSearch(data.nextPageToken)`;
  
  const preElement = document.getElementById('responseTest');
  const resultsElement = document.getElementById('searchResults');
  resultsElement.innerHTML = "";
  for(i = 0; i < displayResults; i++) {
    const resultItemContainer = document.createElement("div");
    resultItemContainer.classList.add('searchItem');
    resultItemContainer.id = data.items[i].snippet.channelId;
    
    const channelContainer = document.createElement('div');
    channelContainer.classList.add("channelContainer");
    
    const resultName = document.createElement('p');
    resultName.innerHTML = data.items[i].snippet.channelTitle;
    
    const resultId = document.createElement('sub');
    resultId.innerHTML = data.items[i].snippet.channelId;
    
    const resultDesc = document.createElement('p');
    resultDesc.innerHTML = data.items[i].snippet.description;
    
    const resultThumb = document.createElement('img');
    resultThumb.src = data.items[i].snippet.thumbnails.default.url;
    resultThumb.classList.add('resultImg');
    
    const resultURL = document.createElement('a');
    resultURL.href = `https://www.youtube.com/channel/${data.items[i].snippet.channelId}`;
    resultURL.innerHTML = `https://www.youtube.com/channel/${data.items[i].snippet.channelId}`;
    
    const resultPlaylistsBtn = document.createElement("button");
    resultPlaylistsBtn.setAttribute('onclick',`viewPlaylists( '${data.items[i].snippet.channelId}')`);
    resultPlaylistsBtn.innerHTML = "View Playlists";
    
    channelContainer.append(...[resultName, resultId, resultDesc, resultURL, resultPlaylistsBtn]);
    
    resultItemContainer.append(...[resultThumb, channelContainer ]);
    resultsElement.append(resultItemContainer);
    
    console.log(data);
  }
};

function changePage(index, pageToken) {
  
  //Get the index and pagelength and re-render it to the results
};

async function viewPlaylists(channelId) {
  const key = localStorage.getItem("YoutubeAPIKey");
  const response = await 
  fetch(`https://www.googleapis.com/youtube/v3/playlists?key=${key}&part=snippet&channelId=${channelId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  console.log(data);
  const searchItemContainer = document.getElementById(channelId);
  
  const playlistsContainer = document.createElement('div');
  playlistsContainer.classList.add('playlistsContainer');
  for(i = 0; i < data.items.length; i++) {
    const resultItemContainer = document.createElement("div");
    resultItemContainer.classList.add('playlists');
    resultItemContainer.id = data.items[i].id;
    
    const playlistDetailsContainer = document.createElement("div");
    playlistDetailsContainer.classList.add('playlistDetails');
    
    const playlistTitle = document.createElement('p');
    playlistTitle.innerHTML = data.items[i].snippet.title;
    
    const playlistUrl = document.createElement('a');
    playlistUrl.href = `https://www.youtube.com/playlist?list=${data.items[i].id}`;
    playlistUrl.innerHTML = `https://www.youtube.com/playlist?list=${data.items[i].id}`;
    
    const playlistId = document.createElement('p');
    playlistId.innerHTML = data.items[i].id;
    
    const playlistThumb = document.createElement('img');
    playlistThumb.src = data.items[i].snippet.thumbnails.default.url;
    playlistThumb.classList.add('playlistImg');
    
    const playListsSongBtn = document.createElement('button');
    playListsSongBtn.setAttribute('onclick',`getPlaylistVideos('${data.items[i].id}')`);
    playListsSongBtn.innerHTML = "View Videos";
    
    const playlistsVideoSection = document.createElement('div');
    playlistsVideoSection.id = `list-${data.items[i].id}`;
    playlistsVideoSection.classList.add('videos');
    
  playlistDetailsContainer.append(...[playlistTitle, playlistUrl, playlistId, playListsSongBtn, playlistsVideoSection]);
    resultItemContainer.append(playlistThumb, playlistDetailsContainer);
    playlistsContainer.append(resultItemContainer);
    searchItemContainer.append(playlistsContainer);
  }
};

async function getPlaylistVideos(playlistId) {
  const key = localStorage.getItem("YoutubeAPIKey");
  console.log(key);
  const response = await 
 fetch(`https://www.googleapis.com/youtube/v3/playlistItems?key=${key}&part=snippet&maxResults=30&playlistId=${playlistId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  const playlistItemContainer = document.getElementById(playlistId);
  
  const videoListContainer = document.getElementById(`list-${playlistId}`);
  videoListContainer.innerHTML = "";
  
  for(i = 0; i < data.items.length; i++) {
    const videoTitle = document.createElement('p');
    videoTitle.innerHTML = data.items[i].snippet.title;
    
    /*const videoId = document.createElement('p');
    videoId.innerHTML = data.items[i].id;*/
    
    /*const videoThumb = document.createElement('img');
    videoThumb.src = data.items[i].snippet.thumbnails.default.url;
    videoThumb.classList.add('videoImg');*/
    
    videoListContainer.append(...[videoTitle]);
    playlistItemContainer.append(videoListContainer);
  }
};

const topicArray = [
  {code: "", name: "No Genre"},
  {code: "/m/04rlf", name: "Music (parent topic)"},
  {code: "/m/02mscn", name: "Christian music"},
  {code: "/m/0ggq0m", name: "Classical music"},
  {code: "/m/01lyv", name: "Country"},
  {code: "/m/02lkt", name: "Electronic music"},
  {code: "/m/0glt670", name: "Hip hop music"},
  {code: "/m/05rwpb", name: "Independent music"},
  {code: "/m/03_d0", name: "Jazz"},
  {code: "/m/028sqc", name: "Music of Asia"},
  {code: "/m/0g293", name: "Music of Latin America"},
  {code: "/m/064t9", name: "Pop music"},
  {code: "/m/06cqb", name: "Reggae"},
  {code: "/m/06j6l", name: "Rhythm and blues"},
  {code: "/m/06by7", name: "Rock music"},
  {code: "/m/0gywn", name: "Soul music"}
];

function populateGenres() {
  const dropdown = document.getElementById('genreDropdown');
  for(let i = 0; i < topicArray.length; i++) {
    const option = document.createElement('option');
    option.value = topicArray[i].code;
    option.innerHTML = topicArray[i].name;
    dropdown.append(option);
  }
};

const genreDropdown = document.getElementById('genreDropdown');

genreDropdown.addEventListener("change", (item) => {
  console.log("selection made: ", item.target.value);
  localStorage.setItem("topic", item.target.value);
});

function clearGenre() {
  localStorage.removeItem("topic");
};

function getYoutubeAPIKey() {
  const apikey = document.getElementById('apiKey');
  localStorage.setItem("YoutubeAPIKey", apikey.value);
}

//TODO - Add an eventListener to get the current search box input with a timeout and auto look up its contents
//TODO - Look into filtering the content returned by CategoryID = 10 (music)
//https://developers.google.com/youtube/v3/docs/videoCategories/list?apix_params=%7B%22part%22%3A%5B%22snippet%22%5D%2C%22regionCode%22%3A%22US%22%7D#usage

//TODO - WIP function to handle any additions to any of the 3 lists
async function addToList(listName, index){
  const apiUrl = `https://api.github.com/repos/${githubRepo}/contents/${fileName}`;
  //Only do this if the listName is wishlist, try passing the function call as item in params
  const newObject = getItem(index);
  console.log("newObject", newObject);
  //const newObject = await parseFormData();
  
  const authToken = localStorage.getItem("authToken");
  //Check for Auth Token
  if(!authToken) {
    showAuthDialog();
  }else{
    const list = JSON.parse(localStorage.getItem(listName));
    console.log(list);
    list[list.length] = newObject;
    const fullObj = JSON.parse(localStorage.getItem("fullList"));
    let commitMessage = "";
    switch(listName) {
      case 'wishlist': {
        fullObj.wishlist = list;
        commitMessage = `Add ${newObject.albumName} by ${newObject.artistName} to the vinyl wishlist`;
        break;
      }
      case 'collection': {
        fullObj.collection = list;
        commitMessage = `Add ${newObject.albumName} by ${newObject.artistName} to the vinyl collection`;
        break;
      }
      case 'removed': {
        fullObj.removed = list;
        commitMessage = `Remove ${newObject.albumName} by ${newObject.artistName} from the ${listName}`;
        break;
      }
      default: {
        console.log("failed");
        commitMessage = "No list was selected";
      }
    };
    //fullObj.wishlist = list;
    console.log("Updated Object: ", fullObj);
   
    /*const commitMessage = `Add ${newObject.albumName} by ${newObject.artistName} to the vinyl wishlist`;*/
    const base64Content = btoa(JSON.stringify(fullObj, null, 2)); 

    const requestBody = {
      message: commitMessage,
      content: base64Content,
      sha: localStorage.getItem("sha"),
    };
    console.log(requestBody);
    pivotToggle(0);
    };
};

// #region Logic Restructure
//NEW STRUCTURE CONCEPT
/**********************************
Need the following functions to be created/rebuilt:
  -addToList
    -Accepts listName and item index(devdata.id)(optional)
    -Adds an item to a list
    -DOES NOT PUSH CHANGES
    -Returns a changed object
    
  -removeFromList
    -Accepts listName and item index(devdata.id)
    -removes an item from a list
    -DOES NOT PUSH CHANGES
    -Returns a changed object
    
  -updateList
    -Accepts listName and item index(devdata.id)
    -Modifies an item in a list
    -DOES NOT PUSH CHANGES
    -Returns a changed object
    
  -createRequestBody
    -Accepts changed objects
    -Creates request bodies with commit messages
    -DOES NOT PUSH TO REPO
    
  -pushToRepo
    -Accepts request bodies
    -Takes changes made and pushes them to the repo
    
--------------------------
  INTENDED WORKFLOWS
--------------------------
    addListItem(listName, pivotTo){
      const add = addToList(listName);
      const requestBody = createRequestBody(add);
      pushToRepo(requestBody);
      pivotToggle(pivotTo);
    }
    
    transferListItem(fromCol, toCol, itemIndex, pivotTo){
      //Need to get the return values from both of these functions
      const add = addToList(toCol, itemIndex);
      const remove = removeFromList(fromCol, itemIndex);
      //Need to plan out how more than one change can be made into a request body
      //If too complex, a second createRequestBody can be made, or it can be handled in workflow functions
      const requestBody = createRequestBody(add, remove);
      pushToRepo(requestBody);
      pivotToggle(pivotTo);
    }
    
    updateListItem(listName, itemIndex, pivotTo){
      const update = updateList(listName, itemIndex);
      const requestBody = createRequestBody(update);
      pushToRepo(requestBody);
      pivotToggle(pivotTo);
    }
    
    removeListItem(listName, itemIndex, pivotTo){
      const remove = removeFromList(listName, itemIndex);
      const requestBody = createRequestBody(remove);
      pustToRepo(requestBody);
      pivotToggle(pivotTo);
    }
**********************************/
async function testGetData() {
  const response = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${fileName}`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json' 
    },
  });

  const data = await response.json();
  const dataParsed = JSON.parse(atob(data.content));
  const arr = ["wishlist", "collection", "removed"];

  localStorage.setItem("fullList", JSON.stringify(dataParsed, null, 2));
  localStorage.setItem("sha", data.sha);
  arr.forEach((item) => {
    localStorage.setItem(item, JSON.stringify(dataParsed[item], null, 2));
    console.log(`${item}: `, JSON.parse(localStorage.getItem(item)));
  });
};


function pivotToggle(pivotNum) {
  var pivotArray = ["carousel","addFormPage","collection","na", "wip"];

  pivotArray.forEach((item) => {
    $(`#${item}`).hide();
    if(item === pivotArray[pivotNum]) {
      $(`#${pivotArray[pivotNum]}`).show();
    }
  });
};

function testParseFormData(listName, status) {
  var myFormData = new FormData(document.querySelector('form'));
  const formDataObj = {};
  myFormData.forEach((value, key) => (formDataObj[key] = value));
  for(var i in formDataObj){
    if(formDataObj[i].length < 1){
      formDataObj[i] = "None";
    }
  }
 
  const newListItem = {
			albumName: formDataObj.albumName,
			artistName: formDataObj.artistName,
      description: formDataObj.description,
			design: {
        color: formDataObj.color,
        colorSec: formDataObj.colorSec,
        vinylStyle: formDataObj.vinylStyle
      },
			price: formDataObj.price,
			releaseDate: formDataObj.releaseDate,
			shopurl: formDataObj.shopurl,
			imageurl: formDataObj.imageurl,
			musicurl: formDataObj.musicurl,
      tracklist: [],
			devData: {
        id: listName.slice(0,1) + JSON.parse(localStorage.getItem(listName)).length,
        status: status,
        modifiedDate: new Date(),
        wishlistedDate: "",
        collectedDate: "",
        removedDate: "",
      }
      /*
      apiDetails: {
        channelId: formDataObj.channelId,
        playlistId: formDataObj.playlistId
      }
      */
		};
  for(var i = 0; i < trackCount; i++) {
    const curr = document.getElementById(`tracknum${i + 1}`).value;
    newListItem.tracklist.push({
      trackName: curr,
      trackNum: i + 1,
    })
  };

  if(listName === "wishlist"){ 
    newListItem.devData.wishlistedDate = new Date() 
  };
  if(listName === "collection"){
    newListItem.devData.collectedDate = new Date() 
  };
  if(listName === "removed"){
    newListItem.devData.removedDate = new Date() 
  };
  console.log("Form Converted to JSON Object: ", newListItem);
  return newListItem;
};


//FOR ADDING A VINYL TO WISHLIST OR COLLECTION
async function testAddToList(listName, item){
  const newObject = await item;

  //Append new object to the end of the list
  const list = JSON.parse(localStorage.getItem(listName));
  list[list.length] = newObject;
  
  //Get the fullList object
  const fullObj = JSON.parse(localStorage.getItem("fullList"));
  //Overwrite the corresponding section
  let commitMessage = "";
  switch(listName) {
      case 'wishlist': {
        fullObj.wishlist = list;
        commitMessage = `Add ${newObject.albumName} by ${newObject.artistName} to the ${listName}`;
        break;
      }
      case 'collection': {
        fullObj.collection = list;
        commitMessage = `Add ${newObject.albumName} by ${newObject.artistName} to the ${listName}`;
        break;
      }
      case 'removed': {
        fullObj.removed = list;
        commitMessage = `Remove ${newObject.albumName} by ${newObject.artistName}`;
        break;
      }
      default: {
        console.log("FAILED - No listName was provided");
      }
    };
  return [fullObj, commitMessage];
};


//FOR UPDATING THE DATA OF AN EXISTING ITEM IN A LIST
async function testUpdateList(listName, item) {
  const list = JSON.parse(localStorage.getItem(listName));
  const newObject = await item;
  console.log("Original Item: ", list[item.devData.id]);
  console.log("Original Item 2: ", item);

  list[item.devData.id] = newObject;
  const fullObj = JSON.parse(localStorage.getItem("fullList"));
  
  let commitMessage = `Update details for ${newObject.albumName} by ${newObject.artistName}`;
  switch(listName) {
    case 'wishlist': {
      fullObj.wishlist = list;
      break;
    }
    case 'collection': {
      fullObj.collection = list;
      break;
    }
    case 'removed': {
      fullObj.removed = list;
      break;
    }
    default: {
      console.log("FAILED - No listName was provided");
    }
  };
  console.log("Updated Object: ", fullObj);
  return [fullObj, commitMessage];
};


//FOR CREATING A REQUEST BODY TO SUBMIT TO THE PUSH FUNCTION
async function testCreateRequestBody(listName, item) {
  const fullItem = await item;
  
  const commitMessage = fullItem[1];
  
  const obj = fullItem[0];
  const base64Content = btoa(JSON.stringify(obj, null, 2));
  
  const requestBody = {
    message: commitMessage,
    content: base64Content,
    sha: localStorage.getItem("sha"),
  };
  return requestBody;
};


//FUNCTION TO PUSH CHANGES TO THE GITHUB REPO
async function testPushToRepo(promiseRequestBody) {
  const apiUrl = `https://api.github.com/repos/${githubRepo}/contents/${fileName}`;
  const authToken = localStorage.getItem("authToken");
  const requestBody = await promiseRequestBody;
  console.log("requestBody from push: ", requestBody);
  //Check for Auth Token
  if(!authToken) {
    showAuthDialog();
  }else{
    fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }).then((response) => {
      if(response.ok) {
        showSubmitDialog("Success <br> File updated and changes pushed to GitHub.");
      }else{
        showSubmitDialog(`Failed to ${requestBody.message}: ${response.status}`);
      }
    })
  }
};


//WORKFLOW FUNCTION - Add a Vinyl to the Wishlist or Collection
function testAddListItem(listName, pivotTo){
   const item = testParseFormData(listName, statusArr[1]);
   const add = testAddToList(listName, item);
   console.log("<Promise> - List Addition ", add);
  
   const requestBody = testCreateRequestBody(listName, add);
   console.log("<Promise> - requestBody: ", requestBody);
  
   //testPushToRepo(requestBody);
  
   //Refresh to get the new sha, otherwise encounter 409 error
   //getData();
  
   // if(pivotTo){pivotToggle(pivotTo)};
 };


//WORKFLOW FUNCTION - Update an existing Vinyl
function testUpdateListItem(listName, itemIndex, pivotEdit, pivotAfter){
  //Need to rework logic, should not require the form to populate in order to get the data
  const item = getItem(itemIndex);
  loadEditForm(item);
  console.log("update item: ", item);
  //Need to rework this logic, should not have to pass a status for an update, should not update fields it doesnt have to
  const parsed = testParseFormData(listName, statusArr[1]);
  const update = testUpdateList(listName, parsed);
  const requestBody = testCreateRequestBody(update);
  console.log("update requestBody: ", requestBody);
  //pushToRepo(requestBody);
  //if(pivotAfter){pivotToggle(pivotAfter)};
}