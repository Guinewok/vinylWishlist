var incrementVar = 0;
//TODO implement a way to exclude devData with this value.  Currently only works with the collection
var devData = 1;
var trackCount = 3;
var dialogHidden = true;
const status = 'TESTING';
const viewMode = 'TEST';
const apiUrl = viewMode === 'PROD' ? 
  `https://api.github.com/repos/Guinewok/vinylWishlist/contents/vinylWishlist.json` : 
  `https://api.github.com/repos/Guinewok/vinylWishlist/contents/test.json`;
var searchResultsArr = [];

// NAVIGATION
$(document).on('click', '.navBtn', (e) => pivotToggle($(e.target).attr('data-pageId')));
$('.navBtn[data-pageId="1"]').on('click', () => {
  document.forms[0].reset();
  renderFormFooter();
});
$('.navBtn[data-pageId="2"]').on('click', () => {
  renderCollection();
});

// DIALOGS
$(document).on('click', '#dialogClose', () => document.getElementById('sharedDialog').close());
$(document).on('click', '#setAuthTokenBtn', () => workflowOpenAuthDialog());
$(document).on('click', '#authDialogClose', () => document.getElementById('sharedDialog').close());
$(document).on('click', '#authDialogSubmit', () => getAuthToken());
$(document).on('click', '#authDialogClear', () => {
  localStorage.removeItem('authToken');
  $('#authToken').val("");
  document.getElementById('sharedDialog').close();
});

$(document).on('click', '#markAsOwnedConfirmBtn', (e) => workflowUpdateExistingVinyl($(e.target).attr('data-itemId')));
$(document).on('click', '#markAsOwnedDenyBtn', () => document.getElementById('sharedDialog').close());
$(document).on('click', '#markAsOwned', (e) => workflowOpenMarkAsOwnedDialog($(e.target).attr('data-itemId')));
$(document).on('click', '#submitUpdate', (e) => workflowUpdateExistingVinyl($(e.target).attr('data-itemId')));
$(document).on('click', '#cancelUpdate', () => pivotToggle(0))

// WISHLIST
$(document).on('click', '#lBtn', () => renderWishlist(false));
$(document).on('click', '#rBtn', () => renderWishlist(true));
$(document).on('click', '.editExistingBtn', (e) => workflowOpenExistingVinyl($(e.target).attr('data-itemId'))); //Used by collection edit buttons as well
$(document).on('click', '#wishlistRefresh', () => {
  getData();
  renderWishlist();
});

// ADD TO WISHLIST
$(document).on('click', '.addFormListBtn', () => addListItem($(this).attr('data-listType')));
$(document).on('click', '#colorHex', () =>  $('#color').val($('#colorHex').val()));
$(document).on('click', '#colorSecHex', () => $('#colorSec').val($('#colorSecHex').val()));
$(document).on('click', '#formAddBtn', () => addTrack());
$(document).on('click', '#formSubBtn', () => removeTrack());
$(document).on('click', '#submitAdd', (e) => {
  //TODO - Add validity check to parse form or as it's own function thats called in parse form
  if(document.forms['addForm'].reportValidity()){
    workflowAddToList($(e.target).attr('data-list'))
  }
});


window.addEventListener("load", () => {
  getData()
  renderWishlist();
  pivotToggle(0);
  populateGenres();
  localStorage.removeItem("pageToken");
});

// #region Logic Restructure
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
function workflowAddToList(listName, pivotTo){
  const formData = parseFormData(listName, null, status);
  const updatedList = modifyList(listName, formData, "add");
  const requestBody = createRequestBody(listName, updatedList);
  pushToRepo(requestBody, formData, "add");
  if(pivotTo){
    pivotToggle(pivotTo);
  }
}


function workflowOpenExistingVinyl(itemId) {
  const item = getItem(itemId);
  const list = getList(itemId);
  mapExistingToForm(item);
  renderFormFooter(list, item, "update");
  pivotToggle(1);
}


//TODO - need to allow for items to be moved from one list to another
function workflowUpdateExistingVinyl(itemId, pivotTo) {
  const item = getItem(itemId);
  const list = getList(itemId);
  const formData = parseFormData(list.listName, item, status);
  const updatedList = modifyList(list.listName, formData, "update");
  const requestBody = createRequestBody(list.listName, updatedList);
  pushToRepo(requestBody, formData, "update");
  if(pivotTo){
    pivotToggle(pivotTo);
  }
}

// #region Workflow Dialogs
function workflowOpenAuthDialog(){
  $('#dialogHeader').html(`<h2>Provide Github Authorization Token</h2>`);
  $('#dialogContent').html(`<p>In order to make changes to the wishlist you need to provide a valid Github Auth Token</p>`);
  $('#dialogBtns').html(`
    <input type="text" name="authToken" id="authToken"></input>
    <input type="submit" id="authDialogSubmit"/>
    <input type="button" id="authDialogClear" value="Clear"/>
  `);

  document.getElementById('sharedDialog').showModal();
}


function workflowOpenMarkAsOwnedDialog(itemId){
  const item = getItem(itemId);
  $('#dialogHeader').html(`<h2>Add to Collection</h2>`);
  $('#dialogContent').html(`<p>Add ${item.albumName} by ${item.artistName} to the collection?</p>`);
  $('#dialogBtns').html(`
    <input type="button" id="markAsOwnedConfirmBtn" data-itemId="${item.devData.id}" value="Confirm"/>
    <input type="button" id="markAsOwnedDenyBtn" value="Deny"/>
  `);

  document.getElementById('sharedDialog').showModal();
}


function workflowOpenSubmitDialog(item, submissionStatus, submissionType) {
  const list = getList(item.devData.id);
  $('#dialogBtns').html(``);

  switch(submissionType) {
    case "add":
      $('#dialogHeader').html(`<h2>Addition ${submissionStatus ? "Success" : "Failure"}</h2>`);
      $('#dialogContent').html(`<p>${submissionStatus ? 
        `Sucessfully added ${item.albumName} by ${item.artistName} to the ${list.listName}` : 
        `Failed to add ${item.albumName} by ${item.artistName} to the ${list.listName}`
      }</p>`);
      break;
    case "update":
      $('#dialogHeader').html(`<h2>Update ${submissionStatus ? "Success" : "Failure"}</h2>`);
      $('#dialogContent').html(`<p>${submissionStatus ? 
        `Sucessfully updated ${item.albumName} by ${item.artistName} in the ${list.listName}` : 
        `Failed to update ${item.albumName} by ${item.artistName} in the ${list.listName}`
      }</p>`);
      break;
    case "remove":
      $('#dialogHeader').html(`<h2>Removal ${submissionStatus ? "Success" : "Failure"}</h2>`);
      $('#dialogContent').html(`<p>${submissionStatus ? 
        `Sucessfully removed ${item.albumName} by ${item.artistName} from the ${list.listName}` : 
        `Failed to remove ${item.albumName} by ${item.artistName} from the ${list.listName}`
      }</p>`);
      break;
    default:
      throw `[script.js - workflowOpenSubmitDialog] - Invalid submission type.  Received: ${submissionType}`;
  }
  document.getElementById('sharedDialog').showModal();
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
    }
  }
}

// #region getAuthToken
function getAuthToken() {
  if($('#authToken').val()){
    console.log(`[script.js - getAuthToken] - Github Auth Token: ${$('#authToken').val()}`);
    localStorage.setItem("authToken", $('#authToken').val());
    document.getElementById('sharedDialog').close();
  }
};

// #region getData
/**Call Github API and return the contents of the JSON file used to store vinyl data. */
async function getData() {
  const response = await fetch(apiUrl, {
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
      <button id="markAsOwned" data-itemId="${wishlist[incrementVar].devData.id}">Mark as Owned</button>
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
function renderFormFooter(listName, item, formType) {
  switch(formType) {
    case "update":
      $('#formTitle').html(`Update ${item.albumName} by ${item.artistName}`);
      $('#formBtns').html(`
        <input type="submit" id="submitUpdate" data-itemid="${item.devData.id}" data-list="${listName}" target="#" value="Save"/>
        <input type="button" id="cancelUpdate" value="Cancel"/>
      `);
      break;
    default:
      $('#formTitle').html(`Add an album to the wishlist`);
      $('#formBtns').html(`
        <input type="submit" id="submitAdd" data-itemid="w" data-list="wishlist" target="#"/>
        <input type="reset" id="rst"/>
      `);
      break;
  }
}

// #region parseFormData
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
  } else {
    newListItem.devData = item.devData;
  }
  console.log("Form Converted to JSON Object: ", newListItem);
  return newListItem;
};


// #region addToList
/**Adds an item to the selected locally-stored list */
function addToList(listName, item){
  const fullObj = JSON.parse(localStorage.getItem("fullList"));
  const list = JSON.parse(localStorage.getItem(listName));
  list[list.length] = item;
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
function getItem (devId) {
  const firstChar = devId.toString().charAt(0);
  const list = getList(devId);
  return list.list[devId.replace(firstChar, "")];
};


// #region getList
/**Returns an item's list based on it's ID */
function getList(devId) {
  const indentifier = devId.toString().charAt(0);
  let list;
  let listName;
  switch(indentifier) {
    case 'w':
      list = JSON.parse(localStorage.getItem("wishlist"));
      listName = "wishlist";
      break;
    case 'c':
      list = JSON.parse(localStorage.getItem("collection"));
      listName = "collection";
      break;
    case 'r':
      list = JSON.parse(localStorage.getItem("removed"));
      listName = "removed";
      break;
    default:
      console.error(`[script.js - getList] Invalid list id, received: ${devId}`);
      break;
  }
  return {list: list, listName: listName};
}


// #region pushToRepo
/**Takes a "request body" object and pushes it to the Github repo. */
function pushToRepo(promiseRequestBody, item, submissionType) {
  const authToken = localStorage.getItem("authToken");
  //Check for Auth Token
  if(!authToken || authToken.length === 0) {
    workflowOpenAuthDialog();
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
      console.log(response);
      if(response.ok) {
        workflowOpenSubmitDialog(item, true, submissionType);
      } else {
        console.log(`[script.js - pushToRepo] - Failed to push to Github, status: ${response.status}`)
        workflowOpenSubmitDialog(item, false, submissionType);
      }
    });
  };
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


// #region modifyList
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
      list[`${item.devData.id}`.substring(1)] = item;
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