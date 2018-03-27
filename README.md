# DS 4100 Project

The goal of this project is to determine if there are any correlations between a playlist's follower count and the audio features (danceability, energy, instrumentalness, etc.) of the tracks inside the playlist. I'm pulling down approximately 1650 playlists curated by Spotify via the company's [API](https://developer.spotify.com), and performing the analysis in R.

## Requirements
1. Node.js
2. MySQL
3. R/RStudio
4. Spotify API credentials (client ID and client secret, available [here](https://developer.spotify.com))

## Getting setup
1. Run the `create.sql` script in `db/`
2. Run `npm install` in `data/`
3. Run `cp .env.sample .env` in `/` and fill in the key values
4. Run `node index.js` in `data/`
5. TBD

## Technical note on Spotify's API
When pulling down data from the Spotify API, it's necessary to make several calls to different endpoints (for example, getting all of the playlists associated with Spotify's username, followed by a seperate call to get the playlist's follower counts, followed by another call to get the playlist's tracks, etc.).

I found during the development process that some playlists fail to retrieve contents at certain endpoints. For example, even though a playlist is returned in the initial request to get all playlists, it 404s when hitting the endpoint to get its follower counts. There doesn't seem to be any consistency in which playlists fail as it changes every time the script is run. There's usually between 70-85 playlists that fail at some endpoint.

Instead of dealing with the missing information in the data collection process, I decided to handle it during analysis in R.
