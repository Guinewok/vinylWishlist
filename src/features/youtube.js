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

genreDropdown ? genreDropdown.addEventListener("change", (item) => {
  console.log("selection made: ", item.target.value);
  localStorage.setItem("topic", item.target.value);
}) : null;

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
