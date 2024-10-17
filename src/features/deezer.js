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