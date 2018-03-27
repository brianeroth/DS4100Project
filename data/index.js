require("dotenv").config();
var SpotifyWebApi = require("spotify-web-api-node");
var fs = require("fs");
var mysql = require("mysql");

var connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME
});
var spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});
const PLAYLIST_LIMIT = 50; // the maximum number of playlists we can pull per API request
const TRACK_LIMIT = 100; // the maximum number of tracks we can pull per API request
const SPOTIFY_USERNAME = "spotify"; // Spotify's username on Spotify
const THROTTLE_MS = 1000;

/**
 * Utility function to throttle promises by x milliseconds
 */
function sleeper(ms) {
  return function(x) {
    return new Promise(resolve => setTimeout(() => resolve(x), ms));
  };
}

/**
 * Pulls down all of Spotify's-curated playlists
 */
function pullPlaylistsFromSpotify(offset, playlists) {
  return new Promise(function(resolve) {
    spotifyApi.getUserPlaylists(SPOTIFY_USERNAME, {
      limit: PLAYLIST_LIMIT,
      offset
    }).then(data => {
      console.log("Pulling at offset " + offset);
      return offset >= data.body.total ? resolve(playlists) : resolve(pullPlaylistsFromSpotify(offset + PLAYLIST_LIMIT, playlists.concat(data.body.items)));
    });
  });
}

/**
 * Inserts all of the playlists into the playlists table in the DB
 */
function insertPlaylistsIntoDB(playlists) {
  for (var i = 0; i < playlists.length; i++) {
    var p = playlists[i];
    connection.query("INSERT INTO playlists (id, href, name, owner, collaborative) VALUES (?, ?, ?, ?, ?)", [p.id, p.href, p.name, p.owner.id, p.collaborative], function(error, results, fields) {});
  }
}

/**
 * Pulls the follower counts for all of the playlists
 */
function pullFollowerCounts(playlist) {
  return Promise.resolve().then(sleeper(THROTTLE_MS)).then(() => {
    spotifyApi.clientCredentialsGrant().then(data => {
      spotifyApi.setAccessToken(data.body["access_token"]);
    }).then(() => {
      spotifyApi.getPlaylist(SPOTIFY_USERNAME, playlist.id).then(data => {
        console.log("Pulling playlist " + playlist.id);
        return {
          id: playlist.id,
          count: data.body.followers.total
        };
      }).then(o => {
        connection.query("UPDATE playlists SET followers = ? WHERE id = ?", [o.count, o.id], function(error, results, fields) {});
      }).catch(e => {
        console.log(e);
        Promise.reject();
      });
    })
  });
}

/**
 * Pulls the tracks for a playlist
 */
function pullTracksForPlaylist(playlist, offset, tracks) {
  return Promise.resolve().then(sleeper(THROTTLE_MS)).then(() => {
    spotifyApi.getPlaylistTracks(SPOTIFY_USERNAME, playlist.id, {
      limit: TRACK_LIMIT,
      offset
    }).then(data => {
      console.log("Pulling tracks for playlist " + playlist.id);
      return offset >= data.body.total ? tracks : pullTracksForPlaylist(playlist, offset + TRACK_LIMIT, tracks.concat(data.body.items));
    }).then(trackList => {
      if (trackList !== undefined) {
        for (var i = 0; i < trackList.length; i++) {
          var t = trackList[i].track;
          connection.query("INSERT INTO tracks (id, name, popularity, album, artists, duration_in_ms, explicit) VALUES (?, ?, ?, ?, ?, ?, ?)", [t.id, t.name, t.popularity, t.album.name, t.album.artists[0].name, t.duration_ms, t.explicit], function(error, results, fields) {});
          connection.query("INSERT INTO tracks_to_playlists (playlist_id, track_id) VALUES (?, ?)", [t.id, playlist.id], function(error, results, fields) {});
        }
      }
    }).catch(e => {
      console.log(e);
      Promise.reject();
    });
  }).catch(e => {
    console.log(e);
    Promise.reject();
  });
}

/**
 * Get audio features for a single track
 */
function pullAudioFeaturesForTrack(track) {
  return Promise.resolve().then(sleeper(1000)).then(() => {
    spotifyApi.getAudioFeaturesForTrack(track.id).then(data => {
      console.log("Pulling audio features for track " + track.id);
      var f = data.body;
      connection.query("INSERT INTO track_audio_features (id, danceability, energy, integer_key, loudness, mode, speechiness, acousticness, instrumentalness, liveness, valence, tempo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [track.id, f.danceability, f.energy, f.key, f.loudness, f.mode, f.speechiness, f.acousticness, f.instrumentalness, f.liveness, f.valence, f.tempo], function(error, results, fields) {});
    }).catch(e => {
      console.log(e);
      Promise.reject();
    })
  }).catch(e => {
    console.log(e);
    Promise.reject();
  });
}

/**
 * Loop through all tracks and go get their audio features
 */
async function pullAudioFeatures(tracks) {
  for (var i = 0; i < tracks.length; i++) {
    var audioFeatures = await pullAudioFeaturesForTrack(tracks[i]);
  }
}

/**
 * Kicks off the data import process
 */
async function start() {
  spotifyApi.clientCredentialsGrant().then(data => {
    spotifyApi.setAccessToken(data.body["access_token"]);
    connection.connect();
    (async () => {
      var playlists = await pullPlaylistsFromSpotify(0, []);
      insertPlaylistsIntoDB(playlists);

      for (var i = 0; i < playlists.length; i++) {
        var followerCounts = await pullFollowerCounts(playlists[i]);
      }

      for (var i = 0; i < playlists.length; i++) {
        var tracks = await pullTracksForPlaylist(playlists[i], 0, []);
      }

      connection.query("SELECT * FROM tracks", function(error, results, fields) {
        pullAudioFeatures(results);
      });
    })();
  });
};

start();
