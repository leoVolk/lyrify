<template>
  <div class="container-fluid">
    <div class="row">
      <div
        v-if="refreshToken.length === 0 || !currentSong"
        class="row justify-content-center py-3"
      >
        <div class="col-auto text-center">
          <a
            :href="authUrl"
            target="_blank"
            class="btn rounded-pill btn-success"
          >
            Login With Spotify
          </a>
        </div>
      </div>
      <div class="shadow-lg position-sticky song-title">
        <div class="row justify-content-center">
          <div class="col-12 text-center py-3 border-bottom ">
            <h4>
              <span v-for="artist in currentSong.item.artists" :key="artist.id">
                {{ artist.name }}</span
              >
            </h4>
            <h1>{{ currentSong.item.name }}</h1>
            <span>{{ currentSong.item.album.name }}</span>
          </div>
          <div class="album-background">
            <img
              id="album-cover"
              class="img-cover"
              :src="currentSong.item.album.images[0].url"
            />
          </div>
        </div>
      </div>
      <div v-if="currentSong" class="row my-lg-2 justify-content-center ">
        <div class="col-8 text-center">
          <p v-if="lyrics.length > 0" style="white-space: pre-line">
            {{ lyrics }}
          </p>
          <p v-else>
            Sorry, we could not find any lyrics for "{{
              currentSong.item.name
            }}" by {{ currentSong.item.artists[0].name }}
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
          if (!this.refreshToken) return;
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

        currentSong: null
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
    -webkit-app-region: drag !important;
  }

  .img-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .song-title {
    background-color: rgb(22, 22, 22);
    color: rgb(196, 196, 196);

    overflow: hidden;
    top: 0px;

    .album-background {
      position: absolute;
      width: 100%;
      height: 100%;
      z-index: -1;
      filter: blur(5px);
    }
  }

  /* width */
  ::-webkit-scrollbar {
    width: 6px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: transparent;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: #1db954;
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: #2aff75;
  }

  .border-bottom {
    border-color: #1db954 !important;
    border-width: 2px !important;
  }
</style>
