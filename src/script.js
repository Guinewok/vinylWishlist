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
  renderFormFooter();
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
$(document).on('click', '.editExistingBtn', (e) => workflowOpenExistingVinyl($(e.target).attr('data-itemId')));

// ADD TO WISHLIST
$(document).on('click', '.addFormListBtn', () => addListItem($(this).attr('data-listType')));
$(document).on('click', '#setAuthTokenBtn', () => showAuthDialog());
$(document).on('click', '#colorHex', () => updateColorHex('color'));
$(document).on('click', '#colorSecHex', () => updateColorHex('colorSec'));
$(document).on('click', '#formAddBtn', () => addTrack());
$(document).on('click', '#formSubBtn', () => removeTrack());
$(document).on('click', '#submitAdd', (e) => {
  //TODO - Add validity check to parse form or as it's own function thats called in parse form
  if(document.forms['addForm'].reportValidity()){
    workflowAddToList($(e.target).attr('data-list'))
  }
});
$(document).on('click', '#cancelUpdate', () => pivotToggle(0))

window.addEventListener("load", () => {
  //localStorage.clear();
  getData()
  renderWishlist();
  pivotToggle(0);
  populateGenres();
  localStorage.removeItem("pageToken");
});

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

function showAddToColDialog(id) {
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

function getAuthToken() {
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


// // #region mapExistingToForm
// function mapExistingToForm(item) {
//   let form = document.querySelector('form');
//   var myFormData = new FormData(form);
//   for(var i in item){
//     if(i === "devData"){
//       break;
//     }else{
//       if(i === "design"){
//         for(var d in item[i]){
//           var field = document.getElementById(d);
//           field.value = item[i][d];
//         }
//       }else{
//         if(i === "tracklist"){
//           for(let x = 0; x < item[i].length; x++){
//             var trackField = document.getElementById(`tracknum${x + 1}`);
//             trackField.value = item[i][x].trackName;
//           }
//         }else{
//           console.log(item[i]);
//           var field = document.getElementById(i);
//           field.value = item[i];
//         }
//       }
//     }
//   }
//   const trackList = item.tracklist;
//   for(var i = 0; i < trackList.length; i++){
//       var trackField = document.getElementById(`tracknum${i+1}`);
//       trackField.value = trackList[i].trackName;
//   }
// };

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
// function editItem(e, currVal) {
//   e = e || window.event;
//   e.preventDefault();
//   const item = getItem(currVal);
//   loadEditForm(item);
//   pivotToggle(1);
//   mapFormTracklist(item.tracklist.length);
//   mapExistingToForm(item);
// };

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
// #region Workflow Functions
//TODO - This workflow works great, needs to update the data-list attr on submit btn based on what is clicked
function workflowAddToList(listName, pivotTo){
  const formData = parseFormData(listName, null, status);
  // const updatedList = addToList(listName, formData);
  const updatedList = modifyList(listName, formData, "add");
  const requestBody = createRequestBody(listName, updatedList);
  console.log("formData: ", formData);
  console.log("updatedList: ", updatedList);
  console.log("requestBody: ", requestBody);
  //pushToRepo(requestBody);
  if(pivotTo){
    pivotToggle(pivotTo);
  }
}


function workflowOpenExistingVinyl(itemId) {
  const item = getItem(itemId);
  let listName = getList(itemId);
  // mapFormTracklist(item.tracklist.length);
  mapExistingToForm(item);
  renderFormFooter(listName, "update");
  pivotToggle(1);
}


function workflowUpdateExistingVinyl(listName, item, pivotTo) {
  const formData = parseFormData(listName, item, status);
  const updatedList = modifyList(listName, formData, "update");
  const requestBody = createRequestBody(listName, updatedList);
  console.log("formData: ", formData);
  console.log("updatedList: ", updatedList);
  console.log("requestBody: ", requestBody);
  //pushToRepo(requestBody);
  if(pivotTo){
    pivotToggle(pivotTo);
  }
}

// #region addTrack
/**Used to add track input fields to the form*/
function addTrack() {
  trackCount += 1;
  $('#tracklistList').append(`
    <label for="tracknum${trackCount}" id="tracknum${trackCount}Lbl" class="formTrack">
      Track ${trackCount}:
    </label>
    <input type="text" name="tracknum${trackCount}" id="tracknum${trackCount}" class="formTrack"></input>
  `);
}

// #region removeTrack
/**Used to remove track input fields from the form*/
function removeTrack() {
  if(trackCount > 0) { 
    $(`#tracknum${trackCount}Lbl`).remove();
    $(`#tracknum${trackCount}`).remove();
    trackCount--;
    if(trackCount === 0){ 
      $('#formSubBtn').attr('disabled', 'disabled'); 
      // console.log('No more tracks to remove');
    }
  }
}

// #region getData
/**Call Github API and return the contents of the JSON file used to store vinyl data. */
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

// #region pivotToggle
/**Used to pivot between pages. */
function pivotToggle(pivotNum) {
  var pivotArray = ["carousel","addFormPage","collection","na", "wip"];

  pivotArray.forEach((item) => {
    $(`#${item}`).hide();
    if(item === pivotArray[pivotNum]) {
      $(`#${pivotArray[pivotNum]}`).show();
    }
  });
};

// #region renderWishlist
/**Renders the item displayed on the wishlist page. */
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

  //TODO - make the buttons 100% height
  const vinyl = `
    <span id="wishlistButtonMenu">
      <button id="markAsOwned">Mark as Owned</button>
      <button id="wishlistEditBtn" data-itemId="${wishlist[incrementVar].devData.id}" class="editExistingBtn">Edit Item</button>
      <button id="wishlistRefresh">Refresh</button>
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

// #region renderFormFooter
/**Renders the buttons on form based on the type of changes being made */
function renderFormFooter(listName, formType) {
  switch(formType) {
    case "update":
      $('#formBtns').html(`
        <input type="submit" id="submitUpdate" data-list="${listName}" target="#" value="Save"/>
        <input type="button" id="cancelUpdate" value="Cancel"/>
      `);
      break;
    default:
      $('#formBtns').html(`
        <input type="submit" id="submitAdd" data-list="${listName}" target="#"/>
        <input type="reset" id="rst"/>
      `);
      break;
  }
}

// #region parseFormData
// TODO - have a check for whether or not the item is new or updated, this function probably shouldn't be creating any data whatsoever
// If not new then the devData should not be touched.  A new function for devData maybe?
/**Returns the value entered in the form as a JSON object */
function parseFormData(listName, item, status) {
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
    devData: {},
    /*
    apiDetails: {
      channelId: formDataObj.channelId,
      playlistId: formDataObj.playlistId
    }
    */
  };

  for(var i = 0; i < trackCount; i++) {
    newListItem.tracklist.push({
      trackName: $(`#tracknum${i + 1}`).val(),
      trackNum: i + 1,
    })
  };

  if(item === null){
    newListItem.devData = {
      id: listName.substring(0, 1) + JSON.parse(localStorage.getItem(listName)).length,
      status: status,
      modifiedDate: new Date(),
    }
  }
  console.log("Form Converted to JSON Object: ", newListItem);
  return newListItem;
};


// #region addToList
/**Adds an item to the selected locally-stored list */
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


// #region createRequestBody
/**Creates a "request body" object able to be used by the Github API to change files */
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


// #region getItem
/**Returns an items full details given it's ID */
function getItem (currVal) {
  const firstChar = currVal.toString().charAt(0);
  const list = getList(currVal);
  // console.log("getItem: ", list[currVal.replace(firstChar, "")]);
  return list[currVal.replace(firstChar, "")];
};


// #region getList
/**Returns an item's list based on it's ID */
function getList(devId) {
  const indentifier = devId.charAt(0);
  let list;
  switch(indentifier) {
    case 'w':
      list = JSON.parse(localStorage.getItem("wishlist"));
      break;
    case 'c':
      list = JSON.parse(localStorage.getItem("collection"));
      break;
    case 'r':
      list = JSON.parse(localStorage.getItem("removed"));
      break;
    default:
      console.error(`[script.js - getList] Invalid list id, received: ${devId}`);
      break;
  }
  return list;
}


// #region pushToRepo
/**Takes a "request body" object and pushes it to the Github repo. */
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

// #region renderCollection
/**Maps the collection list JSON object to the collection page UI */
function renderCollection(){
  const collection = JSON.parse(localStorage.getItem("collection"));

  while($(collectionList).children().length > 0){
    $(collectionList).children().remove();
  }

  for(i = devData; i < collection.length; i++){
    const testColItem = `
      <div class="colItem">
        <a href="#" class="colEditBtn editExistingBtn" data-itemId="${collection[i].devData.id}">edit</a>
        <p>${collection[i].albumName}</p>
        <img src="${collection[i].imageurl}" class="colVinylImage"></img>
      </div>
    `;
    $('#collectionList').append(testColItem);
  }
};


// NEW TEST FUNCTION
//Concept is to be a combo of add, update, and remove
/**Handles the addition, modification, or removal of a vinyl for any given list */
function modifyList(listName, item, modType){
  let fullList = JSON.parse(localStorage.getItem("fullList"));
  let list = JSON.parse(localStorage.getItem(listName));
  let commitMessage = "";

  switch(modType){
    case "add":
      if(listName === "removed"){
        throw `[script.js - modifyList] - Cannot "Add" to removed list, set modType to "removed" to remove an item.`;
      }

      listName === "wishlist" ? item.devData.wishlistedDate = new Date() : null;
      listName === "collection" ? item.devData.collectedDate = new Date() : null;

      list[list.length] = item;
      fullList[listName] = list;
      commitMessage = `Add ${item.albumName} by ${item.artistName} to the ${listName}`;
      break;
    case "update":
      list[item.devData.id.substring(1)] = item;
      fullList[listName] = list;
      commitMessage = `Update ${item.albumName} by ${item.artistName} in the ${listName}`;
      break;
    case "remove":
      item.devData.removedDate = new Date();
      // TODO - Need to loop through the array with the removal and update each devData.id, otherwise all logic using that id will need to change
      commitMessage = `Remove ${item.albumName} by ${item.artistName} from the ${listName}`;
      break;
    default:
      console.error(`[script.js - modifyList] - Failed to modify list, modType not provided or invalid.  Received: ${modType}`);
      break;
  }
  return[fullList, commitMessage];
}

// #region mapExistingToForm
/**Maps an existing vinyl object to the form */
function mapExistingToForm(item) {
  $('#tracklistList').html("<label>Tracklist:</label><br>");
  for(var key in item){
    switch(key) {
      case "devData":
        break;
      case "design":
        for(var value in item[key]){
          $(value).val(item[key][value]);
          //TODO - colors do not map correctly
          // var field = document.getElementById(d);
          // field.value = item[i][d];
        }
        break;
      case "tracklist":
        for(let i = 0; i < item[key].length; i++){
          let curr = i + 1;
          $('#tracklistList').append(`
            <label for="tracknum${curr}" id="tracknum${curr}Lbl" class="formTrack">
              Track ${curr}:
            </label>
            <input type="text" name="tracknum${curr}" id="tracknum${curr}" class="formTrack" value="${item[key][i].trackName}"></input>
          `)
        }
        break;
      default:
        $(`#${key}`).val(item[key]);
        break;
    }
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