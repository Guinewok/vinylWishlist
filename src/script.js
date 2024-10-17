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

// #region TODO - set onclick events to clean up the html
// onclick for nav a - pivotToggle
$(document).on('click', '.navBtn', (e) => pivotToggle($(e.target).attr('data-pageId')));


$('.navBtn[data-pageId="1"]').on('click', () => {
  document.forms[0].reset();
  mapFormTracklist(trackCount);
});

$('.navBtn[data-pageId="2"]').on('click', () => {
  renderCollection();
});

// DIALOGS
// $(document).on('click', '#submitDialogClose', hideSubmitDialog());
// $(document).on('click', '.addToColClose', hideAddToColDialog());
// $(document).on('click', '#authDialogClose', hideAuthDialog());
// $(document).on('click', '#authDialogSubmit', (event: JQuery.ClickEvent) => {
//   event.preventDefault();
//   getAuthToken(event);
// });
// $(document).on('click', '#authDialogClear', localStorage.removeItem('authToken'));

// WISHLIST
$(document).on('click', '#lBtn', () => renderWishlist(false));
$(document).on('click', '#rBtn', () => renderWishlist(true));
$(document).on('click', '#markAsOwned', () => showAddToColDialog());
$(document).on('click', '#wishlistRefresh', () => refreshWishlist());

// ADD TO WISHLIST
// $(document).on('click', '.addFormListBtn', testAddListItem($(this).attr('data-listType')));
// $(document).on('click', '#setAuthTokenBtn', showAuthDialog());
// $(document).on('click', '#colorHex', updateColorHex('color'));
// $(document).on('click', '#colorSecHex', updateColorHex('colorSec'));
// $(document).on('click', '#formAddBtn', addTrack(event));
// $(document).on('click', '#formSubBtn', removeTrack(event));
// $(document).on('click', '#submit', () => {
//   if(document.forms['addForm'].reportValidity()){
//     addToWishlist();
//   };
// });

window.addEventListener("load", () => {
  //localStorage.clear();
  getData()
  renderWishlist();
  pivotToggle(0);
  populateGenres();
  localStorage.removeItem("pageToken");
});

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
      if(!response.ok) {
        showSubmitDialog(`Failed to add album "${newObject.albumName} by ${newObject.artistName}": ${response.status}`);
      }

      showSubmitDialog("Success <br> File updated and changes pushed to GitHub.");
    });
    pivotToggle(0);
    };
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
    }
  );
  const data = await response.json();
  
  localStorage.setItem("searchResults", data);
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
  resultsElement.innerHTML = ""; //Clear the element to avoid duplicates
  
  for(i = 0; i < displayResults; i++) {
    const searchItem = `
      <div class="searchItem" id="${data.items[i].snippet.channelId}">
        <div class="channelContainer">
          <p>${data.items[i].snippet.channelTitle}</p>
          <sub>${data.items[i].snippet.channelId}</sub>
          <p>${data.items[i].snippet.description}</p>
          <img 
            src="${data.items[i].snippet.thumbnails.default.url}" 
            class="resultImg"
          >
          </img>
          <a href="https://www.youtube.com/channel/${data.items[i].snippet.channelId}">
            https://www.youtube.com/channel/${data.items[i].snippet.channelId}
          </a>
          <button 
            type="button" 
            onclick="viewPlaylists('${data.items[i].snippet.channelId}')"
          >
            View Playlists
          </button>
          <div class="playlistsContainer"></div>
        </div>
      </div>
    `;
    resultsElement.innerHTML += searchItem;
  };
};

async function viewPlaylists(channelId) {
  const key = localStorage.getItem("YoutubeAPIKey");
  const response = await 
  fetch(`https://www.googleapis.com/youtube/v3/playlists?` +
    `key=${key}` +
    `&part=snippet` +
    `&channelId=${channelId}`, 
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );
  const data = await response.json();
  const searchItemContainer = document.getElementById(channelId);
  
  console.log(data);
  
  data.items.forEach((item) => {
    const test = `
      <div class="playlistsContainer">
        <div class="playlists" id="${item.id}">
          <div class="playlistDetails">
            <p>${item.snippet.title}</p>
            <a 
              href="https://www.youtube.com/playlist?list=${item.id}"
            >
              https://www.youtube.com/playlist?list=${item.id}
            </a>
            <p>${item.id}</p>
            <img src="${item.snippet.thumbnails.default.url}" class="playlistImg" alt=""></img>
            <button type="button" onclick="getPlaylistVideos('${item.id}')">View Videos</button>
            <div class="videos" id="list-${item.id}"></div>
          </div>
        </div>
      </div>
    `;
    searchItemContainer.innerHTML += test;
  });
  
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

$(document).on('click', '#submit', (e) => {
  //TODO - Add validity check to parse form or as it's own function thats called in parse form
  if(document.forms['addForm'].reportValidity()){
    workflowAddToList($(e.target).attr('data-list'))
  }
});

// #region Workflow Functions
//TODO - This workflow works great, needs to update the data-list attr on submit btn based on what is clicked
function workflowAddToList(listName, pivotTo){
  const formData = parseFormData(listName, status);
  const add = addToList(listName, formData);
  const requestBody = testCreateRequestBody(listName, add);
  testPushToRepo(requestBody);
  // pivotToggle(pivotTo);
}


async function getData() {
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


function renderWishlist(increment){
  const wishlist = JSON.parse(localStorage.getItem("wishlist"));
  let tracklist = '';

  if(increment !== undefined) {
    increment ? incrementVar++ : incrementVar--;
  } 

  incrementVar === 0 ? $('#lBtn').attr('disabled', 'disabled') : $('#lBtn').removeAttr('disabled');
  incrementVar + 1 === wishlist.length ? $('#rBtn').attr('disabled', 'disabled') : $('#rBtn').removeAttr('disabled');

  wishlist[incrementVar].tracklist.forEach((item) => {
    tracklist += `<li>${item.trackName}</li>`;
  });

  //TODO - remove the onclick here, bind with jquery
  const vinyl = `
    <span id="wishlistButtonMenu">
      <a href="#" id="markAsOwned">Mark as Owned</a>
      <a href="#" id="wishlistEditBtn">Edit Item</a>
      <a href="#" id="wishlistRefresh">Refresh</a>
    </span>
    <p class="titleText" id="wishTitle">${wishlist[incrementVar].albumName}</p>
    <p class="subTitleText" id="wishArtist">${wishlist[incrementVar].artistName}</p>
    <p class="releaseText" id="releaseDate">${wishlist[incrementVar].releaseDate}</p>
    <img 
      class="vinylImage" 
      src="${wishlist[incrementVar].imageurl}" 
      alt="The vinyl for ${wishlist[incrementVar].albumName} by ${wishlist[incrementVar].artistName}" 
      id="wishImg">
    </img>
    <p id="wishDesc">${wishlist[incrementVar].description}</p>
    <ul id="wishTracklist">${tracklist}</ul>
    <p id="shopLinkLbl" class="wishLinkLbl">Buy Here: </p>
    <a href="" id="wishShopLink" class="wishLinks">${wishlist[incrementVar].shopurl}</a>
    <p id="musicLinkLbl" class="wishLinkLbl">Listen Here: </p>
    <a href="" id="wishMusicLink" class="wishLinks">${wishlist[incrementVar].musicurl}</a>
  `;

  $('#display').html(vinyl);
};


function parseFormData(listName, status) {
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
        id: listName.substring(0, 1) + JSON.parse(localStorage.getItem(listName)).length,
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
      // trackName: $(`#tracknum${i + 1}`).val(),
      trackName: curr,
      trackNum: i + 1,
    })
  };

  switch(listName){
    case "wishlist":
      newListItem.devData.wishlistedDate = new Date(); 
      break;
    case "collection": 
      newListItem.devData.collectedDate = new Date();
      break;
    case "removed":
      newListItem.devData.removedDate = new Date();
      break;
    default:
      console.error(`[script.js - parseFormData] listName not provided`);
      break;
  }
  console.log("Form Converted to JSON Object: ", newListItem);
  return newListItem;
};


//FOR ADDING A VINYL TO WISHLIST OR COLLECTION
function addToList(listName, item){
  const fullObj = JSON.parse(localStorage.getItem("fullList"));
  const list = JSON.parse(localStorage.getItem(listName));
  //Append new object to the end of the list
  list[list.length] = item;
  
  //Overwrite the corresponding section
  let commitMessage = "";
  switch(listName) {
      case 'wishlist': {
        fullObj.wishlist = list;
        commitMessage = `Add ${item.albumName} by ${item.artistName} to the ${listName}`;
        break;
      }
      case 'collection': {
        fullObj.collection = list;
        commitMessage = `Add ${item.albumName} by ${item.artistName} to the ${listName}`;
        break;
      }
      case 'removed': {
        fullObj.removed = list;
        commitMessage = `Remove ${item.albumName} by ${item.artistName}`;
        break;
      }
      default: {
        console.error("[script.js - testAddToList] - Failed to update list, no listName was provided.");
      }
    };
  return [fullObj, commitMessage];
};


//FOR UPDATING THE DATA OF AN EXISTING ITEM IN A LIST
async function testUpdateList(listName, item) {
  const fullObj = JSON.parse(localStorage.getItem("fullList"));
  const list = JSON.parse(localStorage.getItem(listName));
  const commitMessage = `Update details for ${item.albumName} by ${item.artistName}`;

  list[item.devData.id] = item;
  
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
      console.error(`[script.js - testUpdateList] - No listName was provided`);
    }
  };
  console.log("[script.js - testUpdateList] - Updated Object: ", fullObj);
  return [fullObj, commitMessage];
};


//FOR CREATING A REQUEST BODY TO SUBMIT TO THE PUSH FUNCTION
function createRequestBody(listName, item) {
  const commitMessage = item[1];
  const obj = item[0];
  const base64Content = btoa(JSON.stringify(obj, null, 2));
  const requestBody = {
    message: commitMessage,
    content: base64Content,
    sha: localStorage.getItem("sha"),
  };
  return requestBody;
};


//FUNCTION TO PUSH CHANGES TO THE GITHUB REPO
async function pushToRepo(promiseRequestBody) {
  const apiUrl = `https://api.github.com/repos/${githubRepo}/contents/${fileName}`;
  const authToken = localStorage.getItem("authToken");
  console.log("requestBody from push: ", promiseRequestBody);
  //Check for Auth Token
  if(!authToken) {
    showAuthDialog();
  } else {
    fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(promiseRequestBody),
    })
    .then((response) => {
      if(response.ok) {
        showSubmitDialog("Success <br> File updated and changes pushed to GitHub.");
      } else {
        showSubmitDialog(`Failed to ${promiseRequestBody.message}: ${response.status}`);
      }
    })
  }
};


function testRenderCollection(){
  const collection = JSON.parse(localStorage.getItem("collection"));

  while($(collectionList).children().length > 0){
    $(collectionList).children().remove();
  }

  for(i = devData; i < collection.length; i++){
    const testColItem = `
      <div class="colItem">
        <a href="#" class="colEditBtn" onclick="editItem(event, '${collection[i].devData.id}');" editId="${collection[i].devData.id}">edit</a>
        <p>${collection[i].albumName}</p>
        <img src="${collection[i].imageurl}" class="colVinylImage"></img>
      </div>
    `;
    
    $('#collectionList').html(testColItem);
  }
};


function testMapExistingToForm(item) {
  let form = document.querySelector('form');
  var myFormData = new FormData(form);
  for(var obj in item){
    switch(obj) {
      case obj === "devData":
        break;
      case obj === "design":
        for(var value in item[obj]){
          $(value).val(item[obj][value]);
          // var field = document.getElementById(d);
          // field.value = item[i][d];
        }
        break;
      case obj === "tracklist":
        //item[obj].forEach(() => {})
        for(let x = 0; x < item[obj].length; x++){
          $(`#tracknum${x + 1}`).val(item[obj][x].trackName);
          // var trackField = document.getElementById(`tracknum${x + 1}`);
          // trackField.value = item[i][x].trackName;
        }
        break;
      default:
        console.log(item[obj]);
        $(obj).val(item[obj]);
        // var field = document.getElementById(i);
        // field.value = item[i];
        break;
    }

    // if(i === "devData"){
    //   break;
    // }else{
    //   if(i === "design"){
    //     for(var d in item[i]){
    //       var field = document.getElementById(d);
    //       field.value = item[i][d];
    //     }
    //   }else{
    //     if(i === "tracklist"){
    //       for(let x = 0; x < item[i].length; x++){
    //         var trackField = document.getElementById(`tracknum${x + 1}`);
    //         trackField.value = item[i][x].trackName;
    //       }
    //     }else{
    //       console.log(item[i]);
    //       var field = document.getElementById(i);
    //       field.value = item[i];
    //     }
    //   }
    // }
  }

  //item.tracklist.forEach(() => {})
  for(var i = 0; i < item.tracklist.length; i++){
      var trackField = document.getElementById(`tracknum${i+1}`);
      trackField.value = item.tracklist[i].trackName;
  }
};

// function testEditItem(currVal) {
//   const item = getItem(currVal);
//   loadEditForm(item);
//   pivotToggle(1);
//   mapFormTracklist(item.tracklist.length);
//   mapExistingToForm(item);
//   console.log("testEditItem: ", item);
// };

// $(document).on('click', '.colEditBtn', testEditItem($(this)).attr('editId'));

/*************************************
    // #region Deezer API Test
*************************************/

function cacheData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    console.info("Stored in Cache: ", key);
}

function getCachedData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

//TODO - Update to use this approach
//Need to figure out how to avoid hitting the query limit
// async function getAlbumData(query) {
async function getAlbumData(albumName, artistName) {
  const cacheKey = `${albumName}-${artistName}`;
  const cachedData = getCachedData(cacheKey);

  if (cachedData) {
    console.info("Data from Cache!");
    return cachedData;
  }
  
  const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
  const limit = `limit=1`;
  // const targetUrl = `https://api.deezer.com/search/album?q=${encodeURIComponent(albumName)} ${encodeURIComponent(artistName)}`;
  const targetUrl = `https://api.deezer.com/search/album`;
  const query = `q=${encodeURIComponent(albumName)} ${encodeURIComponent(artistName)}`;
  const url = `${proxyUrl}${targetUrl}?${limit}&${query}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error("Failed to fetch album data");
    }

    const data = await response.json();
    const album = data.data.find(item => item.title.toLowerCase() === albumName.toLowerCase());

    if (!album) {
      console.error("Album not found");
    }
  
    // Fetch tracklist
    const tracklistUrl = proxyUrl + album.tracklist;
    const tracklistResponse = await fetch(tracklistUrl);

    if (!tracklistResponse.ok) {
      console.error('Failed to fetch tracklist');
        // throw new Error('Failed to fetch tracklist');
    }

    const tracklistData = await tracklistResponse.json();
    album.tracks = tracklistData.data;
  
    cacheData(cacheKey, album);
    return album;
}

async function getArtistAlbums(artistName) {
    const cachedData = getCachedData(artistName);

    if (cachedData) {
      console.info("[getArtistAlbums - cachedData] - Data from Cache!");
      return cachedData;
    }
  
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    const targetUrl = `https://api.deezer.com/search/artist?q=${encodeURIComponent(artistName)}`;
    const url = proxyUrl + targetUrl;

    const response = await fetch(url);

    if (!response.ok) {
      console.error("[getArtistAlbums - !response.ok] - Failed to fetch artist data");
        // throw new Error('Failed to fetch artist data');
    }

    const data = await response.json();
    const artist = data.data.find(item => item.name.toLowerCase() === artistName.toLowerCase());

    if (!artist) {
      console.error("[getArtistAlbums - !artist] - Artist not found");
        // throw new Error('Artist not found');
    }

    const albumsUrl = proxyUrl + `https://api.deezer.com/artist/${artist.id}/albums`;
    const albumsResponse = await fetch(albumsUrl);

    if (!albumsResponse.ok) {
      console.error("[getArtistAlbums - !albumsResponse.ok] - Failed to fetch albums");
        // throw new Error('Failed to fetch albums');
    }

    
    const albumsData = await albumsResponse.json();
    cacheData(artistName, albumsData.data);
    return albumsData.data;
}

$(document).on('click', '#wipBtn', async () => { 
  const searchQuery = $('#searchTest').val();
  //getAlbumData(serachQuery)
  //getAlbumData('Take Me Back To Eden', 'Sleep Token')
  let obj = '';
  const albums = await getArtistAlbums('Sleep Token');
  
  if(!albums){
    console.log("[#wipBtn.onclick - !albums] - Couldn't load albums");
  }

  albums.forEach(album => {
    obj += `
      <div>
        <p>${album.title}</p>
        <ul style="font-size: 10px;">
          <li>Release Date: ${album.release_date}</li>
          <li>Type: ${album.type}</li>
          <li>Cover (Big): ${album.cover_big}</li>
          <li>Cover (Medium): ${album.cover_medium}</li>
          <li>Cover (Small): ${album.cover_small}</li>
          <li>Cover (XL): ${album.cover_xl}</li>
          <li>Explicit Lyrics? ${album.explicit_lyrics}</li>
          <li>Fans: ${album.fans}</li>
          <li>Genre ID: ${album.genre_id}</li>
          <li>ID: ${album.id}</li>
          <li>Link: ${album.link}</li>
          <li>MD5 Image: ${album.md5_image}</li>
          <li>Record Type: ${album.record_type}</li>
          <li>Tracklist: ${album.tracklist}</li>
        </ul>
      </div>
     `;
    console.log(JSON.parse(JSON.stringify(album)));
    
    $('#testDialogText').html(obj);
    const dialog = document.getElementById('testDialog');
    dialog.showModal();
    
    $("#albumImg").attr("src", album.cover_small);
  })
})