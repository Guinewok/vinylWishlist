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

window.addEventListener("load", () => {
  //localStorage.clear();
  getData();
  renderWishlist();
  pivotToggle(4);
  populateGenres();
});

function pivotToggle(pivotNum) {
  var pivotArray = ["carousel","addFormPage","collection","na", "wip"];

  for(i = 0; i < pivotArray.length; i++){
    if(i === Number(pivotNum)){
      var div = document.getElementById(pivotArray[pivotNum]);
      div.classList.add('pivotHide');
      div.classList.remove('pivotHide');
    }else{
      var div = document.getElementById(pivotArray[i]);
      div.classList.add('pivotHide');
    }
  }
  if(pivotNum === 1) {
    document.forms[0].reset();
    mapFormTracklist(trackCount);
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
  localStorage.setItem("fullList", JSON.stringify(dataParsed, null, 2));
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
    // const buttonMenuContainer = document.getElementById('wishlistButtonMenu');
    // buttonMenuContainer.append([])
  
    const addToColConfirmBtn = document.getElementById('wishToColBtn');
    addToColConfirmBtn.setAttribute('onclick', `updateWishToCol( '${wishlist[i].devData.id}')`);
  
    const addToColText = document.getElementById('addToColDialogText');
    addToColText.innerHTML = `Add ${wishlist[i].albumName} to collection?`;
  
    const title = document.getElementById('wishTitle');
    title.innerHTML = `${wishlist[i].albumName}`;
  
    const editBtn = document.getElementById('wishlistEditBtn');
    editBtn.setAttribute('onclick', `editItem(event, '${wishlist[i].devData.id}')`);

    const subtitle = document.getElementById('wishArtist');
    subtitle.innerHTML = `${wishlist[i].artistName}`;
  
    const releaseDate = document.getElementById('releaseDate');
    releaseDate.innerHTML = `${wishlist[i].releaseDate.slice(-4)}`;
    releaseDate.title = `${wishlist[i].releaseDate}`;

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
  
    const shopLinkLbl = document.getElementById('shopLinkLbl');
    shopLinkLbl.innerHTML = "Buy Here:";
  
    const shopLink = document.getElementById('wishShopLink');
    shopLink.href = wishlist[i].shopurl;
    shopLink.innerHTML = wishlist[i].shopurl;
  
    const musicLinkLbl = document.getElementById('musicLinkLbl');
    musicLinkLbl.innerHTML = "Listen Here:";
  
    const musicLink = document.getElementById('wishMusicLink');
    musicLink.href = wishlist[i].musicurl;
    musicLink.innerHTML = wishlist[i].musicurl;
  
    

    const displayContainer = document.getElementById('display');
    displayContainer.append(...[title, subtitle, releaseDate, image, trackList, desc, shopLinkLbl, shopLink, musicLinkLbl, musicLink]);
  };

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

function getItem (currVal) {
  var firstChar = currVal.charAt(0);
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
  }
  const array = JSON.parse(list);
  var index = currVal.replace(firstChar, "");
  var item = array[index];
  return item;
}

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
}

function loadEditForm(item) {
  document.getElementById('formTitle').innerHTML = `Update ${item.albumName} by ${item.artistName}`;
  document.getElementById('formBtns').innerHTML = "";
  document.getElementById('formBtns').innerHTML = 
    `<input type="submit" id="update" onclick="updateList(${item.devData.id.substring(1)});" target="#" value="Update">
    <input type="button" id="remove" value="Remove">
    <input type="button" id="cancel" value="Cancel" onclick="document.forms[0].reset();pivotToggle(0);">`;
}

function editItem(e, currVal) {
  e = e || window.event;
  e.preventDefault();
  const item = getItem(currVal);
  loadEditForm(item);
  pivotToggle(1);
  mapFormTracklist(item.tracklist.length);
  mapExistingToForm(item);
}

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
    pivotToggle(event, 0);
  }
};

function updateColorHex(currElement) {
  const inputField = document.getElementById(`${currElement}`);
  const fieldId = currElement + "Hex";
  const colorField = document.getElementById(`${fieldId}`);
  inputField.value = colorField.value;
};

function refreshWishlist(e){
    e = e || window.event;
    e.preventDefault();
    getData();
    renderWishlist();
}

function updateWishToCol(id) {
  const authToken = localStorage.getItem("authToken");
  if(!authToken) {
    showAuthDialog();
  }else{
    console.log('token present: ', authToken);
    //do something
  }
}

//WIP
/*function clearForm() {
  var form = document.getElementById('addForm');
  form.reset();
}*/

//DEV FUNCTIONS
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

const topicSelected = "";

async function youtubeAPITest() {
  const key = localStorage.getItem("YoutubeAPIKey");
  const q = document.getElementById('searchtest').value;
  const type = "channel";
  const order = "relevance";
  const topic = localStorage.getItem("topic");
  const response = await 
  fetch(`https://www.googleapis.com/youtube/v3/search?key=${key}&topicId=${topic}&order=${order}&part=snippet&type=${type}&q=${q}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  console.log(data);
  const preElement = document.getElementById('responseTest');
  const resultsElement = document.getElementById('searchResults');
  resultsElement.innerHTML = "";
  for(i = 0; i < data.items.length; i++) {
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
  }
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
  for(i = 0; i < topicArray.length; i++) {
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