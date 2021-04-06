<template>
  <div class="container-fluid position-relative">
    <div
      v-if="!currentSong || !refreshToken"
      class="row justify-content-center py-3"
    >
      <div class="col-auto text-center">
        <a :href="authUrl" class="btn rounded-pill btn-success">
          Login With Spotify
        </a>
      </div>
    </div>
    <div v-else>
      <div
        class="row justify-content-center position-sticky song-title shadow-lg"
        v-if="currentSong"
      >
        <div class="col-12 text-center py-3 border-bottom ">
          <h4>
            <span v-for="artist in currentSong.item.artists" :key="artist.id">
              {{ artist.name }}</span
            >
          </h4>
          <h1>{{ currentSong.item.name }}</h1>
          <span>{{ currentSong.item.album.name }}</span>
        </div>
      </div>
      <div class="row my-lg-2 justify-content-center ">
        <div class="col-8 text-center">
          <p v-if="lyrics.length > 0" style="white-space: pre-line">
            {{ lyrics }}
          </p>
          <p v-else>
            Sorry, we could not find any lyrics for this song
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import axios from 'axios';
  require('dotenv').config();
  var SpotifyWebApi = require('spotify-web-api-node');
  var spotifyApi;
  export default {
    name: 'landing-page',
    components: {},
    methods: {
      createAuthURL() {
        var scopes = [
            'user-read-private',
            'user-read-email',
            'user-read-currently-playing'
          ],
          redirectUri = 'http://localhost:9080',
          clientId = process.env.SPOTIFY_CLIENT_URL,
          clientSecret = process.env.SPOTIFY_CLIENT_SECRET,
          state = 'kgyg9bu4';

        spotifyApi = new SpotifyWebApi({
          redirectUri: redirectUri,
          clientId: clientId,
          clientSecret: clientSecret
        });

        this.authUrl = spotifyApi.createAuthorizeURL(scopes, state);
      },
      async refreshAccessToken() {
        await spotifyApi.refreshAccessToken().then(
          data => {
            console.log('The access token has been refreshed!');

            // Save the access token so that it's used in future calls
            spotifyApi.setAccessToken(data.body['access_token']);
          },
          function(err) {
            console.log('Could not refresh access token', err);
          }
        );
      },
      async init() {
        this.createAuthURL();
        const params = new URLSearchParams(window.location.search);

        if (params.get('code') && !localStorage.getItem('refreshToken')) {
          this.isLoading = true;
          spotifyApi.authorizationCodeGrant(params.get('code')).then(
            data => {
              this.isLoading = false;
              // Set the access token on the API object to use it in later calls
              spotifyApi.setAccessToken(data.body['access_token']);
              spotifyApi.setRefreshToken(data.body['refresh_token']);
              localStorage.setItem('refreshToken', data.body['refresh_token']);
              this.refreshToken = localStorage.getItem('refreshToken');
              window.history.replaceState(null, null, window.location.pathname);
              this.getCurrentPlayingSong();
            },
            function(err) {
              console.log('Something went wrong!', err);
            }
          );
        } else if (localStorage.getItem('refreshToken')) {
          this.refreshToken = localStorage.getItem('refreshToken');
          await spotifyApi.setRefreshToken(this.refreshToken);
          await this.refreshAccessToken();
          this.getCurrentPlayingSong();
        }
      },
      getSomethingFromSpotifyApi() {},
      getCurrentPlayingSong() {
        this.refreshAccessToken().then(() => {
          spotifyApi.getMyCurrentPlayingTrack().then(
            data => {
              this.title = data.body.item.name;
              this.currentSong = data.body;
              this.getLyrics();
            },
            function(err) {
              console.error(err);
            }
          );
        });
        setInterval(() => {
          this.refreshAccessToken().then(() => {
            spotifyApi.getMyCurrentPlayingTrack().then(
              data => {
                //check if title doesnt equal current track so we know it's a new song
                if (data.body.item.name != this.title) {
                  this.title = data.body.item.name;
                  this.currentSong = data.body;

                  this.getLyrics();
                }
              },
              function(err) {
                console.error(err);
              }
            );
          });
        }, 1000);
      },
      getLyrics() {
        console.log('getting lyrics');
        axios
          .get(
            'https://api.lyrics.ovh/v1/' +
              this.currentSong.item.artists[0].name +
              '/' +
              this.currentSong.item.name
          )
          .then(res => {
            this.lyrics = res.data.lyrics;
            this.isLoading = false;
          })
          .catch(err => {
            console.error(err);
            this.lyrics = '';
          });
      }
    },
    data() {
      return {
        isLoading: false,
        title: '',
        lyrics: '',
        authUrl: '',
        refreshToken: '',

        currentSong: {}
      };
    },
    mounted() {
      this.init();
    }
  };
</script>

<style lang="scss">
  @import url('https://fonts.googleapis.com/css?family=Roboto+Mono');
  body {
    background-color: rgb(22, 22, 22);
    color: rgb(196, 196, 196);
    font-family: 'Roboto Mono', sans-serif;
    -webkit-app-region: drag;
  }

  .song-title {
    background-color: rgb(22, 22, 22);
    color: rgb(196, 196, 196);

    top: 0px;
  }
</style>
