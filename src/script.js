var incrementVar = 0;
var trackCount = 3;
var colorsCount = 0;
var dialogHidden = true;
var devMode = true;
var apiUrl = `https://api.github.com/repos/Guinewok/vinylWishlist/contents/test.json`;
var searchResultsArr = [];

// NAVIGATION
$(document).on('click', '#devToggle', () => {
  $('#devToggle').attr('checked', !$('#devToggle').attr('checked'));
  toggleDev(this);
});
$(document).on('click', '.navBtn', (e) => pivotToggle($(e.target).attr('data-pageId')));
$(document).on('click', '.navBtn[data-pageId="2"]', () => renderCollection());
$(document).on('click', '.navBtn[data-pageId="1"]', () => {
  document.forms[0].reset();
  renderForm();
  renderFormFooter();
  renderStyleSection();
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

$(document).on('click', '#markAsOwnedConfirmBtn', (e) => {
  workflowTransferExistingVinyl($(e.target).attr('data-itemId'), "collection");
  document.getElementById('sharedDialog').close();
  getData();
  renderWishlist();
});
$(document).on('click', '#markAsOwnedDenyBtn', () => document.getElementById('sharedDialog').close());
$(document).on('click', '#markAsOwned', (e) => workflowOpenMarkAsOwnedDialog($(e.target).attr('data-itemId')));
$(document).on('click', '#submitUpdate', (e) => workflowUpdateExistingVinyl($(e.target).attr('data-itemId')));
$(document).on('click', '#cancelUpdate', () => pivotToggle(0))

// WISHLIST
$(document).on('click', '#lBtn', () => renderWishlist(false));
$(document).on('click', '#rBtn', () => renderWishlist(true));
$(document).on('click', '#expandImgBtn', () => workflowOpenExpandVinyl($('.vinylImage')));
$(document).on('click', '.editExistingBtn', (e) => workflowOpenExistingVinyl($(e.target).attr('data-itemId'))); //Used by collection edit buttons as well
$(document).on('click', '#wishlistRefresh', () => {
  getData();
  renderWishlist();
});

// ADD TO WISHLIST
$(document).on('click', '.addFormListBtn', () => addListItem($(this).attr('data-listType')));
$(document).on('change', '#vinylStyleList', (e) => renderStyleSection(VinylStyle.filter(item => item.id === Number(e.target.value))[0]));
$(document).on('click', '#styleColorsAdd', () => addStylesColor());
$(document).on('click', '#styleColorsSub', () => removeStylesColor());
$(document).on('click', '#formAddBtn', () => addTrack());
$(document).on('click', '#formSubBtn', () => removeTrack());
$(document).on('click', '#removeVinyl', (e) => workflowOpenRemovalDialog($(e.target).attr('data-itemId')));
$(document).on('click', '#removeConfirmBtn', (e) => {
  workflowRemoveVinyl($(e.target).attr('data-itemId'));
  getData();
  renderWishlist();
  pivotToggle(0);
});
$(document).on('click', '#removeDenyBtn', () => document.getElementById('sharedDialog').close());
$(document).on('click', '#submitAdd', (e) => {
  //TODO - Add validity check to parse form or as it's own function thats called in parse form
  if(document.forms['addForm'].reportValidity()){
    workflowAddToList($(e.target).attr('data-list'))
  }
});


window.addEventListener("load", () => {
  getData();
  renderWishlist();
  pivotToggle(0);
  // populateGenres();
  localStorage.removeItem("pageToken");
});

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
  const formData = parseFormData(listName, null);
  const updatedList = modifyList(listName, formData, "add");
  const requestBody = createRequestBody(updatedList);
  //pushToRepo(requestBody, formData, "add");
  if(pivotTo){
    pivotToggle(pivotTo);
  }
};


function workflowOpenExistingVinyl(itemId) {
  const item = getItem(itemId);
  const list = getList(itemId);
  mapExistingToForm(item);
  renderFormFooter(list, item, "update");
  pivotToggle(1);
};


//TODO - need to allow for items to be moved from one list to another
function workflowUpdateExistingVinyl(itemId, pivotTo) {
  const item = getItem(itemId);
  const list = getList(itemId);
  const formData = parseFormData(list.listName, item);
  const updatedList = modifyList(list.listName, formData, "update");
  const requestBody = createRequestBody(updatedList);
  pushToRepo(requestBody, formData, "update");
  if(pivotTo){
    pivotToggle(pivotTo);
  }
};


// TODO - concept for workflowTransferExistingVinyl
function workflowTransferExistingVinyl(itemId, newListName, pivotTo) {
  const item = getItem(itemId); //Get the item being moved
  const list = getList(itemId); //Get the current list the item belongs too

  const date = new Date();
  date.setHours(test.getHours() - 5); //Adjust time to US/Chicago timezone
  const testId = `${newListName.charAt(0)}${date.toISOString()}`; //create new id for the new list

  const addedToList = modifyList(newListName, {...item, devData: {...devData, id: testId}}, "add"); //Add the item to the new list location with an updated id
  localStorage.setItem("fullList", JSON.stringify(addedToList[0], null, 2)); //Apply the change to the locally stored object

  const removedFromList = modifyList(list.listName, item, "remove"); //Remove the item from it's previous location
  const requestBody = createRequestBody(removedFromList); //create a request with both changes now made
  pushToRepo(requestBody, item, "transfer", newListName);
  if(pivotTo){
    pivotToggle(pivotTo);
  }
};


function workflowRemoveVinyl(itemId, pivotTo) {
  const item = getItem(itemId);
  const list = getList(itemId);
  const removeFromList = modifyList(list.listName, item, "remove");
  const requestBody = createRequestBody(removeFromList);
  pushToRepo(requestBody, item, "remove");
  if(pivotTo){
    pivotToggle(pivotTo);
  }
};


// #region Workflow Dialogs
function workflowOpenExpandVinyl(img){
  // $('#dialogHeader').html(`<button id="expandVinylCloseBtn">X</button>`);
  $('#dialogContent').html(`<img src="${$(wishImg).attr('src')}"/>`);
  //Later on this should construct a div that mimics the appearance of a vinyl
  document.getElementById('sharedDialog').showModal();
};


function workflowOpenAuthDialog(){
  $('#dialogHeader').html(`<h2>Provide Github Authorization Token</h2>`);
  $('#dialogContent').html(`<p>In order to make changes to the wishlist you need to provide a valid Github Auth Token</p>`);
  $('#dialogBtns').html(`
    <input type="text" name="authToken" id="authToken"></input>
    <input type="submit" id="authDialogSubmit"/>
    <input type="button" id="authDialogClear" value="Clear"/>
  `);
  document.getElementById('sharedDialog').showModal();
};


function workflowOpenMarkAsOwnedDialog(itemId){
  const item = getItem(itemId);
  $('#dialogHeader').html(`<h2>Add to Collection</h2>`);
  $('#dialogContent').html(`<p>Add ${item.albumName} by ${item.artistName} to the collection?</p>`);
  $('#dialogBtns').html(`
    <input type="button" id="markAsOwnedConfirmBtn" data-itemId="${item.devData.id}" value="Confirm"/>
    <input type="button" id="markAsOwnedDenyBtn" value="Deny"/>
  `);
  document.getElementById('sharedDialog').showModal();
};


function workflowOpenRemovalDialog(itemId){
  const item = getItem(itemId);
  const list = getList(itemId);
  $('#dialogHeader').html(`<h2>Remove Vinyl</h2>`);
  $('#dialogContent').html(`<p>Remove ${item.albumName} by ${item.artistName} from the ${list.listName}?</p>`);
  $('#dialogBtns').html(`
    <input type="button" id="removeConfirmBtn" data-itemId="${item.devData.id}" value="Remove"/>
    <input type="button" id="removeDenyBtn" value="Cancel"/>
  `);
  document.getElementById('sharedDialog').showModal();
};


function workflowOpenSubmitDialog(item, submissionStatus, submissionType, secondaryList) {
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
    case "transfer":
      $('#dialogHeader').html(`<h2>Transfer ${submissionStatus ? "Success" : "Failure"}</h2>`);
      $('#dialogContent').html(`<p>${submissionStatus ? 
        `Sucessfully transferred ${item.albumName} by ${item.artistName} from the ${list.listName} to the ${secondaryList}` : 
        `Failed to transfer ${item.albumName} by ${item.artistName} from the ${list.listName} to the ${secondaryList}`
      }</p>`);
      break;
    default:
      throw `[script.js - workflowOpenSubmitDialog] - Invalid submission type.  Received: ${submissionType}`;
  }
  document.getElementById('sharedDialog').showModal();
};


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
  $('#formSubBtn').removeAttr('disabled'); 
};


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
};


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

  const vinyl = `
    <span id="wishlistButtonMenu">
      <button id="markAsOwned" data-itemId="${wishlist[incrementVar].devData.id}">Mark as Owned</button>
      <button id="wishlistEditBtn" data-itemId="${wishlist[incrementVar].devData.id}" class="editExistingBtn">Edit Item</button>
      <button id="wishlistRefresh">Refresh</button>
    </span>
    <p class="titleText" id="wishTitle">${wishlist[incrementVar].albumName}</p>
    <p class="subTitleText" id="wishArtist">${wishlist[incrementVar].artistName}</p>
    <p class="releaseText" id="releaseDate">${wishlist[incrementVar].releaseDate}</p>
    <span id="wishlistImgContainer">
      <img 
        class="vinylImage" 
        src="${wishlist[incrementVar].imageurl}" 
        alt="The vinyl for ${wishlist[incrementVar].albumName} by ${wishlist[incrementVar].artistName}" 
        id="wishImg">
      </img>
      <button id="expandImgBtn">🔎</button>
    </span>
    <p id="wishDesc">${wishlist[incrementVar].description}</p>
    <ul id="wishTracklist">${tracklist}</ul>
    <p id="shopLinkLbl" class="wishLinkLbl">Buy Here: </p>
    <a href="" id="wishShopLink" class="wishLinks">${wishlist[incrementVar].shopurl}</a>
    <p id="musicLinkLbl" class="wishLinkLbl">Listen Here: </p>
    <a href="" id="wishMusicLink" class="wishLinks">${wishlist[incrementVar].musicurl}</a>
  `;
  $('#display').html(vinyl);
};


const VinylStyle = [
  {id: 0, name: "Other", colors: 0, desc: "A style not listed here."},
  {id: 1, name: "Color-in-Clear", colors: 2, desc: "A clear base with a solid color in the center, creating a striking contrast."},
  {id: 2, name: "Color-in-Color", colors: 2, desc: "One color inside another, often creating a bullseye effect."},
  {id: 3, name: "Galaxy", colors: 3, desc: "A mix of colors that mimic the appearance of a galaxy."},
  {id: 4, name: "Glow-in-the-Dark", colors: 1, desc: "Vinyl that glows in the dark, adding a fun element to your collection."},
  {id: 5, name: "Marble", colors: 3, desc: "A swirling mix of colors that resemble marble patterns."},
  {id: 6, name: "Metallic", colors: 1, desc: "Colors with a metallic sheen, such as metallic gold or silver."},
  {id: 7, name: "Opaque", colors: 1, desc: "Solid Colors"},
  {id: 8, name: "Picture", colors: 0, desc: "Records with images or artwork embedded in them."},
  {id: 9, name: "Pinwheel", colors: 2, desc: "Multiple colors arranged in a pinwheel pattern, giving a dynamic look when spinning."},
  {id: 10, name: "Quad-Color", colors: 4, desc: "Four colors combined, creating a vibrant and complex pattern."},
  {id: 11, name: "Side A/Side B", colors: 2, desc: "Different colors on each side of the record."},
  {id: 12, name: "Smoke", colors: 2, desc: "A smoky, wispy effect created by blending colors in a way that mimics smoke."},
  {id: 13, name: "Splatter", colors: 3, desc: "A base color with splatters of other colors, creating a striking effect."},
  {id: 14, name: "Sunburst", colors: 2, desc: "A gradient effect that radiates from the center to the edge, resembling a sunburst."},
  {id: 15, name: "Translucent", colors: 1, desc: "Clear and see-through colors such as translucent blue, pink, and red."},
  {id: 16, name: "Tri-Color", colors: 3, desc: "Three distinct colors pressed together, often in a pie-slice pattern."},
  {id: 17, name: "Two-Tone", colors: 2, desc: "Two colors split down the middle, creating a half-and-half effect."}
];

//TODO - renderForm function
// #region renderForm
// needs to render header, footer, and dropdown options.
function renderForm(listName, item, formType) {
  //Handle Body here
  //TODO - treat styles as a seperate section, render a different number of fields (maybe labels too?) depending on style type chosen, move styles above colors
  VinylStyle.forEach((option) => {
    const styleOption = `<option value="${option.id}">${option.name}</option>`;
    $("#vinylStyleList").append(styleOption);
  });

  //Handle conditions here
  switch(formType) {
    case "update":
      $('#formTitle').html(`Update ${item.albumName} by ${item.artistName}`);
      $('#formBtns').html(`
        <input type="submit" id="submitUpdate" data-itemid="${item.devData.id}" target="#" value="Save"/>
        <input type="button" id="cancelUpdate" value="Cancel"/>
        <div id="removeBtnContainer">
          <input type="button" id="removeVinyl" data-itemid="${item.devData.id}" value="Remove Vinyl"/>
        </div>
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
};

// #region renderStyleSection
//Needs to be called everytime the style dropdown changes
function renderStyleSection(item) {
  if(item) { 
  localStorage.setItem("styleItem", JSON.stringify(item));
  let elem = '';
  let curr = 0;
  colorsCount = item.colors;
  console.log(colorsCount);
  for(let i = 0; i < colorsCount; i++) {
    curr = i + 1;
    elem += `
      <li id="colorItem${curr}">
        <label for="color">${item.name} Color ${i + 1}:
          <input list="colorsList" name="color" id="colors${curr}">
          <datalist id="colorsList${curr}">
        </label>
        <input type="color" class="colorHex" id="colorHex${curr}"></input>
      </li>
    `;
  }
  $('#designSectionColors').html(elem);
  $('#styleColorsBtns').html(`
    <button type="button" id="styleColorsAdd">+</button>
    <button type="button" id="styleColorsSub" ${colorsCount === 0 ? "disabled" : ""}>-</button>
  `);
  } else {
    $('#designSectionColors').html('');
    $('#styleColorsBtns').html('');
  }
};


// #region addStylesColor
/**Used to add another color input to the styles section*/
function addStylesColor() {
  item = JSON.parse(localStorage.getItem("styleItem"));
  colorsCount += 1;
  $('#designSectionColors').append(`
    <li id="colorItem${colorsCount}">
      <label for="color${colorsCount}">${item.name} Color ${colorsCount}:
        <input list="colorsList" name="color${colorsCount}" id="colors${colorsCount}">
        <datalist id="colorsList${colorsCount}">
      </label>
      <input type="color" class="colorHex" id="colorHex${colorsCount}"></input>
    </li>
  `);
  $('#styleColorsSub').removeAttr('disabled');
};


// #region removeStylesColor
/**Used to remove color input from the styles section*/
function removeStylesColor() {
  if(colorsCount > 0) { 
    $(`#colorItem${colorsCount}`).remove();
    colorsCount--;
    if(colorsCount === 0){ 
      $('#styleColorsSub').attr('disabled', 'disabled'); 
    }
  }
};


// #region renderFormFooter
/**Renders the buttons on form based on the type of changes being made */
function renderFormFooter(listName, item, formType) {
  switch(formType) {
    case "update":
      $('#formTitle').html(`Update ${item.albumName} by ${item.artistName}`);
      $('#formBtns').html(`
        <input type="submit" id="submitUpdate" data-itemid="${item.devData.id}" target="#" value="Save"/>
        <input type="button" id="cancelUpdate" value="Cancel"/>
        <div id="removeBtnContainer">
          <input type="button" id="removeVinyl" data-itemid="${item.devData.id}" value="Remove Vinyl"/>
        </div>
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
};

// #region parseFormData
/**Returns the value entered in the form as a JSON object */
function parseFormData(listName, item) {
  var myFormData = new FormData(document.querySelector('form'));
  const formDataObj = {};
  const date = new Date();
  date.setHours(date.getHours() - 6);

  myFormData.forEach((value, key) => (formDataObj[key] = value));

  for(var i in formDataObj){
    if(formDataObj[i].length < 1){
      formDataObj[i] = "None";
    }
  }
 
  //TODO - Look into updating the design object color property to use one property (remove colorSec) and instead store an array similar to tracklist
  //TODO - create a type declaration for VinylStyle with a list of options that will later populate a style dropdown.
  const newListItem = {
    albumName: formDataObj.albumName,
    artistName: formDataObj.artistName,
    description: formDataObj.description,
    design: {
      colors: [],
      vinylStyle: Number(formDataObj.vinylStyle)
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

  for(i = 0; i < colorsCount; i++){
    newListItem.design.colors.push({
      id: i + 1,
      value: $(`#colors${i + 1}`).val(),
    });
  };

  for(var i = 0; i < trackCount; i++) {
    newListItem.tracklist.push({
      trackName: $(`#tracknum${i + 1}`).val(),
      trackNum: i + 1,
    })
  };

  if(item === null){
    newListItem.devData = {
      id: listName.substring(0, 1) + date.toISOString(),
      modifiedDate: date.toISOString(),
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
function createRequestBody(item) {
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
  // const firstChar = devId.toString().charAt(0);
  const listObj = getList(devId);
  // const test = list.list.find((listItem) => listItem.devData.id === devId);
  // console.log("test: ", test);
  // return list.list[devId.replace(firstChar, "")];
  return listObj.list.find((listItem) => listItem.devData.id === devId);
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
};


// #region pushToRepo
/**Takes a "request body" object and pushes it to the Github repo. */
function pushToRepo(promiseRequestBody, item, submissionType, secondaryList) {
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
        workflowOpenSubmitDialog(item, true, submissionType, secondaryList);
      } else {
        console.log(`[script.js - pushToRepo] - Failed to push to Github, status: ${response.status}`)
        workflowOpenSubmitDialog(item, false, submissionType, secondaryList);
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

  collection.forEach((item) => {
    $('#collectionList').append(`
      <div class="colItem">
        <a href="#" class="colEditBtn editExistingBtn" data-itemId="${item.devData.id}">edit</a>
        <p>${item.albumName}</p>
        <img src="${item.imageurl}" class="colVinylImage"></img>
      </div>
    `);
  });
};


// #region modifyList
/**Handles the addition, modification, or removal of a vinyl for any given list */
function modifyList(listName, item, modType){
  let fullList = JSON.parse(localStorage.getItem("fullList"));
  let list = JSON.parse(localStorage.getItem(listName));
  let commitMessage = "";
  const date = new Date();
  date.setHours(date.getHours() - 5);
  item.devData.modifiedDate = date.toISOString();

  switch(modType){
    case "add":
      if(listName === "removed"){
        throw `[script.js - modifyList] - Cannot "Add" to removed list, set modType to "removed" to remove an item.`;
      }

      listName === "wishlist" ? item.devData.wishlistedDate = date.toISOString() : null;
      listName === "collection" ? item.devData.collectedDate = date.toISOString() : null;

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
      item.devData.removedDate = date.toISOString();
      fullList[listName] = fullList[listName].filter((listObj) => listObj.devData.id !== item.devData.id);
      commitMessage = `Remove ${item.albumName} by ${item.artistName} from the ${listName}`;
      break;
    default:
      console.error(`[script.js - modifyList] - Failed to modify list, modType not provided or invalid.  Received: ${modType}`);
      break;
  }
  return[fullList, commitMessage];
};


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
async function toggleDev(test) {
  devMode = !devMode;
  if($('#devToggle').attr('checked')) {
    apiUrl = `https://api.github.com/repos/Guinewok/vinylWishlist/contents/vinylWishlist.json`;
    $('.devFeature').hide();
  } else {
    apiUrl = `https://api.github.com/repos/Guinewok/vinylWishlist/contents/test.json`;
    $('.devFeature').show();
  };
  incrementVar = 0;
  await getData();
  renderWishlist();
  renderCollection();
};

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